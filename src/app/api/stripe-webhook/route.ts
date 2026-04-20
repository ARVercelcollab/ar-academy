import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

      // Only fire on the first invoice of a new subscription, not renewals
      if (invoice.billing_reason !== "subscription_create") {
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
          event: "subscription_created",
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
