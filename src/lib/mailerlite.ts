import { isIP } from "node:net";

/**
 * Alta en MailerLite, la lista de email de Ari.
 *
 * Cada web mete a la chica en el grupo por el que entró: el plan, el workshop, la compra
 * de la Comunidad… Entrar en un grupo es lo que arranca su secuencia en MailerLite, así
 * que el grupo decide qué emails recibe. El montaje entero (campos, grupos, segmentos y
 * caminos) está en el repo de operaciones: 03-embudo/emails/montaje-mailerlite.md.
 *
 * POR QUÉ DESDE AQUÍ Y NO CON UN WORKFLOW DE GHL (Carlos, 2026-10-24): cada web sabe por
 * dónde entró la chica, es instantáneo y no cuesta acciones de pago por uso de GHL.
 *
 * REGLAS DURAS:
 *   · NUNCA impide guardar la lead ni cobrar. Se llama después de responder (`after()`)
 *     y cualquier fallo se queda en un console.error.
 *   · Sin MAILERLITE_TOKEN no hace nada: se puede desplegar antes de tener la clave.
 *   · A quien se dio de baja no se la vuelve a apuntar.
 *   · Los grupos se suman, nunca se quitan, y un campo vacío no se manda (no borra el que
 *     tenía). El `origen` se acumula («plan+masterclass») y la `etapa` no baja: una alumna
 *     que pide el plan sigue siendo alumna.
 *   · Las menores de 14 no entran: en España no pueden dar su consentimiento.
 *
 * Variables de entorno:
 *   MAILERLITE_TOKEN → la clave de la API de la cuenta de AR (Integraciones → API), la de
 *                      ariannyrivasacademy@gmail.com. Nunca la de Visualait.
 */

const API = "https://connect.mailerlite.com/api";

// Los ids de los grupos (montaje-mailerlite.md §9). No son secretos.
export const GRUPO = {
  plan: "201685594213975647", // «Plan personalizado»
  masterclass: "201685595088487481", // «Masterclass sep 2026»
  alumnasComunidad: "201685612201248062", // «Alumnas Comunidad»
  workshop: "202226448988112797", // «Workshop 24-11 · compradoras» (el grupo de WhatsApp y los avisos del directo)
} as const;

// Las etapas, de menos a más. Una chica nunca baja de etapa por volver a entrar.
const ETAPAS = ["lead", "en-conversacion", "seguimiento", "comunidad", "tpm"] as const;
type Etapa = (typeof ETAPAS)[number];

export type Alta = {
  email: string;
  grupo: string | string[]; // uno o varios: se suman a los que ya tenía
  nombre?: string; // el nombre completo: se parte en nombre y apellido
  origen?: string; // plan · masterclass · workshop
  etapa?: Etapa;
  edad?: number | null;
  pais?: string; // el país tal cual; va al campo de serie `country`
  region?: string; // ver `regionDe`
  ocupacion?: string;
  dolorPlan?: string;
  planUrl?: string;
  consentimiento?: string; // dónde dejó el email: «formulario plan», «compra comunidad»…
  ghlId?: string;
  ip?: string;
};

// La región, a partir del grupo de país del selector de /plan. Es la que decide la hora de
// envío y si se nombra SeQura (solo España).
const REGION: Record<string, string> = {
  España: "espana",
  "Resto de Europa": "europa",
  "Estados Unidos o Canadá": "eeuu-canada",
  Latinoamérica: "latam",
};

export function regionDe(grupoPais: string): string {
  if (!grupoPais) return "";
  return Object.prototype.hasOwnProperty.call(REGION, grupoPais) ? REGION[grupoPais] : "otro";
}

// Dominios mal tecleados que se corrigen al dar de alta (Carlos, 2026-10-23: «se
// equivocaron las chicas, pero no vamos a perder el contacto»). Solo en MailerLite: en GHL
// se queda como lo escribió ella.
const DOMINIO_BIEN: Record<string, string> = {
  "gmsil.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.vom": "gmail.com",
  "gmqil.com": "gmail.com",
  "gmqil.vom": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "icloud.clm": "icloud.com",
  "icloud.con": "icloud.com",
  "outlook.con": "outlook.com",
};

export function corregirEmail(bruto: string): string {
  const email = String(bruto || "").trim().toLowerCase();
  const i = email.lastIndexOf("@");
  if (i < 1) return "";
  const dominio = email.slice(i + 1);
  const bien = Object.prototype.hasOwnProperty.call(DOMINIO_BIEN, dominio) ? DOMINIO_BIEN[dominio] : dominio;
  return email.slice(0, i + 1) + bien;
}

