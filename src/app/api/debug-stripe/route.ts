import { NextResponse } from "next/server";

// TEMPORARY debug endpoint — REMOVE after verifying live/test mode
export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY || "";
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const webhook = process.env.STRIPE_WEBHOOK_SECRET || "";
  const priceId = process.env.STRIPE_PRICE_ID || "";

  return NextResponse.json({
    secretKeyMode: secret.startsWith("sk_live_")
      ? "LIVE"
      : secret.startsWith("sk_test_")
        ? "TEST"
        : "MISSING",
    secretKeyPrefix: secret.slice(0, 10),
    publishableKeyMode: publishable.startsWith("pk_live_")
      ? "LIVE"
      : publishable.startsWith("pk_test_")
        ? "TEST"
        : "MISSING",
    publishableKeyPrefix: publishable.slice(0, 10),
    webhookSecretPresent: webhook.startsWith("whsec_"),
    webhookSecretPrefix: webhook.slice(0, 10),
    priceIdPresent: priceId.startsWith("price_"),
    priceIdPrefix: priceId.slice(0, 12),
    deployedAt: new Date().toISOString(),
  });
}
