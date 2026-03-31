import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, paymentMethodId } = await req.json();

    if (!name || !email || !phone || !paymentMethodId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await stripe.customers.create({
      name,
      email,
      phone,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID! }],
      default_payment_method: paymentMethodId,
      collection_method: "charge_automatically",
      expand: ["latest_invoice"],
    });

    // Force pay the first invoice immediately
    const invoice = subscription.latest_invoice;
    if (invoice && typeof invoice !== "string") {
      if (invoice.status === "open" || invoice.status === "draft") {
        await stripe.invoices.pay(invoice.id, {
          payment_method: paymentMethodId,
        });
      }
    }

    // Verify final status
    const updatedSub = await stripe.subscriptions.retrieve(subscription.id);

    if (updatedSub.status === "active") {
      // Notify Make webhook — triggers Skool invite + confirmation email
      fetch(process.env.MAKE_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "subscription_created",
          name,
          email,
          phone,
          customerId: customer.id,
          subscriptionId: updatedSub.id,
          plan: "AR Academy",
          amount: 27,
          currency: "USD",
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        subscriptionId: updatedSub.id,
        customerId: customer.id,
      });
    }

    return NextResponse.json(
      { error: `El pago no se ha podido procesar (estado: ${updatedSub.status})` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const stripeErr = err as { message?: string };
    return NextResponse.json(
      { error: stripeErr.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
