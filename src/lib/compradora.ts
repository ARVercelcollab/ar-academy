/**
 * La que compra el workshop, en GHL (Carlos, 2026-10-24: «que también las setters las puedan
 * contactar»). Upsert del contacto por email y teléfono, sus etiquetas y una nota con lo que compró,
 * para que las setters la vean en GHL y le escriban por WhatsApp.
 *
 * REGLAS DURAS (las mismas que el alta en MailerLite):
 *   · NUNCA impide cobrar ni el acceso a Skool. Se llama desde /api/stripe-webhook con `after()`,
 *     después de responder a Stripe, y cualquier fallo se queda en un console.error.
 *   · Sin GHL_TOKEN o GHL_LOCATION_ID no hace nada.
 *   · Las etiquetas se suman con el endpoint que suma; nunca se sustituyen las que tenía.
 */

const API = "https://services.leadconnectorhq.com";

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
  euros: number;
  workshop: boolean; // si la compra incluye el workshop (o su grabación)
  descripcion: string; // lo que dice la factura
};

export async function compradoraEnGHL(c: Compra): Promise<void> {
  if (!process.env.GHL_TOKEN || !process.env.GHL_LOCATION_ID) return;
  if (!c.email && !c.telefono) return;
  try {
    const [nom, ...resto] = String(c.nombre || "").trim().split(/\s+/);
    const cuerpo = {
      locationId: process.env.GHL_LOCATION_ID,
      firstName: nom || undefined,
      lastName: resto.join(" ") || undefined,
      name: c.nombre || undefined,
      email: c.email || undefined,
      phone: c.telefono || undefined,
      source: c.workshop ? "Compra workshop 24-11" : "Compra Comunidad",
    };
    let up = await ghl("POST", "/contacts/upsert", cuerpo);
    if (!up.ok && (up.status === 0 || up.status === 429 || up.status >= 500)) {
      await new Promise((ok) => setTimeout(ok, 700));
      up = await ghl("POST", "/contacts/upsert", cuerpo);
    }
    const id = (up.datos as { contact?: { id?: string } })?.contact?.id;
    if (!up.ok || !id) {
      console.error("compradora: el upsert en GHL falló", up.status, corto(up));
      return;
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
        (c.workshop ? " Va al grupo de WhatsApp del workshop." : "") +
        (c.edad !== null && c.edad < 18 ? ` Es menor: ${c.edad} años.` : ""),
    });
    if (!nota.ok) console.error("compradora: la nota falló", nota.status, corto(nota));
  } catch (e) {
    console.error("compradora: error inesperado", String(e).slice(0, 200));
  }
}
