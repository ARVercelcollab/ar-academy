import { NextResponse, after } from "next/server";
import { urlDePlan } from "@/lib/plan/token";
import { cierreRecomendado } from "@/lib/plan/contenido";
import { faseComunidad } from "@/lib/comunidad";
import { type Candidata, elegirFicha, normalizaHandle } from "@/lib/plan/instagram";
import { TAG_PLAN_PAGADO, TAG_PLAN_SIN_PAGAR, tarjetaSinPagar, tienePlanPagado } from "@/lib/plan/pagado";
import { GRUPO, altaEnMailerLite, regionDe } from "@/lib/mailerlite";

/**
 * Formulario del plan personalizado (/plan) → GHL.
 *
 * DESDE EL 7-11-2026 EL PLAN ES DE PAGO (10 €, Carlos). Esta ruta guarda la ficha al rellenar el
 * formulario, marcada `plan · sin pagar` y con su tarjeta en «Plan personalizado · 0 · Sin pagar».
 * Al PAGAR, en /api/plan/pago (src/lib/plan/pagado.ts), la tarjeta pasa a la 1 (o a la 6), llegan
 * `revisar humano`, MailerLite y el evento de Meta. Una chica que no paga queda en la columna «Sin
 * pagar», sin la secuencia de emails y sin contar como solicitud en Meta.
 *
 * POR QUÉ AQUÍ Y NO DESDE LA PÁGINA: el token de GHL da acceso de escritura a toda la
 * cuenta. Desde el navegador lo vería cualquiera que abra el código. Aquí vive en el
 * servidor, en las variables de entorno de Vercel.
 *
 * QUÉ HACE, EN ORDEN:
 *   0. Filtros: la petición tiene que venir de nuestra web (cabecera Origin), el campo
 *      trampa tiene que llegar vacío y el email y el teléfono tienen que tener forma de
 *      email y de teléfono. La página ya valida lo mismo: esto es para lo que no pasa
 *      por la página.
 *   1. Su ficha de Instagram, si ya la tiene: se busca por el @ (`fichaDeInstagram`) y,
 *      si aparece una sola, se escriben AHÍ su nombre, el correo, el teléfono y las
 *      respuestas. Así la conversación de Instagram, el plan y el WhatsApp que manda
 *      después quedan en una sola ficha, y su tarjeta de Captación pasa al Plan. Si no
 *      la tiene (o no se puede escribir en ella), upsert del contacto por email/teléfono
 *      como siempre — SIN etiquetas. Comprobado el 2026-09-17: si se le pasan, GHL
 *      SUSTITUYE las que tenía. Una chica que ya hablaba con Sofi perdía su estado entero
 *      al rellenar el formulario. Un reintento si GHL falla.
 *   2. RESPONDE YA, con el id del contacto. La página espera como mucho 4 s antes de
 *      pasar a /plan/gracias; antes se hacían 6-7 llamadas en serie y, si GHL iba lento,
 *      se iba sin el id. Lo demás va en `after()` (sigue corriendo tras responder):
 *        · las etiquetas, con el endpoint que SUMA (`POST /contacts/{id}/tags`): `plan · sin
 *          pagar` y `bot en pausa` (en la lista de exclusión de Sofi, así que aunque la chica
 *          escriba por Instagram, Sofi calla), y la de origen:
 *          `origen · youtube|anuncio|instagram|directo|otro`.
 *        · `plan_url` y la nota con sus respuestas, su origen y los enlaces de su plan.
 *      Las tres tocan el contacto y van una detrás de otra.
 *
 * El formulario solo escribe evidencia. El nivel de la lead y `menor de 24` los
 * reconcilia el backend de Sofi: jamás se ponen desde aquí.
 *
 * Variables de entorno:
 *   GHL_TOKEN        → Private Integration Token (pit-…)
 *   GHL_LOCATION_ID  → VRsUMhSaFqWKEQ05Q5kF
 *   META_PIXEL_ID    → 1613484133037939 (el píxel de la cuenta de la academia)
 *   META_CAPI_TOKEN  → token de la Conversions API de ese píxel. Sin él (o sin
 *                      META_PIXEL_ID) no se manda nada a Meta y no se rompe nada.
 *   META_CAPI_SOLO_CON_CONSENTIMIENTO  → "1" para mandar a Meta solo si aceptó las
 *                      cookies (versión B de la decisión D6, pendiente de Carlos). Sin
 *                      ella se manda siempre, como hace la masterclass.
 *   MAILERLITE_TOKEN → la clave de la API de MailerLite. Sin ella no se da de alta en la
 *                      lista de email y no se rompe nada.
 *
 * Historia: vivió como función serverless en plan.ariannyrivasacademy.com (repo de
 * operaciones, 03-embudo/landing/api/lead.js) hasta el 2026-09-17, cuando la landing
 * se mudó aquí. Ver 00-contexto/decisiones.md en ese repo.
 */

