import { createHash } from "node:crypto";

/**
 * La compra, a Meta desde el servidor (Conversions API). Carlos, 2026-11-07: «que aparezca en Meta
 * cuando se realice la compra de verdad».
 *
 * POR QUÉ: el píxel del navegador solo carga si ella acepta las cookies, y la compra solo se cuenta
 * en /workshop/gracias (o en el formulario de /comunidad) si la página llega a cargar. En el plan,
 * del 3 al 6-11, Meta vio 72 de 87 solicitudes: se pierde una de cada seis. Las campañas del
 * workshop optimizan por compra, así que cada compra que Meta no ve es aprendizaje perdido.
 *
 * DEDUPLICACIÓN: el navegador y el servidor mandan el MISMO `event_id`, el id de la factura de
 * Stripe (`in_…`), y Meta las une en una sola compra. La página de gracias del workshop y el
 * formulario de /comunidad ya usan ese id en el píxel.
 *
 * REGLAS DURAS:
 *   · NUNCA impide cobrar. Se llama con `after()`, después de responder, y cualquier fallo se queda
 *     en un console.error.
 *   · Sin META_PIXEL_ID o META_CAPI_TOKEN no se manda nada y no se rompe nada.
 *   · Todo lo personal va hasheado (SHA-256); en claro solo lo que Meta pide así: IP, navegador,
 *     `_fbp` y `_fbc`.
 *   · META_CAPI_SOLO_CON_CONSENTIMIENTO=1 → solo se manda si aceptó las cookies (la misma variable
 *     que usa el formulario del plan, src/app/api/plan/lead/route.ts).
 *
 * Variables de entorno: META_PIXEL_ID (1613484133037939), META_CAPI_TOKEN y, opcional,
 * META_CAPI_SOLO_CON_CONSENTIMIENTO. Las compras reales NUNCA llevan código de prueba: Meta no
 * descarta los eventos con test_event_code (los usa para medir y segmentar), así que META_CAPI_TEST_CODE
 * no se usa aquí. Para probar la conexión, pruebaDeConexion() con un evento que no es una compra.
 */

const META_API = "v21.0";
const URL_BASE = "https://www.ariannyrivasacademy.com";

const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");

// Meta pide minúsculas, sin acentos ni signos antes de hashear nombres.
const normTexto = (v: string) =>
  v.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function leerCookie(req: Request, nombre: string): string {
  const todas = req.headers.get("cookie") || "";
  for (const trozo of todas.split(";")) {
    const i = trozo.indexOf("=");
    if (i > 0 && trozo.slice(0, i).trim() === nombre) {
      try {
        return decodeURIComponent(trozo.slice(i + 1).trim());
      } catch {
        return "";
      }
    }
  }
  return "";
}

/** ¿Se le puede mandar a Meta? Siempre, salvo que se active la versión «solo con cookies». */
export function puedeIrAMeta(req: Request | null): boolean {
  if (process.env.META_CAPI_SOLO_CON_CONSENTIMIENTO !== "1") return true;
  return !!req && leerCookie(req, "cookie_consent") === "accepted";
}

/** ¿Está configurada la Conversions API? (Sin decir nada de los valores.) */
export function metaConfigurada(): boolean {
  return !!process.env.META_PIXEL_ID && !!process.env.META_CAPI_TOKEN;
}

export type Navegador = { ip: string; ua: string; fbp: string; fbc: string };

/**
 * Lo que hace falta del navegador, leído de la petición mientras existe (después de responder ya
 * no está). `fbclid` y `fbclidTs` vienen de la página: con ellos se arma el `_fbc` cuando el píxel
 * no llegó a guardarlo (formato de Meta: fb.1.<ms>.<fbclid>).
 */
