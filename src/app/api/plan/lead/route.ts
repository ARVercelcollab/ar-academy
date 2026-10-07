import { NextResponse, after } from "next/server";
import { createHash } from "node:crypto";
import { urlDePlan, URL_BASE } from "@/lib/plan/token";
import { cierreRecomendado } from "@/lib/plan/contenido";

/**
 * Formulario del plan personalizado (/plan) → GHL (y Meta, si está configurado).
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
 *   1. Upsert del contacto por email/teléfono — SIN etiquetas. Comprobado el 2026-09-17:
 *      si se le pasan, GHL SUSTITUYE las que tenía. Una chica que ya hablaba con Sofi
 *      perdía su estado entero al rellenar el formulario. Un reintento si GHL falla.
 *   2. RESPONDE YA, con el id del contacto. La página espera como mucho 4 s antes de
 *      pasar a /plan/gracias; antes se hacían 6-7 llamadas en serie y, si GHL iba lento,
 *      se iba sin el id. Lo demás va en `after()` (sigue corriendo tras responder):
 *        · la tarjeta: si ya tiene una abierta en Captación (la de Sofi), se le MUEVE a
 *          «Plan personalizado». Si no tiene ninguna, tarjeta nueva en «Plan
 *          personalizado» · etapa 1. Una sola tarjeta siempre.
 *        · las etiquetas, con el endpoint que SUMA (`POST /contacts/{id}/tags`). Entre
 *          ellas SIEMPRE `revisar humano` y `bot en pausa`: todas las del plan las llevan
 *          las setters (Carlos, 2026-09-18). Las dos están en la lista de exclusión de
 *          Sofi, así que aunque la chica escriba por Instagram, Sofi calla. (Por WhatsApp
 *          Sofi no contesta nunca: `es_canal_ajeno` en el backend.) Y la de origen:
 *          `origen · youtube|anuncio|instagram|directo|otro`.
 *        · `plan_url` y la nota con sus respuestas, su origen y los enlaces de su plan.
 *        · la Conversions API de Meta (`SubmitApplication`), con el mismo event_id que
 *          el píxel de /plan/gracias para que Meta no la cuente dos veces.
 *      Las etiquetas, `plan_url` y la nota van una detrás de otra (las tres tocan el
 *      contacto); la tarjeta y Meta, en paralelo.
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
 *   META_CAPI_TEST_CODE                → opcional: código de «Probar eventos» de Meta.
 *   META_CAPI_SOLO_CON_CONSENTIMIENTO  → "1" para mandar a Meta solo si aceptó las
 *                      cookies (versión B de la decisión D6, pendiente de Carlos). Sin
 *                      ella se manda siempre, como hace la masterclass.
 *
 * Historia: vivió como función serverless en plan.ariannyrivasacademy.com (repo de
 * operaciones, 03-embudo/landing/api/lead.js) hasta el 2026-09-17, cuando la landing
 * se mudó aquí. Ver 00-contexto/decisiones.md en ese repo.
 */

const API = "https://services.leadconnectorhq.com";

// ── Pipelines ─────────────────────────────────────────────────────────────────
// «Plan personalizado», creado por API el 2026-09-17.
const PIPELINE_PLAN = "fBlrzlgSgTbZ5mlA9lh8";
const ETAPA_FORMULARIO_RECIBIDO = "e8d262bf-006e-4e59-93b9-3457d406b8d3";
const ETAPA_WHATSAPP_INICIADO = "6bab6044-0db2-4904-8829-4f9269971094";
// De la 3 («En prospección», desde el 2026-09-18) en adelante las mueve la setter a
// mano. Desde aquí no se tocan.

