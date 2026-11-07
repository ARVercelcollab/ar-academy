import { NextResponse, after } from "next/server";
import { stripe, PRECIO_PLAN, EUROS_PLAN, PAGO_PLAN } from "@/lib/stripe";
import { datosNavegador, puedeIrAMeta, solicitudPlanEnMeta } from "@/lib/meta";
import { fichaPorDatos, planPagadoEnGHL } from "@/lib/plan/pagado";
import { GRUPO, altaEnMailerLite, quitarDeGrupo, regionDe } from "@/lib/mailerlite";
import { urlDePlan } from "@/lib/plan/token";
import { cierreRecomendado } from "@/lib/plan/contenido";
import { mensajeDeError } from "@/lib/stripe-errores";

/**
 * El pago del plan personalizado: 9 € en un solo pago, desde el 7-11-2026 (Carlos).
 *
 * Ella rellena /plan entero (eso ya crea su ficha en GHL con `plan · sin pagar`, ver
 * /api/plan/lead) y al final paga aquí, sin salir de la página. La tarjeta se valida con un
 * SetupIntent (/api/create-setup) y el cobro lo hace el servidor con una factura, como el workshop.
 *
 * Al cobrar, después de responder (`after()`), lo que antes pasaba al enviar el formulario:
 *   · GHL: `plan · pagado` en lugar de `plan · sin pagar`, `revisar humano` y su tarjeta en
 *     «Plan personalizado» (src/lib/plan/pagado.ts);
 *   · MailerLite: el grupo «Plan personalizado», que arranca su secuencia (las que no pagan no
 *     reciben los emails con su plan);
 *   · Meta: SubmitApplication con 9 € de valor, con el mismo event_id que el píxel de /plan/gracias.
 *
 * La factura lleva `producto: plan_personalizado`: /api/stripe-webhook no avisa a Make (no da Skool)
 * ni la cuenta como compra del workshop.
 *
 * GET devuelve la clave pública de Stripe y el precio, para el HTML estático de /plan.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { euros: EUROS_PLAN, pk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "" },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}

const EMAIL_OK = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const TELEFONO_OK = /^\+[1-9]\d{7,14}$/;
const ID_GHL = /^[A-Za-z0-9]{10,40}$/;
const EVENT_ID = /^[A-Za-z0-9-]{8,80}$/;

const texto = (v: unknown, max = 300) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]+/g, " ").trim().slice(0, max) : "";

// Solo desde nuestra web (como /api/plan/lead).
function origenPermitido(req: Request): boolean {
  for (const cab of ["origin", "referer"]) {
    const v = req.headers.get(cab);
    if (!v || v === "null") continue;
    try {
      const u = new URL(v);
      const h = u.hostname.toLowerCase();
      if (h === "localhost" || h === "127.0.0.1") return true;
      return u.protocol === "https:" && (h === "ariannyrivasacademy.com" || h === "www.ariannyrivasacademy.com" || h.endsWith(".vercel.app"));
    } catch {
      return false;
    }
  }
  return true; // sin Origin ni Referer (algunos navegadores): se deja, Stripe valida el pago
}

export async function POST(req: Request) {
  if (!origenPermitido(req)) return NextResponse.json({ error: "origen" }, { status: 403 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición mal formada" }, { status: 400 });
  }
  const nombre = texto(b.nombre, 120);
  const email = texto(b.email, 160).toLowerCase();
  const telefono = texto(b.telefono, 20);
  const paymentMethodId = texto(b.paymentMethodId, 80);
  if (!nombre || !EMAIL_OK.test(email) || !TELEFONO_OK.test(telefono) || !/^pm_[A-Za-z0-9]+$/.test(paymentMethodId)) {
    return NextResponse.json({ error: "Faltan datos para el pago. Recarga la página e inténtalo de nuevo." }, { status: 400 });
  }
  const contactIdForm = ID_GHL.test(texto(b.contactId, 40)) ? texto(b.contactId, 40) : "";
  const eventId = EVENT_ID.test(texto(b.eid, 80)) ? texto(b.eid, 80) : "";
  const ingresos = texto(b.ingresos_actuales, 60);
  const menosDe750 = ingresos === "Menos de 750 €" || ingresos === "Todavía nada";
  const edad = Number.parseInt(texto(b.edad, 3), 10);
  const pais = texto(b.pais, 60);
  const paisNombre = texto(b.pais_nombre, 60);
  const o = (b.origen && typeof b.origen === "object" ? b.origen : {}) as Record<string, unknown>;
  // Lo del navegador, ahora: después de responder ya no está.
  const navegador = datosNavegador(req, o.fbclid, o.ts);
  const aMeta = puedeIrAMeta(req);

  // ¿Ya lo pagó con este correo? Pasa si la respuesta se perdió (sin cobertura, recargó, el
  // navegador de Instagram cerró la pestaña) o si vuelve días después: no se le cobra dos veces.
  try {
    const previa = await pagoReciente(email);
    if (previa) {
      console.log("plan/pago: ya estaba pagado; no se cobra otra vez", previa.id);
      return NextResponse.json({ success: true, invoiceId: previa.id, euros: (previa.amount_paid ?? 0) / 100 || EUROS_PLAN, yaPagado: true });
    }
  } catch (e) {
    console.error("plan/pago: no pude comprobar si ya había pagado", String(e).slice(0, 200));
  }

  let facturaId: string | null = null;
  try {
    const customer = await stripe.customers.create({
      name: nombre,
      email,
      phone: telefono,
      metadata: { producto: PAGO_PLAN, ...(contactIdForm ? { ghl: contactIdForm } : {}) },
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    const factura = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "charge_automatically",
      auto_advance: false,
      default_payment_method: paymentMethodId,
      description: "Plan personalizado AR Academy · pago único",
      metadata: { producto: PAGO_PLAN, canal: "web", ...(contactIdForm ? { ghl: contactIdForm } : {}) },
    });
    facturaId = factura.id;
    await stripe.invoiceItems.create({ customer: customer.id, invoice: factura.id, pricing: { price: PRECIO_PLAN } });
    await stripe.invoices.finalizeInvoice(factura.id);
    // Si la llamada de cobro se corta después de cobrar (red), se mira cómo quedó la factura: un
    // cobro hecho no puede acabar en «error» para ella.
    const pagada = await stripe.invoices
      .pay(factura.id, { payment_method: paymentMethodId })
      .catch(async (e: unknown) => {
        const f = await stripe.invoices.retrieve(factura.id).catch(() => null);
        if (f && f.status === "paid") return f;
        throw e;
      });

    if (pagada.status !== "paid") {
      await anular(facturaId);
      return NextResponse.json({ error: "El pago no se ha podido completar. Inténtalo de nuevo." }, { status: 400 });
    }

    const euros = (pagada.amount_paid ?? EUROS_PLAN * 100) / 100;
    after(async () => {
      // Si el formulario no devolvió su id (GHL tardó), se busca su ficha por correo y teléfono.
      const contactId = contactIdForm || (await fichaPorDatos(nombre, email, telefono));
      if (!contactId) console.error("plan/pago: PAGADO sin ficha en GHL; hay que buscarla a mano", pagada.id);
      let planUrl = "";
      try {
        if (contactId) planUrl = urlDePlan(contactId, cierreRecomendado(menosDe750));
      } catch {
        // sin PLAN_TOKEN_SECRET: entra sin el enlace
      }
      const r = await Promise.allSettled([
        planPagadoEnGHL({ contactId, nombre, menosDe750, facturaId: pagada.id, euros }),
        quitarDeGrupo(email, GRUPO.planSinPagar).then(() =>
        altaEnMailerLite({
          email,
          grupo: GRUPO.plan,
          nombre,
          origen: "plan",
          etapa: "lead",
          edad: Number.isFinite(edad) ? edad : null,
          pais: paisNombre === "Otro país" ? "" : paisNombre,
          region: regionDe(pais),
          ocupacion: texto(b.ocupacion, 120),
          dolorPlan: texto(b.dolor_principal, 900),
          planUrl,
          consentimiento: "formulario plan",
          ghlId: contactId,
          ip: navegador.ip,
        })),
        aMeta
          ? solicitudPlanEnMeta({ eventId, contactId, email, telefono, nombre, euros, navegador })
          : Promise.resolve(false),
      ]);
      for (const x of r) if (x.status === "rejected") console.error("plan/pago: después de cobrar", String(x.reason).slice(0, 200));
    });

    return NextResponse.json({ success: true, invoiceId: pagada.id, euros });
  } catch (err: unknown) {
    // Una tarjeta rechazada deja la factura abierta: se anula para que no quede pendiente.
    await anular(facturaId);
    const e = err as { code?: string; decline_code?: string; type?: string; message?: string };
    console.warn("plan/pago: cobro rechazado", e.code || e.type, e.decline_code || "");
    return NextResponse.json({ error: mensajeDeError(e), reintentar: true }, { status: 402 });
  }
}

// Una factura del plan ya pagada con este correo (el plan se compra una vez).
async function pagoReciente(email: string) {
  const clientes = await stripe.customers.list({ email, limit: 20 });
  for (const c of clientes.data) {
    if (c.metadata?.producto !== PAGO_PLAN) continue;
    const f = (await stripe.invoices.list({ customer: c.id, status: "paid", limit: 1 })).data[0];
    if (f && f.metadata?.producto === PAGO_PLAN) return f;
  }
  return null;
}

async function anular(id: string | null) {
  if (!id) return;
  try {
    const f = await stripe.invoices.retrieve(id);
    if (f.status === "open") await stripe.invoices.voidInvoice(id);
    else if (f.status === "draft") await stripe.invoices.del(id);
  } catch {
    // Si no se puede anular, se queda abierta: no se cobra sola (auto_advance: false).
  }
}