const API = "https://services.leadconnectorhq.com";

// La tarjeta: «0 · Sin pagar» al rellenar; al pagar, 1 · Solicita plan, o 6 · Comunidad si marca
// menos de 750 € (src/lib/plan/pagado.ts).

// ── Campos personalizados (IDs reales de la location) ─────────────────────────
// Las preguntas tal cual las ve ella en /plan (public/plan/index.html, `var S`).
// Van en la nota del contacto para que quien la atienda lea lo que contestó sin
// buscar campos. Si cambia una pregunta en el formulario, cambia aquí.
const PREGUNTAS: [campo: string, texto: string][] = [
  ["ocupacion", "¿A qué te dedicas actualmente?"],
  ["ingresos_actuales", "¿Cuánto estás ingresando al mes ahora mismo?"],
  ["dolor_principal", "¿Cuál es tu principal problema hoy para generar más ingresos con tu imagen?"],
  ["objetivo_ingresos", "¿Cuánto te gustaría generar al mes con tu imagen y tu marca personal?"],
  ["punto_actual", "¿En qué punto estás hoy?"],
];

function notaFormulario(
  b: Record<string, unknown>,
  edad: number,
  paisNombre: string,
  ig: string,
  origen: string,
) {
  const fecha = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const lineas = [`Formulario del plan personalizado · ${fecha}`, ""];
  for (const [campo, texto] of PREGUNTAS) {
    const r = enLinea(b[campo], 300);
    if (r) lineas.push(texto, `→ ${r}`, "");
  }
  const ficha = [
    Number.isFinite(edad) ? `Edad: ${edad}` : "",
    paisNombre ? `País: ${enLinea(paisNombre, 60)}` : "",
    ig ? `Instagram: @${enLinea(ig, 80)}` : "",
  ].filter(Boolean);
  if (ficha.length) lineas.push(ficha.join(" · "));
  if (origen) lineas.push(origen);
  return lineas.join("\n").trim();
}

const CAMPO: Record<string, string> = {
  pais: "Fa3wIcXiLSVPqSiPh8IT",
  edad: "88m7ssAx938v1EDSUkwy",
  ocupacion: "ZUijgP2DDrGjc7QtABn4",
  dolor_principal: "Qa2YdPWLsrlU1AZxPwkv",
  ig_handle: "HZp3lXGMOGol5cU7RvvW",
  ingresos_actuales: "Y3m8c3leyhSexHnd3fUI",
  objetivo_ingresos: "KEy5615AVTdYDoTLHVLv",
  // `contact.plan_url`: el enlace de SU plan. Así la setter (o un mensaje de GHL) puede
  // usar {{contact.plan_url}} sin abrir la nota.
  plan_url: "tNATA2ZlyZ95UDQiRrkg",
};

