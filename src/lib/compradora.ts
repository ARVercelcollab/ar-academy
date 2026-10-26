/**
 * La que compra el workshop, en GHL (Carlos, 2026-10-24: «que también las setters las puedan
 * contactar»). Su ficha (la de Instagram si ya la tiene; si no, upsert por email y teléfono), sus
 * etiquetas, una nota con lo que compró y su tarjeta en el pipeline «Workshop», para que las setters
 * la vean en GHL y le escriban por WhatsApp.
 *
 * REGLAS DURAS (las mismas que el alta en MailerLite):
 *   · NUNCA impide cobrar ni el acceso a Skool. Se llama desde /api/stripe-webhook con `after()`,
 *     después de responder a Stripe, y cualquier fallo se queda en un console.error.
 *   · Sin GHL_TOKEN o GHL_LOCATION_ID no hace nada.
 *   · Las etiquetas se suman con el endpoint que suma; nunca se sustituyen las que tenía.
 */

import { type Candidata, elegirFicha, normalizaHandle } from "@/lib/plan/instagram";

const API = "https://services.leadconnectorhq.com";

// El campo `ig_handle` de la ficha, el mismo que llena el formulario del plan.
const CAMPO_IG = "HZp3lXGMOGol5cU7RvvW";

// El pipeline «Workshop» (Carlos, 2026-10-24: «ahí deberían entrar todas las chicas que compren»).
// Creado con 06-infraestructura/ghl/crear-pipeline-workshop.py; los IDs, en 05-mapa-pipeline-workshop.md.
const PIPELINE_WORKSHOP = "Scx1hDRzG4NPBhog0kgY";
const ETAPA_COMPRO_WORKSHOP = "e0033f7c-cf94-4d50-a3cb-dddda310af36";
// Si ya tenía tarjeta abierta en uno de estos, esa se mueve al «Workshop»: una tarjeta por chica.
const PIPELINE_CAPTACION = "lPD7Qhnb1Ak8Vlexzml8";
const PIPELINE_PLAN = "fBlrzlgSgTbZ5mlA9lh8";

// La etiqueta de la compra. Es la que filtran las setters en GHL para ver a las del workshop.
export const TAG_COMPRA_WORKSHOP = "compro-workshop-24-11";
const TAG_COMPRA_COMUNIDAD = "compro-comunidad";
const TAG_MAYOR_EDAD = "mayor de edad"; // las mismas que pone /api/plan/lead
const TAG_MENOR_EDAD = "menor de edad";

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
      datos = { _raw: texto.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status, datos };
  } catch (e) {
    return { ok: false, status: 0, datos: { error: String(e).slice(0, 200) } };
  }
}

const corto = (r: Resp) => JSON.stringify(r.datos ?? "").slice(0, 300);

export type Compra = {
  nombre: string;
  email: string;
  telefono: string;
  edad: number | null;
  instagram: string; // su @, sin la arroba ("" si no lo dio)
  euros: number;
  workshop: boolean; // si la compra incluye el workshop (o su grabación)
  descripcion: string; // lo que dice la factura
};

// Su ficha de Instagram, por el @ (la regla, en src/lib/plan/instagram.ts).
async function fichaDeInstagram(ig: string): Promise<Candidata | null> {
  if (ig.length < 3) return null;
  const r = await ghl("POST", "/contacts/search", {
    locationId: process.env.GHL_LOCATION_ID,
    pageLimit: 20,
    query: ig,
  });
  if (!r.ok) {
    console.error("compradora: la búsqueda por @ falló", r.status, corto(r));
    return null;
  }
  return elegirFicha((r.datos as { contacts?: Candidata[] }).contacts ?? [], ig, CAMPO_IG);
}

async function tarjetaAbierta(contactId: string, pipelineId: string) {
  const r = await ghl(
    "GET",
    `/opportunities/search?location_id=${process.env.GHL_LOCATION_ID}` +
      `&contact_id=${contactId}&pipeline_id=${pipelineId}&status=open`,
  );
  return (r.datos as { opportunities?: { id: string }[] }).opportunities?.[0] || null;
}

