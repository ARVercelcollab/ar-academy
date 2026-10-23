import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// La Comunidad, en un solo pago de 99 € (Carlos, 2026-10-23): el producto «Comunidad AR Academy»
// (prod_VUhH56N09ViI78) y su precio. Hasta ese día era una suscripción de 27 €/mes
// (STRIPE_PRICE_ID, que sigue en Vercel para las suscripciones que quedan vivas).
export const PRECIO_COMUNIDAD = "price_1UThsmCi8AFxi9rHj9svFdb2";
// La marca que llevan las facturas del pago único, tanto las del formulario de la web como las
// del enlace de pago (plink_1UThsuCi8AFxi9rHPbK1fegY): es la que mira /api/stripe-webhook.
export const PAGO_COMUNIDAD = "comunidad_pago_unico";
