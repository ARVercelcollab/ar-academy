import { NextRequest, NextResponse, after } from "next/server";
import { stripe, PAGO_COMUNIDAD, PRODUCTO_TPM_MENSUAL } from "@/lib/stripe";
import { GRUPO, altaEnMailerLite } from "@/lib/mailerlite";
import { compradoraEnGHL } from "@/lib/compradora";
import { OFERTA, esDelWorkshop, faseComunidad } from "@/lib/comunidad";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;

      // Se avisa a Make en el primer cobro de una suscripción (la Comunidad a 27 €/mes, hasta el
      // 23-10), nunca en las renovaciones, y en el pago único de la Comunidad (199 €, o 99 €): el del
      // formulario de la web y el del enlace de pago, que crea la factura con la misma marca.
      const pagoUnico = invoice.metadata?.producto === PAGO_COMUNIDAD;
      if (invoice.billing_reason !== "subscription_create" && !pagoUnico) {
        break;
      }

      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) break;

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) break;

      const invoiceAny = invoice as unknown as {
        subscription?: string | Stripe.Subscription | null;
        parent?: {
          subscription_details?: {
            subscription?: string | Stripe.Subscription | null;
          } | null;
        } | null;
      };
      const rawSub =
        invoiceAny.subscription ??
        invoiceAny.parent?.subscription_details?.subscription ??
        null;
      const subscriptionId =
        typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;

      const res = await fetch(process.env.MAKE_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // El escenario de Make espera este nombre: se mantiene también en el pago único.
          event: "subscription_created",
          pago: pagoUnico ? "unico" : "suscripcion",
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          customerId: customer.id,
          subscriptionId,
          plan: "AR Academy",
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          stripeEventId: event.id,
          invoiceId: invoice.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        // Return 500 so Stripe retries automatically
        return NextResponse.json(
          { error: `Make webhook returned ${res.status}` },
          { status: 500 }
        );
      }

      // ¿Es la mensualidad de The Perfect Model (47 €/mes)? La pagan las alumnas que terminan la
      // formación: ni es la Comunidad ni trae el workshop.
      const tpm =
        !pagoUnico &&
        invoice.lines.data.some((l) => {
          const linea = l as unknown as {
            pricing?: { price_details?: { product?: string } | null } | null;
          };
          return linea.pricing?.price_details?.product === PRODUCTO_TPM_MENSUAL;
        });

      // ¿Incluye el workshop del 24-11? Solo el pago único de la Comunidad: lo dice la factura
      // del formulario de /comunidad; la de los enlaces de pago no lo lleva y se mira la fecha del
      // pago: en noviembre, toda compra de la Comunidad trae el workshop (Carlos, 2026-10-24).
      // Una suscripción nunca: el 29-10 una alumna de TPM pagó su mensualidad y entró en el
      // pipeline «Workshop» (Carlos, 2026-10-30).
      const pagadaEn = (invoice.status_transitions?.paid_at ?? event.created) * 1000;
      const oferta = invoice.metadata?.oferta || OFERTA[faseComunidad(pagadaEn)];
      const workshop = pagoUnico && esDelWorkshop(oferta);
      const anios = Number.parseInt(String(customer.metadata?.edad ?? ""), 10);
      const edad = Number.isFinite(anios) ? anios : null;
      const instagram = String(customer.metadata?.instagram ?? "");

      // En MailerLite pasa a «Alumnas Comunidad»: los segmentos de venta excluyen a las
      // alumnas, así que deja de recibir ofertas de la Comunidad. Si trae el workshop, entra
      // también en su grupo: el que arranca la bienvenida con el grupo de WhatsApp y los avisos
      // del directo. Y en GHL, con su etiqueta, para que las setters la vean. Todo después de
      // responder a Stripe: si MailerLite o GHL fallan, el pago y el acceso no se enteran.
      // La de TPM va solo a «Alumnas TPM» (entrar en «Alumnas Comunidad» le mandaría la
      // bienvenida del workshop) y no va a GHL: no hay nada que venderle.
      const { email: emailCliente, name: nombreCliente, phone: telCliente } = customer;
      if (emailCliente) {
        after(() =>
          altaEnMailerLite(
            tpm
              ? {
                  email: emailCliente,
                  grupo: GRUPO.alumnasTPM,
                  nombre: nombreCliente ?? "",
                  etapa: "tpm",
                  edad,
                  consentimiento: "compra mensualidad tpm",
                }
              : {
                  email: emailCliente,
                  grupo: workshop ? [GRUPO.alumnasComunidad, GRUPO.workshop] : GRUPO.alumnasComunidad,
                  nombre: nombreCliente ?? "",
                  origen: workshop ? "workshop" : undefined,
                  etapa: "comunidad",
                  edad,
                  consentimiento: workshop ? "compra workshop" : "compra comunidad",
                }
          )
        );
      }
      if (!tpm) {
        after(() =>
          compradoraEnGHL({
            nombre: nombreCliente ?? "",
            email: emailCliente ?? "",
            telefono: telCliente ?? "",
            edad,
            instagram,
            euros: invoice.amount_paid / 100,
            workshop,
            descripcion: invoice.description || "Comunidad AR Academy",
          })
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(`Subscription cancelled: ${subscription.id}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