// ── Etiquetas, con los nombres del 2026-08-19 ─────────────────────────────────
const TAG_INICIO_PLAN = "inicio-plan-personalizado"; // «ha iniciado», no «se le envió»
const TAG_MAYOR_EDAD = "mayor de edad";
const TAG_MENOR_EDAD = "menor de edad";
const TAG_PUEDE_PAGAR = "puede pagar";
const TAG_HT_PAIS_OK = "ht-pais-ok";
// Desde el 7-11 el plan es de pago (10 €): `revisar humano` (el panel de las setters) y la tarjeta
// llegan al pagar (src/lib/plan/pagado.ts). Hasta entonces la ficha queda marcada «sin pagar».
const TAG_SIN_PAGAR = TAG_PLAN_SIN_PAGAR;
const TAG_BOT_EN_PAUSA = "bot en pausa"; // ídem; «un humano lleva la conversación»
const TAG_ESTUDIANTE = "estudiante"; // ya existe en el vocabulario de Sofi
// Tramo de ingresos (paso 2), una etiqueta por respuesta, con el texto tal cual (Carlos,
// 2026-09-18). El separador « · » es el de las demás etiquetas de la cuenta.
const TAG_INGRESOS: Record<string, string> = {
  "Todavía nada": "ingresos · todavía nada", // ya no sale en el formulario (19-10); por si llega una vieja
  "Menos de 750 €": "ingresos · menos de 750",
  "Entre 750 € y 1.500 €": "ingresos · 750 a 1.500",
  "Entre 1.500 € y 3.000 €": "ingresos · 1.500 a 3.000",
  "Entre 3.000 € y 5.000 €": "ingresos · 3.000 a 5.000",
  "Más de 5.000 €": "ingresos · más de 5.000",
};
const OCUPA_ESTUDIANTE = "Soy estudiante";

// Grupos de país que califican para high ticket. Australia y Emiratos entran desde el
// 09-09: son público de los anuncios.
const PAIS_HT_OK = [
  "España",
  "Resto de Europa",
  "Estados Unidos o Canadá",
  "Australia o Emiratos",
];

// Quién tiene ingresos hoy: las tres primeras opciones del paso 1 del formulario.
const OCUPA_PAGO = [
  "Soy modelo o creadora de contenido a tiempo completo y ya vivo de ello",
  "Trabajo por cuenta ajena y hago alguna colaboración como segundo ingreso",
  "Trabajo por cuenta ajena y empiezo de cero en esto",
];

const limpiar = (v: unknown, max = 900) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Lo que va a la nota, en UNA línea y sin < >. Si no, quien manda el formulario a mano
// (sin pasar por la página) puede fabricar líneas enteras de la nota, por ejemplo un
// «Su plan personalizado: <otro enlace>» falso que la setter copiaría y mandaría.
const enLinea = (v: unknown, max = 300) =>
  limpiar(v, max).replace(/[\u0000-\u001f\u007f\u2028\u2029<>]+/g, " ").replace(/ {2,}/g, " ").trim();

// Búsqueda en una tabla SOLO por sus claves: con `obj[clave]`, una clave como «__proto__»
// devuelve el prototipo y acaba como etiqueta o como dato de Meta.
const deTabla = (tabla: Record<string, string>, clave: string) =>
  Object.prototype.hasOwnProperty.call(tabla, clave) ? tabla[clave] : "";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

// País por su nombre, como hace Sofi: `españa` aparte (SeQura), `latam` entero, el
// resto cada uno el suyo.
function tagPais(grupo: string, nombre: unknown) {
  if (grupo === "España") return "españa";
  if (grupo === "Latinoamérica") return "latam";
  const n = limpiar(nombre, 40).toLowerCase();
  return n && n !== "otro país" ? n : "";
}

// El teléfono ya llega en E.164 desde la página (prefijo resuelto allí, ver
// `normalizarTel` en public/plan/index.html). Esto es una red.
function telefonoE164(bruto: unknown, pais: string) {
  let solo = String(bruto || "").replace(/[^\d+]/g, "");
  if (solo.startsWith("00")) solo = "+" + solo.slice(2);
  if (solo.startsWith("+")) return "+" + solo.slice(1).replace(/\+/g, "");
  const porDefecto: Record<string, string> = { España: "+34", "Estados Unidos o Canadá": "+1" };
  const p = porDefecto[pais];
  return p && solo ? p + solo.replace(/^0+/, "") : solo;
}

// ── Validación mínima en el servidor (la misma regla que la página) ───────────
const EMAIL_OK = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const TELEFONO_OK = /^\+[1-9]\d{7,14}$/; // E.164: de 8 a 15 cifras con el prefijo

