import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// La Comunidad, en un solo pago: el producto «Comunidad AR Academy» (prod_VUhH56N09ViI78).
// Carlos, 2026-10-24: 99 € hasta Black Friday (30-11) y 199 € desde el 1-12. El cambio es solo:
// /api/create-subscription elige el precio por la fecha (src/lib/comunidad.ts). Hasta el 23-10 era
// una suscripción de 27 €/mes (STRIPE_PRICE_ID, que sigue en Vercel para las que quedan vivas).
export const PRECIO_COMUNIDAD = "price_1UThsmCi8AFxi9rHj9svFdb2"; // 99 €
export const PRECIO_COMUNIDAD_DICIEMBRE = "price_1UU1auCi8AFxi9rHLIA0TZxr"; // 199 €
// El workshop del 24-11 (Carlos, 2026-10-24): 99 € hasta el 16-11 y 149 € del 17 al 30-11, con la
// Comunidad para siempre. El de 149 € no es un precio creado en Stripe: va en la factura sobre el
// mismo producto (price_data), así que no hay nada que crear ni que borrar después.
export const PRODUCTO_COMUNIDAD = "prod_VUhH56N09ViI78";
// La marca que llevan las facturas del pago único, tanto las del formulario de la web como las
// del enlace de pago (plink_1UThsuCi8AFxi9rHPbK1fegY): es la que mira /api/stripe-webhook.
export const PAGO_COMUNIDAD = "comunidad_pago_unico";
