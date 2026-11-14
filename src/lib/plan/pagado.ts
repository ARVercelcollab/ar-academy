/**
 * La chica ya ha pagado su plan (10€): GHL lo sabe (Carlos, 2026-11-07: «en caso de que no hayan
 * pagado, en GHL debe estar marcado»).
 *
 * Al rellenar /plan (src/app/api/plan/lead), su ficha queda con `inicio-plan-personalizado` y
 * `plan · sin pagar`, y su tarjeta en «Plan personalizado · 0 · Sin pagar» (la columna se creó el
 * 7-11, a propuesta de Carlos): así las setters ven a las que se quedaron a un paso. Al pagar,
 * desde /api/plan/pago:
 *   · una sola etiqueta del plan, `pagó plan personalizado 10€` (Carlos, 14-11: «a las que pagaron,
 *     se deja solo uno»): fuera `inicio-plan-personalizado`, `plan · sin pagar` y la de antes,
 *     `plan · pagado`; dentro también `revisar humano` (el panel de las setters);
 *   · el pago, justo debajo del título de su nota «Formulario del plan personalizado» (si la nota
 *     todavía no está, una nota aparte, como antes);
 *   · su tarjeta pasa de «0 · Sin pagar» a la 1 · Solicita plan, con el valor del plan, gane lo que
 *     gane: a todas las que pagan se las llama (Carlos, 14-11). La 6 («Menos de 750 € (ofrecer
 *     Comunidad)») queda para las del plan gratis. Si ya estaba más adelante en el Plan, no se mueve.
 *
 * REGLA DURA: nunca impide el pago ni la página de gracias. Corre en `after()` y los fallos se
 * quedan en console.error.
 */

const API = "https://services.leadconnectorhq.com";
const PIPELINE_PLAN = "fBlrzlgSgTbZ5mlA9lh8";
const PIPELINE_CAPTACION = "lPD7Qhnb1Ak8Vlexzml8";
const ETAPA_SOLICITA_PLAN = "e8d262bf-006e-4e59-93b9-3457d406b8d3";
export const ETAPA_SIN_PAGAR = "79a8fa0e-4765-4ebb-b8dd-71dbb0cf9080"; // «⚫ 0 · Sin pagar»

export const TAG_PLAN_SIN_PAGAR = "plan · sin pagar";
export const TAG_INICIO_PLAN = "inicio-plan-personalizado"; // rellenó el formulario (pague o no)
// GHL guarda las etiquetas en minúsculas. Lleva el precio porque Carlos lo quiere a la vista: si
// cambia EUROS_PLAN (src/lib/stripe.ts), cambia también aquí. esPagado reconoce cualquier precio.
export const TAG_PLAN_PAGADO = "pagó plan personalizado 10€";
const TAG_PLAN_PAGADO_ANTES = "plan · pagado"; // la del 7 al 14-11: se sigue reconociendo
const TAG_REVISAR_HUMANO = "revisar humano";
const NOTA_FORMULARIO = "Formulario del plan personalizado";

/** ¿Ya pagó su plan? Vale la etiqueta de ahora, la de antes y la de cualquier otro precio. */
export function esPagado(tags: string[] | undefined): boolean {
  return (tags ?? []).some((t) => {
    const x = (t || "").trim().toLowerCase();
    return x === TAG_PLAN_PAGADO_ANTES || x.startsWith("pagó plan personalizado");
  });
}

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

type Tarjeta = { id: string; pipelineStageId?: string; monetaryValue?: number };

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
    // Con su valor: hasta el 14-11 la tarjeta que venía de Captación se quedaba a 0 €.
    const valor = euros && !(Number(enCaptacion.monetaryValue) > 0) ? { monetaryValue: euros } : {};
    const mv = await ghl("PUT", `/opportunities/${enCaptacion.id}`, { pipelineId: PIPELINE_PLAN, pipelineStageId: etapa, ...valor });
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

/** ¿Su ficha ya dice que pagó? Por si el pago llegó antes que lo que hace el formulario. */
export async function tienePlanPagado(contactId: string): Promise<boolean> {
  if (!process.env.GHL_TOKEN || !contactId) return false;
  const r = await ghl("GET", `/contacts/${contactId}`);
  return esPagado((r.datos as { contact?: { tags?: string[] } }).contact?.tags);
}