// Su tarjeta en «Workshop · 1 · Compró el workshop». Si ya está en el «Workshop», no se toca; si
// tiene una abierta en Captación o en Plan personalizado, se mueve; si no, una nueva.
async function tarjetaWorkshop(contactId: string, nombre: string, euros: number) {
  if (await tarjetaAbierta(contactId, PIPELINE_WORKSHOP)) return;
  const destino = {
    pipelineId: PIPELINE_WORKSHOP,
    pipelineStageId: ETAPA_COMPRO_WORKSHOP,
    monetaryValue: euros,
  };
  for (const pipeline of [PIPELINE_PLAN, PIPELINE_CAPTACION]) {
    const vieja = await tarjetaAbierta(contactId, pipeline);
    if (!vieja) continue;
    const mv = await ghl("PUT", `/opportunities/${vieja.id}`, destino);
    if (mv.ok) return;
    console.error("compradora: mover la tarjeta falló; se crea otra", mv.status, corto(mv));
    break;
  }
  const nueva = await ghl("POST", "/opportunities/", {
    ...destino,
    locationId: process.env.GHL_LOCATION_ID,
    contactId,
    name: nombre || "Compradora del workshop",
    status: "open",
  });
  if (!nueva.ok) console.error("compradora: la tarjeta del workshop falló", nueva.status, corto(nueva));
}

export async function compradoraEnGHL(c: Compra): Promise<void> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) return;
  if (!c.email && !c.telefono) return;
  try {
    const [nom, ...resto] = String(c.nombre || "").trim().split(/\s+/);
    const ig = normalizaHandle(c.instagram);
    const campos = ig ? [{ id: CAMPO_IG, value: ig }] : undefined;
    const cuerpo = {
      locationId: process.env.GHL_LOCATION_ID,
      firstName: nom || undefined,
      lastName: resto.join(" ") || undefined,
      name: c.nombre || undefined,
      email: c.email || undefined,
      phone: c.telefono || undefined,
      source: c.workshop ? "Compra workshop 24-11" : "Compra Comunidad",
      customFields: campos,
    };

    // Si ya tiene ficha de Instagram (la de su conversación con la setter), todo va a esa, como
    // en el plan. El correo y el teléfono, solo si el hueco está vacío.
    let id = "";
    const deInstagram = await fichaDeInstagram(ig);
    if (deInstagram) {
      const put = await ghl("PUT", `/contacts/${deInstagram.id}`, {
        firstName: cuerpo.firstName,
        lastName: cuerpo.lastName,
        name: cuerpo.name,
        customFields: campos,
        ...(deInstagram.email ? {} : { email: cuerpo.email }),
        ...(deInstagram.phone ? {} : { phone: cuerpo.phone }),
      });
      if (put.ok) id = deInstagram.id;
      else console.warn("compradora: no se pudo escribir en su ficha de Instagram; upsert", put.status, corto(put));
    }
    if (!id) {
      let up = await ghl("POST", "/contacts/upsert", cuerpo);
      if (!up.ok && (up.status === 0 || up.status === 429 || up.status >= 500)) {
        await new Promise((ok) => setTimeout(ok, 700));
        up = await ghl("POST", "/contacts/upsert", cuerpo);
      }
      id = (up.datos as { contact?: { id?: string } })?.contact?.id ?? "";
      if (!up.ok || !id) {
        console.error("compradora: el upsert en GHL falló", up.status, corto(up));
        return;
      }
    }

    const tags = [TAG_COMPRA_COMUNIDAD];
    if (c.workshop) tags.push(TAG_COMPRA_WORKSHOP);
    if (c.edad !== null) tags.push(c.edad >= 18 ? TAG_MAYOR_EDAD : TAG_MENOR_EDAD);
    const et = await ghl("POST", `/contacts/${id}/tags`, { tags });
    if (!et.ok) console.error("compradora: las etiquetas fallaron", et.status, corto(et));

    const dia = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    const nota = await ghl("POST", `/contacts/${id}/notes`, {
      body:
        `Compró: ${c.descripcion} (${c.euros} €), el ${dia} (hora de Madrid).` +
        (ig ? ` Instagram: @${ig}.` : "") +
        (c.workshop ? " Va al grupo de WhatsApp del workshop." : "") +
        (c.edad !== null && c.edad < 18 ? ` Es menor: ${c.edad} años.` : ""),
    });
    if (!nota.ok) console.error("compradora: la nota falló", nota.status, corto(nota));

    if (c.workshop) await tarjetaWorkshop(id, c.nombre, c.euros);
  } catch (e) {
    console.error("compradora: error inesperado", String(e).slice(0, 200));
  }
}
