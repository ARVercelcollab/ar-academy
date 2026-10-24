import { NextRequest, NextResponse } from "next/server";
import { stripe, PRECIO_COMUNIDAD, PRECIO_COMUNIDAD_DICIEMBRE, PAGO_COMUNIDAD } from "@/lib/stripe";
import { SUBIDA_COMUNIDAD, MARGEN_COBRO_MS } from "@/lib/comunidad";

// La Comunidad en un solo pago (Carlos: 99 € hasta Black Friday, 199 € desde el 1-12). Antes era una suscripción
// de 27 €/mes; la ruta conserva el nombre porque es la que llama el formulario.
// Se cobra con una factura, no con un pago suelto, para que el aviso a Make (el correo con el
// acceso a Skool) siga saliendo de /api/stripe-webhook con invoice.payment_succeeded, y Stripe
// lo reintente si Make cae.
export async function POST(req: NextRequest) {
  let facturaId: string | null = null;
  try {
    const { name, email, phone, paymentMethodId } = await req.json();

    if (!name || !email || !phone || !paymentMethodId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const customer = await stripe.customers.create({
      name,
      email,
      phone,
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
      description: "Comunidad AR Academy · pago único",
      metadata: { producto: PAGO_COMUNIDAD },
    });
    facturaId = factura.id;

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: factura.id,
      // 99 € hasta el 30-11 (con media hora de margen) y 199 € desde el 1-12.
      pricing: {
        price:
          Date.now() < SUBIDA_COMUNIDAD + MARGEN_COBRO_MS
            ? PRECIO_COMUNIDAD
            : PRECIO_COMUNIDAD_DICIEMBRE,
      },
    });
    await stripe.invoices.finalizeInvoice(factura.id);
    const pagada = await stripe.invoices.pay(factura.id, {
      payment_method: paymentMethodId,
    });

    if (pagada.status === "paid") {
      return NextResponse.json({
        success: true,
        invoiceId: pagada.id,
        customerId: customer.id,
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
    const stripeErr = err as { message?: string };
    return NextResponse.json(
      { error: stripeErr.message || "Error desconocido" },
      { status: 500 }
    );
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