// ── De dónde viene la petición ────────────────────────────────────────────────
// Solo nuestra web (con y sin www), las vistas previas de Vercel y el ordenador de quien
// la desarrolla. No para a un robot que falsifique la cabecera, pero sí a cualquier otra
// web que intente usar este endpoint desde el navegador de alguien. Si no llega ni
// Origin ni Referer (no es un navegador en otra web) se deja pasar: para eso están la
// trampa y la validación, y perder una chica de verdad es peor que dejar pasar un robot.
function hostPermitido(url: string | null): boolean | null {
  if (!url || url === "null") return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  if (u.protocol !== "https:") return false;
  return h === "ariannyrivasacademy.com" || h === "www.ariannyrivasacademy.com" || h.endsWith(".vercel.app");
}

function origenPermitido(req: Request): boolean {
  const porOrigin = hostPermitido(req.headers.get("origin"));
  if (porOrigin !== null) return porOrigin;
  const porReferer = hostPermitido(req.headers.get("referer"));
  return porReferer !== false;
}

// ── El origen de la chica: UTM, fbclid y la web de la que llegó ───────────────
// Lo guarda /plan en sessionStorage al cargar y lo manda con el formulario. No hay campo
// nuevo en GHL: va a la nota («Origen: …») y a una etiqueta `origen · <canal>`.
type Origen = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  referrer: string;
  ts: number;
};
type Canal = "youtube" | "anuncio" | "instagram" | "directo" | "otro";

const CLAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function leerOrigen(v: unknown): Origen | null {
  if (!v || typeof v !== "object") return null; // página antigua: no manda nada
  const o = v as Record<string, unknown>;
  // Texto corto, sin saltos de línea ni caracteres de control (va a la nota de GHL).
  const texto = (x: unknown) => enLinea(x, 100);
  const fbclid = limpiar(o.fbclid, 500);
  const ref = limpiar(o.referrer, 120).toLowerCase();
  const ts = Number(o.ts);
  return {
    utm_source: texto(o.utm_source),
    utm_medium: texto(o.utm_medium),
    utm_campaign: texto(o.utm_campaign),
    utm_content: texto(o.utm_content),
    utm_term: texto(o.utm_term),
    fbclid: /^[A-Za-z0-9_-]+$/.test(fbclid) ? fbclid : "",
    referrer: /^[a-z0-9.-]+$/.test(ref) ? ref : "",
    // Cuándo vio el fbclid por primera vez (para el `fbc` de Meta). Si no es creíble, ahora.
    ts: Number.isFinite(ts) && ts > 1.6e12 && ts <= Date.now() + 60_000 ? Math.floor(ts) : Date.now(),
  };
}

const esDe = (host: string, dominio: string) => host === dominio || host.endsWith("." + dominio);

// Los anuncios del plan llevan `?utm_source=meta&utm_content=V{n}` (03-embudo/ads).
// Por eso un `fbclid` SIN utm no se da por anuncio si llega desde Instagram: Instagram y
// Facebook se lo añaden también a los enlaces orgánicos (bio, stories), y contarlos como
// anuncio inflaría lo que traen los anuncios.
const MEDIO_PAGADO = /^(cpc|ppc|cpm|paid|paid[_ -]?social|ads?|anuncios?|pago|pagado|display)$/;
const FUENTE_ANUNCIO = /^(meta|meta[_ -]?ads|fb[_ -]?ads|facebook[_ -]?ads|ig[_ -]?ads|instagram[_ -]?ads)$/;

function canalDe(o: Origen): Canal {
  const s = o.utm_source.toLowerCase();
  const m = o.utm_medium.toLowerCase();
  const ref = o.referrer;
  if (s) {
    if (s === "yt" || s.includes("youtube")) return "youtube";
    if (FUENTE_ANUNCIO.test(s) || MEDIO_PAGADO.test(m)) return "anuncio";
    if (s === "ig" || s.includes("instagram")) return "instagram";
    return "otro";
  }
  if (esDe(ref, "youtube.com") || esDe(ref, "youtu.be")) return "youtube";
  if (esDe(ref, "instagram.com")) return "instagram";
  if (o.fbclid) return "anuncio";
  if (!ref || esDe(ref, "ariannyrivasacademy.com")) return "directo";
  return "otro";
}