export function datosNavegador(req: Request, fbclid?: unknown, fbclidTs?: unknown): Navegador {
  const clid = typeof fbclid === "string" && /^[A-Za-z0-9_-]{8,500}$/.test(fbclid) ? fbclid : "";
  const ts = Number(fbclidTs);
  const cuando = Number.isFinite(ts) && ts > 1.6e12 && ts <= Date.now() + 60_000 ? Math.floor(ts) : Date.now();
  return {
    ip: (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim(),
    ua: (req.headers.get("user-agent") || "").slice(0, 400),
    fbp: leerCookie(req, "_fbp").slice(0, 200),
    fbc: leerCookie(req, "_fbc").slice(0, 600) || (clid ? `fb.1.${cuando}.${clid}` : ""),
  };
}

export type Compra = {
  /** El id de la factura de Stripe: el mismo `eventID` que usa el píxel. */
  facturaId: string;
  euros: number;
  /** Lo que compró, como lo nombra el píxel («Workshop 24-11», «AR Academy»). */
  contenido: string;
  email: string;
  telefono: string;
  nombre: string;
  /** El id de cliente de Stripe: estable y nuestro. */
  clienteId: string;
  /** De dónde salió la compra. Sin navegador (enlace de pago de Stripe), `null`. */
  navegador: Navegador | null;
  /** La página en la que compró. */
  pagina: string;
  /** Cuándo pagó, en segundos. Por defecto, ahora. */
  cuando?: number;
};

export function cuerpoCompra(c: Compra) {
  const [nom = "", ...resto] = c.nombre.trim().split(/\s+/);
  const fn = normTexto(nom);
  const ln = normTexto(resto.join(" "));
  const digitos = c.telefono.replace(/\D/g, "");
  const email = c.email.trim().toLowerCase();

  const user_data: Record<string, string | string[]> = {};
  if (email.includes("@")) user_data.em = [sha256(email)];
  if (digitos.length >= 7) user_data.ph = [sha256(digitos)]; // con prefijo y sin «+»
  if (fn) user_data.fn = [sha256(fn)];
  if (ln) user_data.ln = [sha256(ln)];
  if (c.clienteId) user_data.external_id = [sha256(c.clienteId)];
  const nav = c.navegador;
  if (nav?.ip) user_data.client_ip_address = nav.ip;
  if (nav?.ua) user_data.client_user_agent = nav.ua;
  if (nav?.fbp) user_data.fbp = nav.fbp;
  if (nav?.fbc) user_data.fbc = nav.fbc;

  const evento: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: c.cuando ?? Math.floor(Date.now() / 1000),
    event_id: c.facturaId,
    // Meta exige el navegador (user-agent) en los eventos «website». Un enlace de pago de Stripe no
    // pasa por nuestra web: esa compra va como «system_generated».
    action_source: nav?.ua ? "website" : "system_generated",
    event_source_url: c.pagina.startsWith("http") ? c.pagina : `${URL_BASE}${c.pagina}`,
    user_data,
    custom_data: {
      currency: "EUR",
      value: Math.round(c.euros * 100) / 100,
      content_name: c.contenido,
      order_id: c.facturaId,
    },
  };
  return { data: [evento] };
}

type Envio = { ok: boolean; status: number; texto: string; reintentable: boolean };