// «plan» + «masterclass» → «plan+masterclass». Sin repetir y en el orden en que llegó.
export function sumarOrigen(antes: unknown, nuevo: string): string {
  const partes = String(antes || "").split("+").map((p) => p.trim()).filter(Boolean);
  if (nuevo && !partes.includes(nuevo)) partes.push(nuevo);
  return partes.join("+");
}

// La etapa nueva solo si es más alta que la que tenía.
export function subirEtapa(antes: unknown, nueva: Etapa): Etapa {
  const i = ETAPAS.indexOf(String(antes || "") as Etapa);
  return i > ETAPAS.indexOf(nueva) ? ETAPAS[i] : nueva;
}

type Suscriptora = { status: string; fields: Record<string, unknown> };
type Resp = { ok: boolean; status: number; datos: unknown };

async function ml(token: string, metodo: string, ruta: string, cuerpo?: unknown): Promise<Resp> {
  try {
    const r = await fetch(API + ruta, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    let datos: unknown = null;
    try {
      datos = await r.json();
    } catch {
      // sin cuerpo
    }
    return { ok: r.ok, status: r.status, datos };
  } catch (e) {
    return { ok: false, status: 0, datos: String(e).slice(0, 200) };
  }
}

const corto = (r: Resp) => JSON.stringify(r.datos ?? "").slice(0, 300);

// Fecha y hora en UTC con el formato que pide MailerLite (yyyy-MM-dd HH:mm:ss).
const ahoraUTC = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export async function altaEnMailerLite(a: Alta): Promise<void> {
  const token = process.env.MAILERLITE_TOKEN;
  if (!token) return;

  const edad = typeof a.edad === "number" && Number.isFinite(a.edad) ? a.edad : null;
  if (edad !== null && edad < 14) {
    console.log("mailerlite: menor de 14; no entra");
    return;
  }
  const email = corregirEmail(a.email);
  if (!email) return;
  if (email !== a.email.trim().toLowerCase()) console.log("mailerlite: email con el dominio corregido");

  try {
    // Lo que ya tenía, para no volver a apuntar a una baja, acumular el origen y no bajarle
    // la etapa. Si no se sabe (MailerLite no contesta), el origen y la etapa no se mandan.
    const previa = await ml(token, "GET", `/subscribers/${encodeURIComponent(email)}`);
    const nueva = previa.status === 404;
    const sabida = previa.ok || nueva;
    const antes = previa.ok ? ((previa.datos as { data?: Suscriptora })?.data ?? null) : null;
    if (!sabida) console.error("mailerlite: no se pudo leer la suscriptora", previa.status, corto(previa));

    if (antes && ["unsubscribed", "bounced", "junk"].includes(antes.status)) {
      console.log("mailerlite: está dada de baja (" + antes.status + "); no se toca");
      return;
    }
    const tenia = antes?.fields ?? {};

    const [nom, ...resto] = String(a.nombre || "").trim().split(/\s+/);
    const campos: Record<string, string | number> = {};
    const poner = (clave: string, valor: string | number | null | undefined) => {
      if (valor !== null && valor !== undefined && valor !== "") campos[clave] = valor;
    };
    poner("name", nom);
    poner("last_name", resto.join(" "));
    poner("country", a.pais);
    poner("region", a.region);
    poner("edad", edad);
    poner("menor", edad === null ? (nueva ? "desconocida" : "") : edad < 18 ? "si" : "no");
    poner("ocupacion", a.ocupacion);
    poner("dolor_plan", a.dolorPlan);
    poner("plan_url", a.planUrl);
    poner("ghl_id", a.ghlId);
    if (sabida && a.origen) poner("origen", sumarOrigen(tenia.origen, a.origen));
    if (sabida && a.etapa) poner("etapa", subirEtapa(tenia.etapa, a.etapa));
    if (nueva) {
      poner("consentimiento", a.consentimiento);
      poner("fecha_alta", new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }));
    }

    const grupos = Array.isArray(a.grupo) ? a.grupo : [a.grupo];
    const cuerpo: Record<string, unknown> = { email, fields: campos, groups: grupos };
    // La prueba del alta (dónde y cuándo dejó el email), solo la primera vez.
    if (nueva) {
      cuerpo.opted_in_at = ahoraUTC();
      if (a.ip && isIP(a.ip)) cuerpo.optin_ip = a.ip;
    }

    let r = await ml(token, "POST", "/subscribers", cuerpo);
    if (!r.ok && (r.status === 0 || r.status === 429 || r.status >= 500)) {
      await new Promise((ok) => setTimeout(ok, 700));
      r = await ml(token, "POST", "/subscribers", cuerpo);
    }
    if (!r.ok) console.error("mailerlite: el alta falló", r.status, corto(r));
  } catch (e) {
    console.error("mailerlite: error inesperado", String(e).slice(0, 200));
  }
}