function lineaOrigen(o: Origen, canal: Canal): string {
  const partes: string[] = [canal];
  for (const k of CLAVES_UTM) if (o[k]) partes.push(`${k} ${o[k]}`);
  if (o.fbclid) partes.push("con fbclid");
  partes.push(o.referrer ? `llegó desde ${o.referrer}` : "sin web de procedencia");
  return `Origen: ${partes.join(" · ")}`;
}


// ISO 3166-1 alfa-2 de cada país del selector de /plan (por su nombre).
const PAIS_ISO: Record<string, string> = {
  España: "es", Alemania: "de", Andorra: "ad", Argentina: "ar", Australia: "au", Austria: "at",
  Bélgica: "be", Bolivia: "bo", Brasil: "br", Canadá: "ca", Chile: "cl", Colombia: "co",
  "Costa Rica": "cr", Dinamarca: "dk", Ecuador: "ec", "El Salvador": "sv", "Emiratos Árabes": "ae",
  "Estados Unidos": "us", Francia: "fr", Grecia: "gr", Guatemala: "gt", Honduras: "hn",
  Irlanda: "ie", Italia: "it", Marruecos: "ma", México: "mx", Nicaragua: "ni", Noruega: "no",
  "Países Bajos": "nl", Panamá: "pa", Paraguay: "py", Perú: "pe", Polonia: "pl", Portugal: "pt",
  "Reino Unido": "gb", "República Dominicana": "do", Rumanía: "ro", Suecia: "se", Suiza: "ch",
  Uruguay: "uy", Venezuela: "ve",
};







// ── GHL ───────────────────────────────────────────────────────────────────────
type Resp = { ok: boolean; status: number; datos: Record<string, unknown> };

async function ghl(metodo: string, ruta: string, cuerpo?: unknown): Promise<Resp> {
  try {
    const r = await fetch(API + ruta, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${process.env.GHL_TOKEN}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      cache: "no-store",
      // Sin límite, un GHL colgado dejaba la función esperando hasta que Vercel la mataba, sin error.
      signal: AbortSignal.timeout(8000),
    });
    const texto = await r.text();
    let datos: Record<string, unknown> = {};
    try {
      datos = JSON.parse(texto || "{}");
    } catch {
      datos = { _raw: texto.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status, datos };
  } catch (e) {
    // Red caída o GHL sin responder: se trata como un fallo más, no como una excepción.
    return { ok: false, status: 0, datos: { error: String(e).slice(0, 200) } };
  }
}


const corto = (r: Resp) => JSON.stringify(r.datos).slice(0, 300);

// ── Su ficha de Instagram ─────────────────────────────────────────────────────
// Por qué y con qué regla: src/lib/plan/instagram.ts.
async function fichaDeInstagram(ig: string): Promise<Candidata | null> {
  const h = normalizaHandle(ig);
  if (h.length < 3) return null;
  const r = await ghl("POST", "/contacts/search", {
    locationId: process.env.GHL_LOCATION_ID,
    pageLimit: 20,
    query: h,
  });
  if (!r.ok) {
    console.error("plan/lead: búsqueda por @ falló", r.status, corto(r));
    return null;
  }
  return elegirFicha((r.datos as { contacts?: Candidata[] }).contacts ?? [], h, CAMPO.ig_handle);
}

// Sus otras fichas (2026-10-12): si su ficha de Instagram no apareció por el @, el backend
// de Sofi la busca por su nombre y apellidos y, si aparece, la apunta debajo de su plan (al
// final de la nota) y avisa en Slack. La regla vive allí (setter/plan_fichas.py), no aquí:
// quién es la misma chica se decide en un solo sitio. Va a la misma casa que la masterclass
// (MASTERCLASS_WEBHOOK_URL / _SECRET); sin ellas no se hace nada y no se rompe nada.
async function revisarOtrasFichas(contactId: string) {
  const base = process.env.MASTERCLASS_WEBHOOK_URL;
  if (!base) return;
  let url = "";
  try {
    url = new URL("/plan/fichas", base).toString();
  } catch {
    return;
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MASTERCLASS_WEBHOOK_SECRET
          ? { "X-Setter-Secret": process.env.MASTERCLASS_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ contact_id: contactId }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!r.ok) console.error("plan/lead: /plan/fichas respondió", r.status);
  } catch (e) {
    console.error("plan/lead: /plan/fichas falló", String(e).slice(0, 200));
  }
}