type Nota = { id: string; body?: string; dateAdded?: string };

/**
 * El pago, justo debajo del título de su nota del formulario («Formulario del plan personalizado ·
 * fecha»), para que la setter lo vea nada más abrirla (Carlos, 14-11). Si la nota aún no está (el
 * formulario tarda), se espera un poco; si sigue sin estar, va en una nota aparte.
 */
async function pagoEnLaNota(id: string, euros: number, facturaId: string): Promise<void> {
  const cuando = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const linea = `✅ PAGÓ EL PLAN PERSONALIZADO · ${euros}€ · ${cuando} (hora de Madrid)`;
  for (let intento = 0; intento < 3; intento++) {
    const r = await ghl("GET", `/contacts/${id}/notes`);
    const notas = ((r.datos as { notes?: Nota[] }).notes ?? [])
      .filter((n) => (n.body || "").startsWith(NOTA_FORMULARIO))
      .sort((a, b) => String(b.dateAdded || "").localeCompare(String(a.dateAdded || "")));
    const nota = notas[0];
    if (nota) {
      const cuerpo = nota.body || "";
      if (cuerpo.includes("PAGÓ EL PLAN PERSONALIZADO")) return; // ya estaba (un reintento)
      const salto = cuerpo.indexOf("\n");
      const nuevo = salto < 0
        ? `${cuerpo}\n${linea}\n\nFactura de Stripe: ${facturaId}`
        : `${cuerpo.slice(0, salto)}\n${linea}${cuerpo.slice(salto)}\n\nFactura de Stripe: ${facturaId}`;
      const put = await ghl("PUT", `/contacts/${id}/notes/${nota.id}`, { body: nuevo });
      if (put.ok) return;
      console.error("plan/pagado: no pude escribir el pago en su nota; va aparte", put.status);
      break;
    }
    await new Promise((ok) => setTimeout(ok, 4000));
  }
  const aparte = await ghl("POST", `/contacts/${id}/notes`, { body: `${linea}\nFactura de Stripe: ${facturaId}` });
  if (!aparte.ok) console.error("plan/pagado: la nota falló", aparte.status);
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
  menosDe750: boolean; // ya no decide la etapa (14-11); se queda por si vuelve a hacer falta
  facturaId: string;
  euros: number;
}): Promise<void> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID || !p.contactId) return;
  try {
    const id = p.contactId;
    const mas = await ghl("POST", `/contacts/${id}/tags`, { tags: [TAG_PLAN_PAGADO, TAG_REVISAR_HUMANO] });
    if (!mas.ok) console.error("plan/pagado: etiquetas fallaron", mas.status);
    const menos = await ghl("DELETE", `/contacts/${id}/tags`, { tags: [TAG_PLAN_SIN_PAGAR, TAG_INICIO_PLAN, TAG_PLAN_PAGADO_ANTES] });
    if (!menos.ok) console.error("plan/pagado: quitar las etiquetas del formulario falló", menos.status);

    await pagoEnLaNota(id, p.euros, p.facturaId);

    // La tarjeta: de «0 · Sin pagar» a la 1, con el valor del plan, aunque haya marcado menos de
    // 750 €: a todas las que pagan se las llama (Carlos, 14-11). Si ya estaba más adelante, no se
    // mueve, pero se le pone el valor si no tenía. Si no tenía tarjeta (la del formulario falló),
    // se pone ahora.
    const etapa = ETAPA_SOLICITA_PLAN;
    const enPlan = await tarjetaAbierta(id, PIPELINE_PLAN);
    if (enPlan) {
      const sinValor = !(Number(enPlan.monetaryValue) > 0);
      if (enPlan.pipelineStageId !== ETAPA_SIN_PAGAR && !sinValor) return;
      const cambios = enPlan.pipelineStageId === ETAPA_SIN_PAGAR
        ? { pipelineStageId: etapa, monetaryValue: p.euros }
        : { monetaryValue: p.euros };
      const mv = await ghl("PUT", `/opportunities/${enPlan.id}`, cambios);
      if (!mv.ok) console.error("plan/pagado: pasar la tarjeta a pagada falló", mv.status);
      return;
    }
    await ponerEn(id, p.nombre, etapa, p.euros);
  } catch (e) {
    console.error("plan/pagado: error inesperado", String(e).slice(0, 200));
  }
}
