/**
 * La chica ya ha pagado su plan (10€): GHL lo sabe (Carlos, 2026-11-07: «en caso de que no hayan
 * pagado, en GHL debe estar marcado»).
 *
 * Al rellenar /plan (src/app/api/plan/lead), su ficha queda con `plan · sin pagar` y su tarjeta en
 * «Plan personalizado · 0 · Sin pagar» (la columna se creó el 7-11, a propuesta de Carlos): así las
 * setters ven a las que se quedaron a un paso. Al pagar, desde /api/plan/pago:
 *   · fuera `plan · sin pagar`; dentro `plan · pagado` y `revisar humano` (el panel de las setters);
 *   · una nota con el pago;
 *   · su tarjeta pasa de «0 · Sin pagar» a la 1 · Solicita plan, o a la 6 · Comunidad si marcó menos
 *     de 750 €. Si ya estaba más adelante en el Plan, no se toca.
 *
 * REGLA DURA: nunca impide el pago ni la página de gracias. Corre en `after()` y los fallos se
 * quedan en console.error.
 */

const API = "https://services.leadconnectorhq.com";
const PIPELINE_PLAN = "fBlrzlgSgTbZ5mlA9lh8";
const PIPELINE_CAPTACION = "lPD7Qhnb1Ak8Vlexzml8";
const ETAPA_SOLICITA_PLAN = "e8d262bf-006e-4e59-93b9-3457d406b8d3";
const ETAPA_COMUNIDAD = "4984b37b-2c14-40da-8502-72199e22a6f4";
export const ETAPA_SIN_PAGAR = "79a8fa0e-4765-4ebb-b8dd-71dbb0cf9080"; // «⚫ 0 · Sin pagar»

export const TAG_PLAN_SIN_PAGAR = "plan · sin pagar";
export const TAG_PLAN_PAGADO = "plan · pagado";
const TAG_REVISAR_HUMANO = "revisar humano";

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
  } catch (e) {
    return { ok: false, status: 0, datos: { error: String(e).slice(0, 200) } };
  }
}

type Tarjeta = { id: string; pipelineStageId?: string };

async function tarjetaAbierta(contactId: string, pipelineId: string): Promise<Tarjeta | null> {
  const r = await ghl(
    "GET",
    `/opportunities/search?location_id=${process.env.GHL_LOCATION_ID}` +
      `&contact_id=${contactId}&pipeline_id=${pipelineId}&status=open`,
  );
  return (r.datos as { opportunities?: Tarjeta[] }).opportunities?.[0] || null;
}

/** Su tarjeta en una etapa: la mueve desde Captación si la tenía allí, o la crea. */
async function ponerEn(id: string, nombre: string, etapa: string, euros?: number) {
  const enCaptacion = await tarjetaAbierta(id, PIPELINE_CAPTACION);
  if (enCaptacion) {
    const mv = await ghl("PUT", `/opportunities/${enCaptacion.id}`, { pipelineId: PIPELINE_PLAN, pipelineStageId: etapa });
    if (mv.ok) return;
    console.error("plan/pagado: mover la tarjeta de Captación falló; se crea otra", mv.status);
  }
  const nueva = await ghl("POST", "/opportunities/", {
    pipelineId: PIPELINE_PLAN,
    locationId: process.env.GHL_LOCATION_ID,
    pipelineStageId: etapa,
    contactId: id,
    name: nombre || "Plan personalizado",
    status: "open",
    ...(euros ? { monetaryValue: euros } : {}),
  });
  if (!nueva.ok) console.error("plan/pagado: la tarjeta falló", nueva.status);
}

/**
 * Al rellenar el formulario: su tarjeta en «0 · Sin pagar». Si ya tenía una abierta en el Plan
 * (una chica que ya pidió el plan y vuelve a rellenarlo), no se toca: no se la devuelve atrás.
 */