export async function POST(req: Request) {
  if (!origenPermitido(req)) {
    console.warn("plan/lead: origen no permitido", (req.headers.get("origin") || "").slice(0, 80));
    return NextResponse.json({ error: "origen" }, { status: 403 });
  }

  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) {
    console.error("plan/lead: faltan GHL_TOKEN o GHL_LOCATION_ID");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición mal formada" }, { status: 400 });
  }
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Petición mal formada" }, { status: 400 });
  }

  // ── aviso de clic en WhatsApp ───────────────────────────────────────────────
  // /plan/gracias lo sigue mandando, pero desde el 2026-10-13 ya no mueve la tarjeta: todas
  // se quedan en la 1 hasta que una setter la coge (Carlos). Se contesta que sí y nada más.
  if (b.evento === "whatsapp_click") {
    return NextResponse.json({ ok: true });
  }

  // ── campo trampa ─────────────────────────────────────────────────────────────
  // En la página va oculto (fuera de la pantalla, sin tabulador, sin autocompletar):
  // una persona no lo ve. Si llega relleno es un robot: se le dice que sí y no se
  // guarda nada.
  if (limpiar(b.comentario, 200)) {
    console.warn("plan/lead: campo trampa relleno; no se guarda");
    return NextResponse.json({ ok: true });
  }

  const nombre = limpiar(b.nombre, 120);
  const email = limpiar(b.email, 160).toLowerCase();
  const pais = limpiar(b.pais, 60);
  // Solo un país del selector de /plan (o «Otro país»). El nombre acaba en una etiqueta
  // (`tagPais`): con texto libre se podía poner cualquier etiqueta en la ficha, también
  // las que disparan flujos de GHL (p. ej. `set-stage:…`).
  const paisBruto = limpiar(b.pais_nombre, 60);
  const paisNombre = (deTabla(PAIS_ISO, paisBruto) !== "" || paisBruto === "Otro país") ? paisBruto : "";
  const telefono = telefonoE164(b.telefono, pais);
  const edad = parseInt(String(b.edad), 10);

  if (!nombre || !email || !telefono) {
    return NextResponse.json({ error: "faltan_datos" }, { status: 400 });
  }
  if (!EMAIL_OK.test(email)) {
    console.warn("plan/lead: email con mala forma");
    return NextResponse.json({ error: "email" }, { status: 400 });
  }
  if (!TELEFONO_OK.test(telefono)) {
    console.warn("plan/lead: teléfono con mala forma", pais || "(sin país)");
    return NextResponse.json({ error: "telefono" }, { status: 400 });
  }

  // ── origen ────────────────────────────────────────────────────────────────
  const origen = leerOrigen(b.origen);
  const canal = origen ? canalDe(origen) : null;

  // ── etiquetas: solo evidencia ──────────────────────────────────────────────
  // `plan · sin pagar` se añade más abajo, solo si no lo había pagado ya.
  const tags = [TAG_INICIO_PLAN, TAG_BOT_EN_PAUSA];
  if (Number.isFinite(edad)) tags.push(edad >= 18 ? TAG_MAYOR_EDAD : TAG_MENOR_EDAD);
  const ocupacion = limpiar(b.ocupacion, 120);
  if (OCUPA_PAGO.includes(ocupacion)) tags.push(TAG_PUEDE_PAGAR);
  if (ocupacion === OCUPA_ESTUDIANTE) tags.push(TAG_ESTUDIANTE);
  const tramo = deTabla(TAG_INGRESOS, limpiar(b.ingresos_actuales, 60));
  if (tramo) tags.push(tramo);
  const menosDe750 = tramo === TAG_INGRESOS["Menos de 750 €"] || tramo === TAG_INGRESOS["Todavía nada"];
  if (PAIS_HT_OK.includes(pais)) tags.push(TAG_HT_PAIS_OK);
  const tp = tagPais(pais, paisNombre);
  if (tp) tags.push(tp);
  if (canal) tags.push(`origen · ${canal}`);

  const [nom, ...resto] = nombre.split(/\s+/);
  const ig = limpiar(b.instagram, 80).replace(/^@/, "");

  // 1 · el contacto, SIN etiquetas (ver cabecera). Un reintento si GHL falla.
  const cuerpoUpsert = {
    locationId: process.env.GHL_LOCATION_ID,
    firstName: nom,
    lastName: resto.join(" "),
    name: nombre,
    email,
    phone: telefono,
    source: "Formulario plan personalizado",
    customFields: Object.entries({
      pais,
      edad: Number.isFinite(edad) ? String(edad) : "",
      ocupacion,
      dolor_principal: limpiar(b.dolor_principal, 900),
      ig_handle: ig,
      ingresos_actuales: limpiar(b.ingresos_actuales, 60),
      objetivo_ingresos: limpiar(b.objetivo_ingresos, 120),
    })
      .filter(([, v]) => v)
      .map(([k, v]) => ({ id: CAMPO[k], value: v })),
  };

  // 1a · si ya tiene ficha de Instagram, todo va a esa. El nombre se escribe porque su
  // plan dice «El plan de <nombre>» y la ficha de Instagram se llama a veces como su @.
  // El correo y el teléfono, solo si el hueco está vacío. Si GHL no deja (ese correo o
  // ese teléfono ya están en otra ficha), se sigue como siempre, por el upsert.
  let contactId = "";
  let etiquetasPrevias: string[] = [];
  const deInstagram = await fichaDeInstagram(ig);
  if (deInstagram) {
    const cambios = {
      firstName: cuerpoUpsert.firstName,
      lastName: cuerpoUpsert.lastName,
      name: cuerpoUpsert.name,
      customFields: cuerpoUpsert.customFields,
      ...(deInstagram.email ? {} : { email }),
      ...(deInstagram.phone ? {} : { phone: telefono }),
    };
    const put = await ghl("PUT", `/contacts/${deInstagram.id}`, cambios);
    if (put.ok) {
      contactId = deInstagram.id;
      etiquetasPrevias = deInstagram.tags ?? [];
      console.log("plan/lead: escrito en su ficha de Instagram", deInstagram.id);
    } else {
      console.warn("plan/lead: no se pudo escribir en su ficha de Instagram; upsert", put.status, corto(put));
    }
  }

  if (!contactId) {
    let up = await ghl("POST", "/contacts/upsert", cuerpoUpsert);
    // También con 401: GHL ya ha dado alguno pasajero (decisiones.md, 21-08).
    if (!up.ok && (up.status === 0 || up.status === 401 || up.status === 429 || up.status >= 500)) {
      await espera(700);
      up = await ghl("POST", "/contacts/upsert", cuerpoUpsert);
    }

    if (!up.ok) {
      console.error("plan/lead: upsert falló", up.status, corto(up));
      return NextResponse.json({ error: "crm" }, { status: 502 });
    }
    const c = (up.datos as { contact?: { id: string; tags?: string[] } }).contact;
    contactId = c?.id ?? "";
    etiquetasPrevias = c?.tags ?? [];
  }

  if (!contactId) {
    console.error("plan/lead: el upsert no devolvió id; sin tarjeta, etiquetas ni nota");
    return NextResponse.json({ ok: true });
  }


  // ¿Ya había pagado su plan? (Vuelve a rellenarlo días después, por ejemplo.) Entonces no se la
  // marca otra vez «sin pagar», no se le toca la tarjeta y la página la lleva directa al WhatsApp,
  // sin volver a cobrarle.
  const yaPagado = etiquetasPrevias.some((t) => (t || "").trim().toLowerCase() === TAG_PLAN_PAGADO);
  if (!yaPagado) tags.push(TAG_SIN_PAGAR);
  const ipCliente = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim();

  // 2 · lo demás, después de responder.
  after(async () => {
    // Si pagó mientras esto esperaba a GHL (pago con Apple Pay en segundos), no se la vuelve a
    // marcar «sin pagar» ni se le crea otra tarjeta en la 0.
    const pagoEnMedio = !yaPagado && (await tienePlanPagado(contactId));
    if (pagoEnMedio) tags.splice(tags.indexOf(TAG_SIN_PAGAR), 1);
    const sinPagar = !yaPagado && !pagoEnMedio;
    // Las tres que tocan el contacto, en fila: etiquetas → plan_url → nota.
    const contacto = async () => {
      const et = await ghl("POST", `/contacts/${contactId}/tags`, { tags });
      if (!et.ok) console.error("plan/lead: etiquetas fallaron", et.status, corto(et));

      // La nota con sus respuestas, tal cual. Los campos personalizados quedan en
      // «Información adicional», donde nadie mira (Carlos, 2026-09-18); la nota sale en
      // la ficha, en el panel de Conversaciones y en la tarjeta. Al final, los enlaces
      // de SU plan, que se genera solo con estas respuestas (src/lib/plan). La setter los
      // copia de aquí cuando decide mandarlo.
      let enlaces = "";
      // Hasta el 30-11, solo el plan con el cierre del workshop y la Comunidad: el de la formación
      // ni aparece en la nota (Carlos, 2026-11-04). Desde el 1-12, a las de 750 € o más, los dos.
      // El plan se manda después de hablar con ella, nunca al llegar.
      const cierre = cierreRecomendado(menosDe750);
      try {
        const recomendado = urlDePlan(contactId, cierre);
        enlaces = (
          cierre === "comunidad"
            ? [
                "",
                `Su plan, con el cierre ${faseComunidad() === "comunidad" ? "de la Comunidad" : "del workshop y la Comunidad"}. El fragmento ya lo pega. Se manda después de hablar con ella:`,
                recomendado,
              ]
            : [
                "",
                "Su plan con el cierre de la formación (mensaje «¡QUIERO ACCEDER!»), para la muy, muy calificada:",
                recomendado,
                "El mismo plan con el cierre de la Comunidad (y el workshop, mientras dure), el de casi todas:",
                urlDePlan(contactId, "comunidad"),
              ]
        )
          .concat(["Para revisarlo sin que cuente como abierto:", recomendado + "?previa=1"])
          .join("\n");
      } catch (e) {
        console.error("plan/lead: sin enlace de plan", e);
      }
      if (enlaces) {
        const pu = await ghl("PUT", `/contacts/${contactId}`, {
          customFields: [{ id: CAMPO.plan_url, value: urlDePlan(contactId, cierre) }],
        });
        if (!pu.ok) console.error("plan/lead: plan_url falló", pu.status, corto(pu));
      }
      const nota = await ghl("POST", `/contacts/${contactId}/notes`, {
        body: notaFormulario(b, edad, paisNombre, ig, origen && canal ? lineaOrigen(origen, canal) : "") + enlaces,
      });
      if (!nota.ok) console.error("plan/lead: nota falló", nota.status, corto(nota));
    };

    // Si el plan no quedó en su ficha de Instagram, después de la nota (lo nuevo se añade al
    // final de ella) se pide al backend que busque sus otras fichas por el nombre.
    const enSuInstagram = !!deInstagram && deInstagram.id === contactId;
    // Desde el 7-11 (plan de pago): su tarjeta, en «0 · Sin pagar», y en MailerLite en «Plan · sin
    // pagar», un grupo sin automatización: sigue en la lista, pero la secuencia con su plan
    // («Plan personalizado») y el evento de Meta llegan al pagar, en /api/plan/pago.
    const r = await Promise.allSettled([
      contacto().then(() => (enSuInstagram ? undefined : revisarOtrasFichas(contactId))),
      sinPagar ? tarjetaSinPagar(contactId, nombre) : Promise.resolve(),
      !sinPagar
        ? Promise.resolve()
        : altaEnMailerLite({
            email,
            grupo: GRUPO.planSinPagar,
            nombre,
            origen: "plan",
            etapa: "lead",
            edad: Number.isFinite(edad) ? edad : null,
            pais: paisNombre === "Otro país" ? "" : paisNombre,
            region: regionDe(pais),
            ocupacion,
            dolorPlan: limpiar(b.dolor_principal, 900),
            consentimiento: "formulario plan",
            ghlId: contactId,
            ip: ipCliente,
          }),
    ]);
    for (const x of r) if (x.status === "rejected") console.error("plan/lead: después de responder", String(x.reason).slice(0, 200));
  });

  return NextResponse.json({ ok: true, id: contactId, ...(yaPagado ? { pagado: true } : {}) });
}