async function enviar(cuerpo: unknown): Promise<Envio> {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return { ok: false, status: 0, texto: "sin configurar", reintentable: false };
  try {
    const r = await fetch(
      `https://graph.facebook.com/${META_API}/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    const texto = r.ok ? "" : (await r.text()).slice(0, 300);
    return { ok: r.ok, status: r.status, texto, reintentable: r.status === 429 || r.status >= 500 };
  } catch (e) {
    // Si se agotó el tiempo, Meta pudo recibirla: no se repite (dos eventos de servidor con el mismo
    // id no siempre se unen). Si falló la red antes de llegar, sí.
    const agotado = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { ok: false, status: 0, texto: String(e).slice(0, 200), reintentable: !agotado };
  }
}

/** Manda la compra. Nunca lanza: devuelve si Meta la aceptó. Un reintento si Meta falla por su lado. */
export async function compraEnMeta(c: Compra): Promise<boolean> {
  if (!metaConfigurada()) return false; // sin configurar: todo sigue como estaba
  if (!c.facturaId || !(c.euros > 0)) return false;
  const cuerpo = cuerpoCompra(c);
  let r = await enviar(cuerpo);
  if (!r.ok && r.reintentable) {
    await new Promise((ok) => setTimeout(ok, 1500));
    r = await enviar(cuerpo);
  }
  if (r.ok) {
    console.log("meta: compra enviada", c.facturaId, c.euros);
    return true;
  }
  console.error("meta: la compra no entró (el pago está hecho igual)", c.facturaId, r.status, r.texto);
  return false;
}

/**
 * Prueba de la conexión con el código de «Probar eventos» (TEST…). Manda un evento personalizado,
 * «PruebaConexionAR», que NO es una compra, sin importe y sin nada de quien la lanza (ni IP ni
 * cookies): no puede contar como venta ni atribuirse a nadie. Lo usa /api/meta/prueba.
 */
export async function pruebaDeConexion(codigo: string): Promise<Envio> {
  return enviar({
    data: [
      {
        event_name: "PruebaConexionAR",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `prueba_${Date.now()}`,
        action_source: "website",
        event_source_url: `${URL_BASE}/api/meta/prueba`,
        user_data: {
          external_id: [sha256("prueba-conexion-ar")],
          client_user_agent: "Mozilla/5.0 (prueba-conexion-ar)",
        },
      },
    ],
    test_event_code: codigo,
  });
}

/**
 * La solicitud del plan, ya pagada (desde el 7-11 el plan cuesta 10 €). Es el mismo evento que
 * cuenta la conversión «Solicitud de plan» (SubmitApplication + content_name «plan personalizado»),
 * ahora con su importe, y con el MISMO event_id que el píxel de /plan/gracias para que Meta junte
 * los dos. No es un Purchase a propósito: la campaña del workshop optimiza por compras y no se
 * deben mezclar. Nunca lanza.
 */
export async function solicitudPlanEnMeta(d: {
  eventId: string;
  contactId: string;
  email: string;
  telefono: string;
  nombre: string;
  euros: number;
  navegador: Navegador | null;
}): Promise<boolean> {
  if (!metaConfigurada()) return false;
  const [nom = "", ...resto] = d.nombre.trim().split(/\s+/);
  const fn = normTexto(nom);
  const ln = normTexto(resto.join(" "));
  const digitos = d.telefono.replace(/\D/g, "");
  const email = d.email.trim().toLowerCase();
  const user_data: Record<string, string | string[]> = {};
  if (email.includes("@")) user_data.em = [sha256(email)];
  if (digitos.length >= 7) user_data.ph = [sha256(digitos)];
  if (fn) user_data.fn = [sha256(fn)];
  if (ln) user_data.ln = [sha256(ln)];
  // El id de GHL, el mismo external_id que mandaba el formulario del plan.
  if (d.contactId) user_data.external_id = [sha256(d.contactId)];
  const nav = d.navegador;
  if (nav?.ip) user_data.client_ip_address = nav.ip;
  if (nav?.ua) user_data.client_user_agent = nav.ua;
  if (nav?.fbp) user_data.fbp = nav.fbp;
  if (nav?.fbc) user_data.fbc = nav.fbc;
  const evento: Record<string, unknown> = {
    event_name: "SubmitApplication",
    event_time: Math.floor(Date.now() / 1000),
    action_source: nav?.ua ? "website" : "system_generated",
    event_source_url: `${URL_BASE}/plan`,
    user_data,
    custom_data: { content_name: "plan personalizado", currency: "EUR", value: d.euros },
  };
  if (d.eventId) evento.event_id = d.eventId;
  let r = await enviar({ data: [evento] });
  if (!r.ok && r.reintentable) {
    await new Promise((ok) => setTimeout(ok, 1500));
    r = await enviar({ data: [evento] });
  }
  if (!r.ok) console.error("meta: la solicitud del plan no entró", r.status, r.texto);
  return r.ok;
}