export async function tarjetaSinPagar(contactId: string, nombre: string): Promise<void> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID || !contactId) return;
  try {
    if (await tarjetaAbierta(contactId, PIPELINE_PLAN)) return;
    // Si una setter ya la lleva en Captación, su tarjeta se queda allí hasta que pague: la etiqueta
    // `plan · sin pagar` ya avisa. Al pagar, planPagadoEnGHL la pasa al Plan.
    if (await tarjetaAbierta(contactId, PIPELINE_CAPTACION)) return;
    await ponerEn(contactId, nombre, ETAPA_SIN_PAGAR);
  } catch (e) {
    console.error("plan/pagado: tarjeta sin pagar, error inesperado", String(e).slice(0, 200));
  }
}

/** ¿Su ficha ya lleva `plan · pagado`? Por si el pago llegó antes que lo que hace el formulario. */
export async function tienePlanPagado(contactId: string): Promise<boolean> {
  if (!process.env.GHL_TOKEN || !contactId) return false;
  const r = await ghl("GET", `/contacts/${contactId}`);
  const tags = ((r.datos as { contact?: { tags?: string[] } }).contact?.tags ?? []).map((t) => (t || "").trim().toLowerCase());
  return tags.includes(TAG_PLAN_PAGADO);
}

/** Su ficha por correo y teléfono, si el formulario no devolvió el id (GHL tardó). */
export async function fichaPorDatos(nombre: string, email: string, telefono: string): Promise<string> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) return "";
  const [nom, ...resto] = nombre.trim().split(/\s+/);
  const cuerpo = {
    locationId: process.env.GHL_LOCATION_ID,
    firstName: nom || undefined,
    lastName: resto.join(" ") || undefined,
    email: email || undefined,
    phone: telefono || undefined,
    source: "Formulario plan personalizado",
  };
  for (let intento = 0; intento < 3; intento++) {
    const up = await ghl("POST", "/contacts/upsert", cuerpo);
    const id = (up.datos as { contact?: { id?: string } })?.contact?.id ?? "";
    if (up.ok && id) return id;
    if (!(up.status === 0 || up.status === 401 || up.status === 429 || up.status >= 500)) {
      console.error("plan/pagado: no encuentro su ficha por correo y teléfono", up.status);
      return "";
    }
    await new Promise((ok) => setTimeout(ok, 700 * (intento + 1)));
  }
  console.error("plan/pagado: GHL no contesta al buscar su ficha");
  return "";
}

export async function planPagadoEnGHL(p: {
  contactId: string;
  nombre: string;
  menosDe750: boolean;
  facturaId: string;
  euros: number;
}): Promise<void> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID || !p.contactId) return;
  try {
    const id = p.contactId;
    const mas = await ghl("POST", `/contacts/${id}/tags`, { tags: [TAG_PLAN_PAGADO, TAG_REVISAR_HUMANO] });
    if (!mas.ok) console.error("plan/pagado: etiquetas fallaron", mas.status);
    const menos = await ghl("DELETE", `/contacts/${id}/tags`, { tags: [TAG_PLAN_SIN_PAGAR] });
    if (!menos.ok) console.error("plan/pagado: quitar «sin pagar» falló", menos.status);

    const dia = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    const nota = await ghl("POST", `/contacts/${id}/notes`, {
      body: `Pagó su plan personalizado: ${p.euros}€ (factura ${p.facturaId}), el ${dia} (hora de Madrid).`,
    });
    if (!nota.ok) console.error("plan/pagado: la nota falló", nota.status);

    // La tarjeta: de «0 · Sin pagar» a la 1 (o a la 6 si marcó menos de 750 €). Si ya estaba más
    // adelante, se queda donde está. Si no tenía (la del formulario falló), se pone ahora.
    const etapa = p.menosDe750 ? ETAPA_COMUNIDAD : ETAPA_SOLICITA_PLAN;
    const enPlan = await tarjetaAbierta(id, PIPELINE_PLAN);
    if (enPlan) {
      if (enPlan.pipelineStageId !== ETAPA_SIN_PAGAR) return;
      const mv = await ghl("PUT", `/opportunities/${enPlan.id}`, { pipelineStageId: etapa, monetaryValue: p.euros });
      if (!mv.ok) console.error("plan/pagado: pasar la tarjeta a pagada falló", mv.status);
      return;
    }
    await ponerEn(id, p.nombre, etapa, p.euros);
  } catch (e) {
    console.error("plan/pagado: error inesperado", String(e).slice(0, 200));
  }
}
