import { NextRequest, NextResponse, after } from "next/server";
import {
  stripe,
  PRECIO_COMUNIDAD,
  PRECIO_COMUNIDAD_DICIEMBRE,
  PRODUCTO_COMUNIDAD,
  PAGO_COMUNIDAD,
} from "@/lib/stripe";
import { cobroComunidad, OFERTA, esDelWorkshop, type Fase } from "@/lib/comunidad";
import { normalizaHandle } from "@/lib/plan/instagram";
import { mensajeDeError } from "@/lib/stripe-errores";
import { compraEnMeta, datosNavegador, puedeIrAMeta } from "@/lib/meta";

// La Comunidad en un solo pago. En noviembre va con el workshop del 24-11 (99 € hasta el 16-11, 149 €
// hasta el 30-11) y desde el 1-12 se vende sola a 199 € (src/lib/comunidad.ts). Antes era una
// suscripción de 27 €/mes; la ruta conserva el nombre porque es la que llaman los formularios.
// Se cobra con una factura, no con un pago suelto, para que el aviso a Make (el correo con el
// acceso a Skool) siga saliendo de /api/stripe-webhook con invoice.payment_succeeded, y Stripe
// lo reintente si Make cae.
export async function POST(req: NextRequest) {
  let facturaId: string | null = null;
  try {
    const { name, email, phone, paymentMethodId, instagram, origen, renuncia } = await req.json();

    if (!name || !email || !phone || !paymentMethodId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // El precio y la oferta, con la fecha de ahora (y media hora de margen).
    const { euros, fase } = cobroComunidad();
    const oferta = OFERTA[fase];
    const ig = normalizaHandle(instagram).slice(0, 30);
    // Para Meta, lo del navegador se lee ahora: después de responder ya no está.
    const o = (origen && typeof origen === "object" ? origen : {}) as Record<string, unknown>;
    const navegador = datosNavegador(req, o.fbclid, o.ts);
    const aMeta = puedeIrAMeta(req);
    const pagina = paginaDeCompra(req.headers.get("referer"));

    const customer = await stripe.customers.create({
      name,
      email,
      phone,
      // Su @ de Instagram lo pide la página del workshop (Carlos, 2026-10-24, en lugar de la edad):
      // con él se encuentra su ficha de Instagram en GHL. El origen (utm_*), para saber si vende
      // el email, el anuncio o la bio.
      metadata: { oferta, ...(ig ? { instagram: ig } : {}), ...utms(origen) },
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const factura = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "charge_automatically",
      auto_advance: false,
      default_payment_method: paymentMethodId,
      description: DESCRIPCION[fase],
      // «producto» es lo que manda el aviso a Make (el acceso a Skool); «oferta», lo que mete a la
      // compradora en el grupo del workshop.
      // «canal: web»: la compra ya va a Meta desde aquí; el webhook solo la manda si viene de un
      // enlace de pago de Stripe, que no pasa por esta ruta.
      metadata: {
        producto: PAGO_COMUNIDAD,
        oferta,
        canal: "web",
        // La casilla del desistimiento (Carlos, 7-11): si entra en la Comunidad o ve el workshop, ya no.
        desistimiento: renuncia === true ? `aceptó perderlo al acceder · ${new Date().toISOString()}` : "sin casilla",
      },
    });
    facturaId = factura.id;

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: factura.id,
      // 99 € y 199 € son precios de Stripe; el de 149 € va sobre el mismo producto.
      ...(euros === 99
        ? { pricing: { price: PRECIO_COMUNIDAD } }
        : euros === 199
          ? { pricing: { price: PRECIO_COMUNIDAD_DICIEMBRE } }
          : { price_data: { currency: "eur", product: PRODUCTO_COMUNIDAD, unit_amount: euros * 100 } }),
    });
    await stripe.invoices.finalizeInvoice(factura.id);
    // Si la llamada de cobro se corta después de cobrar, se mira cómo quedó la factura.
    const pagada = await stripe.invoices
      .pay(factura.id, { payment_method: paymentMethodId })
      .catch(async (e: unknown) => {
        const f = await stripe.invoices.retrieve(factura.id).catch(() => null);
        if (f && f.status === "paid") return f;
        throw e;
      });

    if (pagada.status === "paid") {
      // La compra, a Meta desde el servidor, con el mismo id que el píxel (src/lib/meta.ts).
      if (aMeta) {
        after(() =>
          compraEnMeta({
            facturaId: pagada.id,
            euros,
            contenido: esDelWorkshop(oferta) ? "Workshop 24-11" : "AR Academy",
            email,
            telefono: String(phone),
            nombre: String(name),
            clienteId: customer.id,
            navegador,
            pagina,
          }),
        );
      }
      return NextResponse.json({
        success: true,
        invoiceId: pagada.id,
        customerId: customer.id,
        euros,
        oferta,
        // El enlace del grupo de WhatsApp del workshop solo se da después de pagar: el repo es
        // público y el grupo no (ver grupoDelWorkshop).
        grupoWhatsApp: esDelWorkshop(oferta) ? await grupoDelWorkshop() : "",
      });
    }

    await anular(facturaId);
    return NextResponse.json(
      { error: `El pago no se ha podido procesar (estado: ${pagada.status})` },
      { status: 400 }
    );
  } catch (err: unknown) {
    // Una tarjeta rechazada deja la factura abierta: se anula para que no quede pendiente.
    await anular(facturaId);
    const stripeErr = err as { code?: string; decline_code?: string; type?: string; message?: string };
    console.warn("create-subscription: cobro rechazado", stripeErr.code || stripeErr.type, stripeErr.decline_code || "");
    return NextResponse.json(
      { error: mensajeDeError(stripeErr), reintentar: true },
      { status: 500 }
    );
  }
}

// Los utm_* y el dominio de procedencia que manda la página, recortados para Stripe (500 caracteres
// por valor como mucho). Nada más: ni el fbclid ni nada que ella no haya visto.
function utms(origen: unknown): Record<string, string> {
  const o = (origen && typeof origen === "object" ? origen : {}) as Record<string, unknown>;
  const fuera: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) fuera[k] = v.trim().slice(0, 100);
  }
  return fuera;
}

// La página en la que compró (/workshop o /comunidad), por la cabecera Referer. Sin ella, /comunidad.
function paginaDeCompra(referer: string | null): string {
  try {
    const u = new URL(referer || "");
    if (u.hostname.endsWith("ariannyrivasacademy.com")) return `${u.origin}${u.pathname}`;
  } catch {
    // sin Referer o mal formado
  }
  return "/comunidad";
}

const DESCRIPCION: Record<Fase, string> = {
  workshop: "Workshop «Posa para marcas» del 24-11 + Comunidad AR Academy · pago único",
  grabacion: "Grabación del workshop «Posa para marcas» + Comunidad AR Academy · pago único",
  comunidad: "Comunidad AR Academy · pago único",
};

// El enlace del grupo: WORKSHOP_WHATSAPP_URL en Vercel y, si no está, el metadato
// `grupo_whatsapp` del producto de la Comunidad en Stripe (puesto el 26-10, porque desde aquí no
// se llega a las variables de Vercel). Para cambiar el grupo basta con cambiar ese metadato.
async function grupoDelWorkshop(): Promise<string> {
  if (process.env.WORKSHOP_WHATSAPP_URL) return process.env.WORKSHOP_WHATSAPP_URL;
  try {
    const p = await stripe.products.retrieve(PRODUCTO_COMUNIDAD);
    return p.metadata?.grupo_whatsapp || "";
  } catch {
    return "";
  }
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