// «Captación», el de Sofi.
const PIPELINE_CAPTACION = "lPD7Qhnb1Ak8Vlexzml8";

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
const TAG_REVISAR_HUMANO = "revisar humano"; // en TAGS_EXCLUSION del backend: Sofi calla
const TAG_BOT_EN_PAUSA = "bot en pausa"; // ídem; «un humano lleva la conversación»
const TAG_ESTUDIANTE = "estudiante"; // ya existe en el vocabulario de Sofi
// Tramo de ingresos (paso 2), una etiqueta por respuesta, con el texto tal cual (Carlos,
// 2026-09-18). El separador « · » es el de las demás etiquetas de la cuenta.
const TAG_INGRESOS: Record<string, string> = {
  "Todavía nada": "ingresos · todavía nada",
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

// ── Conversions API de Meta ───────────────────────────────────────────────────
// Copia de 06-infraestructura/backend-webhook/setter/meta_capi.py (el de la masterclass),
// con el evento del plan. POR QUÉ: el píxel del navegador solo carga si ella acepta las
// cookies, y en la masterclass Meta vio la mitad de los registros. Si las campañas
// optimizan a «Solicitud de plan» (SubmitApplication + content_name «plan
// personalizado»), Meta aprende con la mitad de los datos.
// REGLA DURA: esto NUNCA impide guardar la lead. Corre después de responder, en `after()`,
// y cualquier fallo se queda en un console.error.
const META_API = "v21.0";
const EVENTO_META = "SubmitApplication";

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

const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");

// Meta exige minúsculas, sin acentos ni puntuación antes de hashear (igual que Sofi).
const normTexto = (v: string) =>
  v.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function leerCookie(req: Request, nombre: string): string {
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

type DatosMeta = {
  contactId: string;
  eventId: string;
  email: string;
  telefono: string; // E.164
  nombre: string;
  paisNombre: string;
  ip: string;
  ua: string;
  fbp: string;
  fbc: string;
};

function cuerpoMeta(d: DatosMeta) {
  const [nom = "", ...resto] = d.nombre.split(/\s+/);
  const fn = normTexto(nom);
  const ln = normTexto(resto.join(" "));
  const digitos = d.telefono.replace(/\D/g, "");
  const iso = deTabla(PAIS_ISO, d.paisNombre);
  const user_data: Record<string, string | string[]> = {};
  // Todo lo personal va hasheado; nunca en claro.
  if (d.email.includes("@")) user_data.em = [sha256(d.email.trim().toLowerCase())];
  if (digitos.length >= 7) user_data.ph = [sha256(digitos)]; // con prefijo y sin «+»
  if (fn) user_data.fn = [sha256(fn)];
  if (ln) user_data.ln = [sha256(ln)];
  if (iso) user_data.country = [sha256(iso)];
  // El id de GHL: estable, nuestro, el mismo que usa el backend de Sofi.
  user_data.external_id = [sha256(d.contactId)];
  // Estos van en claro: así los pide Meta.
  if (d.ip) user_data.client_ip_address = d.ip;
  if (d.ua) user_data.client_user_agent = d.ua;
  if (d.fbp) user_data.fbp = d.fbp;
  if (d.fbc) user_data.fbc = d.fbc;

  const evento: Record<string, unknown> = {
    event_name: EVENTO_META,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: `${URL_BASE}/plan`,
    user_data,
    // Lo que mira la conversión personalizada «Solicitud de plan» (1582237946719790).
    custom_data: { content_name: "plan personalizado" },
  };
  // El id compartido con el píxel de /plan/gracias. Es lo único que evita contarla dos veces.
  if (d.eventId) evento.event_id = d.eventId;
  const cuerpo: Record<string, unknown> = { data: [evento] };
  if (process.env.META_CAPI_TEST_CODE) cuerpo.test_event_code = process.env.META_CAPI_TEST_CODE;
  return cuerpo;
}

async function enviarMeta(d: DatosMeta): Promise<void> {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return; // sin configurar: el sistema va como iba
  try {
    const r = await fetch(
      `https://graph.facebook.com/${META_API}/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpoMeta(d)),
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      },
    );
    if (!r.ok) {
      console.error("plan/lead: Meta CAPI respondió", r.status, (await r.text()).slice(0, 300));
    }
  } catch (e) {
    console.error("plan/lead: Meta CAPI falló (la lead está guardada igual)", String(e).slice(0, 200));
  }
}

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

type Oportunidad = { id: string; pipelineId: string; pipelineStageId: string };

// ¿Tiene ya una tarjeta abierta en este pipeline?
async function oportunidadAbierta(contactId: string, pipelineId: string) {
  const r = await ghl(
    "GET",
    `/opportunities/search?location_id=${process.env.GHL_LOCATION_ID}` +
      `&contact_id=${contactId}&pipeline_id=${pipelineId}&status=open`,
  );
  const lista = (r.datos as { opportunities?: Oportunidad[] }).opportunities;
  return lista?.[0] || null;
}

const corto = (r: Resp) => JSON.stringify(r.datos).slice(0, 300);

// La tarjeta. Si ya tiene una abierta en Captación (la de Sofi) se mueve; si no, nueva.
async function ponerTarjeta(contactId: string, nombre: string) {
  const enCaptacion = await oportunidadAbierta(contactId, PIPELINE_CAPTACION);
  if (enCaptacion) {
    const mv = await ghl("PUT", `/opportunities/${enCaptacion.id}`, {
      pipelineId: PIPELINE_PLAN,
      pipelineStageId: ETAPA_FORMULARIO_RECIBIDO,
    });
    if (!mv.ok) console.error("plan/lead: mover tarjeta falló", mv.status, corto(mv));
    return;
  }
  if (await oportunidadAbierta(contactId, PIPELINE_PLAN)) return; // ya existía
  const opp = await ghl("POST", "/opportunities/", {
    pipelineId: PIPELINE_PLAN,
    locationId: process.env.GHL_LOCATION_ID,
    pipelineStageId: ETAPA_FORMULARIO_RECIBIDO,
    contactId,
    name: nombre,
    status: "open",
  });
  if (!opp.ok) console.error("plan/lead: oportunidad falló", opp.status, corto(opp));
}

// Aviso de /plan/gracias: pasa la tarjeta a «2 · WhatsApp iniciado». Como la tarjeta se
// crea ahora en `after()`, puede que ella pulse antes de que exista: se reintenta unas
// cuantas veces, con calma (va después de responder, nadie espera).
async function moverAWhatsApp(b: Record<string, unknown>) {
  let cid = /^[A-Za-z0-9]{10,40}$/.test(String(b.id ?? "")) ? String(b.id) : "";
  const email = limpiar(b.email, 160).toLowerCase();
  const telefono = limpiar(b.telefono, 40);
  if (!cid && !email && !telefono) return;
  for (let intento = 0; intento < 4; intento++) {
    if (intento) await espera(2500);
    if (!cid) {
      // Sin id, se busca por email; si no hay email, por teléfono (antes se buscaba el
      // teléfono en el campo email y nunca la encontraba).
      const busca = await ghl("POST", "/contacts/search", {
        locationId: process.env.GHL_LOCATION_ID,
        pageLimit: 1,
        filters: [email
          ? { field: "email", operator: "eq", value: email }
          : { field: "phone", operator: "eq", value: telefono }],
      });
      cid = (busca.datos as { contacts?: { id: string }[] }).contacts?.[0]?.id ?? "";
      if (!cid) continue;
    }
    const opp = await oportunidadAbierta(cid, PIPELINE_PLAN);
    if (!opp) continue;
    if (opp.pipelineStageId !== ETAPA_FORMULARIO_RECIBIDO) return; // ya va más adelante
    const mv = await ghl("PUT", `/opportunities/${opp.id}`, {
      pipelineId: PIPELINE_PLAN,
      pipelineStageId: ETAPA_WHATSAPP_INICIADO,
    });
    if (!mv.ok) console.error("plan/lead: paso a WhatsApp iniciado falló", mv.status, corto(mv));
    return;
  }
  console.error("plan/lead: aviso de WhatsApp sin tarjeta que mover", cid ? "(con id)" : "(sin id)");
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

  // ── aviso de clic en WhatsApp: mueve la tarjeta a la etapa 2 ──────────────
  // Es el número que separa «rellenó el formulario» de «escribió de verdad».
  // Si /plan/gracias trae el id que devolvimos al crear el contacto, se usa
  // directamente: el buscador de GHL tarda unos segundos en indexar un contacto
  // nuevo y, con la cuenta atrás de 10 s, buscarla por email podía llegar antes de
  // que existiera para él. El email (o el teléfono) queda como respaldo.
  if (b.evento === "whatsapp_click") {
    after(() =>
      moverAWhatsApp(b).catch((e) => console.error("plan/lead: aviso de WhatsApp", String(e).slice(0, 200))),
    );
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
  const tags = [TAG_INICIO_PLAN, TAG_REVISAR_HUMANO, TAG_BOT_EN_PAUSA];
  if (Number.isFinite(edad)) tags.push(edad >= 18 ? TAG_MAYOR_EDAD : TAG_MENOR_EDAD);
  const ocupacion = limpiar(b.ocupacion, 120);
  if (OCUPA_PAGO.includes(ocupacion)) tags.push(TAG_PUEDE_PAGAR);
  if (ocupacion === OCUPA_ESTUDIANTE) tags.push(TAG_ESTUDIANTE);
  const tramo = deTabla(TAG_INGRESOS, limpiar(b.ingresos_actuales, 60));
  if (tramo) tags.push(tramo);
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
  let up = await ghl("POST", "/contacts/upsert", cuerpoUpsert);
  if (!up.ok && (up.status === 0 || up.status === 429 || up.status >= 500)) {
    await espera(700);
    up = await ghl("POST", "/contacts/upsert", cuerpoUpsert);
  }

  if (!up.ok) {
    console.error("plan/lead: upsert falló", up.status, corto(up));
    return NextResponse.json({ error: "crm" }, { status: 502 });
  }

  const contactId = (up.datos as { contact?: { id: string } }).contact?.id;
  if (!contactId) {
    console.error("plan/lead: el upsert no devolvió id; sin tarjeta, etiquetas ni nota");
    return NextResponse.json({ ok: true });
  }

  // Lo que hace falta de la petición se lee AHORA (después de responder ya no está).
  const datosMeta: DatosMeta = {
    contactId,
    eventId: /^[A-Za-z0-9-]{8,80}$/.test(String(b.event_id ?? "")) ? String(b.event_id) : "",
    email,
    telefono,
    nombre,
    paisNombre,
    ip: (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim(),
    ua: (req.headers.get("user-agent") || "").slice(0, 400),
    fbp: leerCookie(req, "_fbp").slice(0, 200),
    // `_fbc` si el píxel llegó a guardarlo; si no, se arma con el fbclid del anuncio,
    // con la hora a la que la página lo vio (formato de Meta: fb.1.<ms>.<fbclid>).
    fbc: leerCookie(req, "_fbc").slice(0, 600) || (origen?.fbclid ? `fb.1.${origen.ts}.${origen.fbclid}` : ""),
  };
  const conConsentimiento = leerCookie(req, "cookie_consent") === "accepted";
  const mandarAMeta = process.env.META_CAPI_SOLO_CON_CONSENTIMIENTO !== "1" || conConsentimiento;

  // 2 · lo demás, después de responder.
  after(async () => {
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
      // Las menores, directas a la Comunidad: su nota no lleva el enlace de la formación
      // (Carlos, 2026-10-07). El plan se manda después de prospectarla, nunca al llegar.
      const cierre = cierreRecomendado({ edad: Number.isFinite(edad) ? edad : null });
      try {
        const recomendado = urlDePlan(contactId, cierre);
        enlaces = (
          cierre === "comunidad"
            ? [
                "",
                "Menor de edad: su plan va con el cierre de la Comunidad. Se manda después de prospectarla:",
                recomendado,
              ]
            : [
                "",
                "Su plan personalizado (formación, palabra ACCESO). Se manda después de prospectarla:",
                recomendado,
                "Si al hablar con ella encaja mejor la Comunidad, el mismo plan con ese cierre:",
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

    const r = await Promise.allSettled([
      contacto(),
      ponerTarjeta(contactId, nombre), // secundaria: si falla, la lead ya está guardada
      mandarAMeta ? enviarMeta(datosMeta) : Promise.resolve(),
    ]);
    for (const x of r) if (x.status === "rejected") console.error("plan/lead: después de responder", String(x.reason).slice(0, 200));
  });

  return NextResponse.json({ ok: true, id: contactId });
}
