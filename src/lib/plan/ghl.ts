/**
 * Lectura y escritura mínima en GHL para el plan de cada chica.
 * Mismo token y misma versión de API que /api/plan/lead.
 */

const API = "https://services.leadconnectorhq.com";

// Ids de los campos personalizados de la location (los mismos que escribe /api/plan/lead).
export const CAMPO = {
  pais: "Fa3wIcXiLSVPqSiPh8IT",
  edad: "88m7ssAx938v1EDSUkwy",
  ocupacion: "ZUijgP2DDrGjc7QtABn4",
  dolor_principal: "Qa2YdPWLsrlU1AZxPwkv",
  ig_handle: "HZp3lXGMOGol5cU7RvvW",
  ingresos_actuales: "Y3m8c3leyhSexHnd3fUI",
  objetivo_ingresos: "KEy5615AVTdYDoTLHVLv",
} as const;

export type Ficha = {
  id: string;
  nombre: string; // solo el nombre de pila
  pais: string;
  edad: number | null;
  ocupacion: string;
  dolor: string;
  ingresos: string;
  objetivo: string;
  tags: string[];
};

async function ghl(metodo: string, ruta: string, cuerpo?: unknown) {
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
    // Ella está esperando a que cargue su plan: si GHL no contesta, mejor el aviso de
    // «prueba en un minuto» que una página en blanco hasta que Vercel corte la función.
    signal: AbortSignal.timeout(8000),
  });
  const texto = await r.text();
  let datos: Record<string, unknown> = {};
  try {
    datos = JSON.parse(texto || "{}");
  } catch {
    datos = {};
  }
  return { ok: r.ok, status: r.status, datos };
}

type CampoGHL = { id: string; value?: unknown; fieldValue?: unknown };

export async function leerFicha(contactId: string): Promise<Ficha | null> {
  if (!process.env.GHL_TOKEN) throw new Error("plan/ghl: falta GHL_TOKEN");
  const r = await ghl("GET", `/contacts/${contactId}`);
  if (!r.ok) {
    // GHL responde 400 a un id que no existe (comprobado el 2026-10-07): eso sí es «este
    // enlace no vale». Lo demás (401 token caducado, 429 límite, 5xx caído) es temporal y
    // tiene que quedar en el registro: si no, todas verían «enlace no válido» sin rastro.
    if (r.status === 400 || r.status === 404 || r.status === 422) return null;
    throw new Error(`plan/ghl: GHL respondió ${r.status} al leer la ficha`);
  }
  const c = (r.datos as { contact?: Record<string, unknown> }).contact;
  if (!c || (process.env.GHL_LOCATION_ID && c.locationId !== process.env.GHL_LOCATION_ID)) return null;
  const campos = (c.customFields as CampoGHL[] | undefined) || [];
  const v = (id: string) => {
    const f = campos.find((x) => x.id === id);
    const val = f?.value ?? f?.fieldValue;
    return typeof val === "string" ? val.trim() : Array.isArray(val) ? String(val[0] ?? "").trim() : val != null ? String(val) : "";
  };
  const edad = parseInt(v(CAMPO.edad), 10);
  const nombre = String(c.firstName || c.name || "").trim().split(/\s+/)[0] || "";
  return {
    id: contactId,
    nombre: nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase() : "",
    pais: v(CAMPO.pais),
    edad: Number.isFinite(edad) ? edad : null,
    ocupacion: v(CAMPO.ocupacion),
    dolor: v(CAMPO.dolor_principal),
    ingresos: v(CAMPO.ingresos_actuales),
    objetivo: v(CAMPO.objetivo_ingresos),
    tags: ((c.tags as string[] | undefined) || []).map(String),
  };
}

/** Suma etiquetas (nunca sustituye). */
export async function sumarEtiquetas(contactId: string, tags: string[]) {
  return ghl("POST", `/contacts/${contactId}/tags`, { tags });
}

export async function anadirNota(contactId: string, body: string) {
  return ghl("POST", `/contacts/${contactId}/notes`, { body });
}
