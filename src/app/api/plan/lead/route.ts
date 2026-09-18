import { NextResponse } from "next/server";

/**
 * Formulario del plan personalizado (/plan) → GHL.
 *
 * POR QUÉ AQUÍ Y NO DESDE LA PÁGINA: el token de GHL da acceso de escritura a toda la
 * cuenta. Desde el navegador lo vería cualquiera que abra el código. Aquí vive en el
 * servidor, en las variables de entorno de Vercel.
 *
 * QUÉ HACE, EN ORDEN:
 *   1. Upsert del contacto por email/teléfono — SIN etiquetas. Comprobado el 2026-09-17:
 *      si se le pasan, GHL SUSTITUYE las que tenía. Una chica que ya hablaba con Sofi
 *      perdía su estado entero al rellenar el formulario.
 *   2. La tarjeta. Si ya tiene una abierta en Captación (la de Sofi), se le MUEVE a
 *      «Plan personalizado». Si no tiene ninguna, tarjeta nueva en «Plan personalizado»
 *      · etapa 1. Una sola tarjeta siempre.
 *   3. Las etiquetas, con el endpoint que SUMA (`POST /contacts/{id}/tags`). Entre ellas
 *      SIEMPRE `revisar humano`: todas las del plan las llevan las setters (Carlos,
 *      2026-09-18). Está en la lista de exclusión de Sofi, así que aunque la chica
 *      escriba por Instagram, Sofi calla y la conversación es de las setters.
 *
 * El formulario solo escribe evidencia. El nivel de la lead y `menor de 24` los
 * reconcilia el backend de Sofi: jamás se ponen desde aquí.
 *
 * Variables de entorno:
 *   GHL_TOKEN        → Private Integration Token (pit-…)
 *   GHL_LOCATION_ID  → VRsUMhSaFqWKEQ05Q5kF
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
// La 3 («Plan enviado») la mueve la setter a mano, con la etiqueta
// `enviado-plan-personalizado`. Desde aquí no se toca.

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

function notaFormulario(b: Record<string, unknown>, edad: number, paisNombre: string, ig: string) {
  const fecha = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const lineas = [`Formulario del plan personalizado · ${fecha}`, ""];
  for (const [campo, texto] of PREGUNTAS) {
    const r = limpiar(b[campo], 300);
    if (r) lineas.push(texto, `→ ${r}`, "");
  }
  const ficha = [
    Number.isFinite(edad) ? `Edad: ${edad}` : "",
    paisNombre ? `País: ${paisNombre}` : "",
    ig ? `Instagram: @${ig}` : "",
  ].filter(Boolean);
  if (ficha.length) lineas.push(ficha.join(" · "));
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
};

// ── Etiquetas, con los nombres del 2026-08-19 ─────────────────────────────────
const TAG_INICIO_PLAN = "inicio-plan-personalizado"; // «ha iniciado», no «se le envió»
const TAG_MAYOR_EDAD = "mayor de edad";
const TAG_MENOR_EDAD = "menor de edad";
const TAG_PUEDE_PAGAR = "puede pagar";
const TAG_HT_PAIS_OK = "ht-pais-ok";
const TAG_REVISAR_HUMANO = "revisar humano"; // en TAGS_EXCLUSION del backend: Sofi calla
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

// País por su nombre, como hace Sofi: `españa` aparte (SeQura), `latam` entero, el
// resto cada uno el suyo.
function tagPais(grupo: string, nombre: unknown) {
  if (grupo === "España") return "españa";
  if (grupo === "Latinoamérica") return "latam";
  const n = limpiar(nombre, 40).toLowerCase();
  return n && n !== "otro país" ? n : "";
}

// El teléfono ya llega en E.164 desde el selector de prefijo. Esto es una red.
function telefonoE164(bruto: unknown, pais: string) {
  const solo = String(bruto || "").replace(/[^\d+]/g, "");
  if (solo.startsWith("+")) return solo;
  const porDefecto: Record<string, string> = { España: "+34", "Estados Unidos o Canadá": "+1" };
  const p = porDefecto[pais];
  return p && solo ? p + solo.replace(/^0+/, "") : solo;
}

type Resp = { ok: boolean; status: number; datos: Record<string, unknown> };

async function ghl(metodo: string, ruta: string, cuerpo?: unknown): Promise<Resp> {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${process.env.GHL_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let datos: Record<string, unknown> = {};
  try {
    datos = JSON.parse(texto || "{}");
  } catch {
    datos = { _raw: texto.slice(0, 300) };
  }
  return { ok: r.ok, status: r.status, datos };
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

export async function POST(req: Request) {
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

  // ── aviso de clic en WhatsApp: mueve la tarjeta a la etapa 2 ──────────────
  // Es el número que separa «rellenó el formulario» de «escribió de verdad».
  if (b.evento === "whatsapp_click") {
    // Si /plan/gracias trae el id que devolvimos al crear el contacto, se usa
    // directamente: el buscador de GHL tarda unos segundos en indexar un
    // contacto nuevo y, con la cuenta atrás de 5 s, buscarla por email llegaba
    // antes de que existiera para él. El email queda como respaldo.
    let cid = /^[A-Za-z0-9]{10,40}$/.test(String(b.id ?? "")) ? String(b.id) : "";
    if (!cid) {
      const clave = limpiar(b.email, 160).toLowerCase() || limpiar(b.telefono, 40);
      if (!clave) return NextResponse.json({ ok: true, ignorado: true });
      const busca = await ghl("POST", "/contacts/search", {
        locationId: process.env.GHL_LOCATION_ID,
        pageLimit: 1,
        filters: [{ field: "email", operator: "eq", value: clave }],
      });
      cid = (busca.datos as { contacts?: { id: string }[] }).contacts?.[0]?.id ?? "";
    }
    if (!cid) return NextResponse.json({ ok: true, ignorado: true });
    const opp = await oportunidadAbierta(cid, PIPELINE_PLAN);
    if (opp) {
      await ghl("PUT", `/opportunities/${opp.id}`, {
        pipelineId: PIPELINE_PLAN,
        pipelineStageId: ETAPA_WHATSAPP_INICIADO,
      });
    }
    return NextResponse.json({ ok: true });
  }

  const nombre = limpiar(b.nombre, 120);
  const email = limpiar(b.email, 160).toLowerCase();
  const pais = limpiar(b.pais, 60);
  const telefono = telefonoE164(b.telefono, pais);
  const edad = parseInt(String(b.edad), 10);

  if (!nombre || !email || !telefono) {
    return NextResponse.json({ error: "faltan_datos" }, { status: 400 });
  }

  // ── etiquetas: solo evidencia ──────────────────────────────────────────────
  const tags = [TAG_INICIO_PLAN, TAG_REVISAR_HUMANO];
  if (Number.isFinite(edad)) tags.push(edad >= 18 ? TAG_MAYOR_EDAD : TAG_MENOR_EDAD);
  const ocupacion = limpiar(b.ocupacion, 120);
  if (OCUPA_PAGO.includes(ocupacion)) tags.push(TAG_PUEDE_PAGAR);
  if (ocupacion === OCUPA_ESTUDIANTE) tags.push(TAG_ESTUDIANTE);
  const tramo = TAG_INGRESOS[limpiar(b.ingresos_actuales, 60)];
  if (tramo) tags.push(tramo);
  if (PAIS_HT_OK.includes(pais)) tags.push(TAG_HT_PAIS_OK);
  const tp = tagPais(pais, b.pais_nombre);
  if (tp) tags.push(tp);

  const [nom, ...resto] = nombre.split(/\s+/);

  // 1 · el contacto, SIN etiquetas (ver cabecera)
  const up = await ghl("POST", "/contacts/upsert", {
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
      ig_handle: limpiar(b.instagram, 80).replace(/^@/, ""),
      ingresos_actuales: limpiar(b.ingresos_actuales, 60),
      objetivo_ingresos: limpiar(b.objetivo_ingresos, 120),
    })
      .filter(([, v]) => v)
      .map(([k, v]) => ({ id: CAMPO[k], value: v })),
  });

  if (!up.ok) {
    console.error("plan/lead: upsert falló", up.status, JSON.stringify(up.datos).slice(0, 400));
    return NextResponse.json({ error: "crm" }, { status: 502 });
  }

  const contactId = (up.datos as { contact?: { id: string } }).contact?.id;
  if (!contactId) return NextResponse.json({ ok: true });

  // 1b · la nota con sus respuestas, tal cual. Los campos personalizados quedan
  //      en «Información adicional», donde nadie mira (Carlos, 2026-09-18); la
  //      nota sale en la ficha, en el panel de Conversaciones y en la tarjeta.
  const nota = await ghl("POST", `/contacts/${contactId}/notes`, {
    body: notaFormulario(b, edad, limpiar(b.pais_nombre, 60), limpiar(b.instagram, 80).replace(/^@/, "")),
  });
  if (!nota.ok) console.error("plan/lead: nota falló", nota.status, JSON.stringify(nota.datos).slice(0, 300));

  // 2 · la tarjeta. Es secundaria: si falla, la lead ya está guardada.
  let tarjeta = "nueva";
  const enCaptacion = await oportunidadAbierta(contactId, PIPELINE_CAPTACION);
  if (enCaptacion) {
    const mv = await ghl("PUT", `/opportunities/${enCaptacion.id}`, {
      pipelineId: PIPELINE_PLAN,
      pipelineStageId: ETAPA_FORMULARIO_RECIBIDO,
    });
    if (mv.ok) {
      tarjeta = "movida desde captación";
    } else {
      tarjeta = "no se pudo mover";
      console.error("plan/lead: mover tarjeta falló", mv.status, JSON.stringify(mv.datos).slice(0, 300));
    }
  } else if (!(await oportunidadAbierta(contactId, PIPELINE_PLAN))) {
    const opp = await ghl("POST", "/opportunities/", {
      pipelineId: PIPELINE_PLAN,
      locationId: process.env.GHL_LOCATION_ID,
      pipelineStageId: ETAPA_FORMULARIO_RECIBIDO,
      contactId,
      name: nombre,
      status: "open",
    });
    if (!opp.ok) {
      tarjeta = "falló";
      console.error("plan/lead: oportunidad falló", opp.status, JSON.stringify(opp.datos).slice(0, 300));
    }
  } else {
    tarjeta = "ya existía";
  }

  // 3 · las etiquetas, sumando a las que ya tenga.
  const et = await ghl("POST", `/contacts/${contactId}/tags`, { tags });
  if (!et.ok) console.error("plan/lead: etiquetas fallaron", et.status, JSON.stringify(et.datos).slice(0, 300));

  return NextResponse.json({ ok: true, id: contactId, tarjeta });
}
