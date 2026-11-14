import { timingSafeEqual } from "node:crypto";
import { stripe, PRODUCTO_COMUNIDAD } from "@/lib/stripe";

// El enlace de las setters (/workshop/llamada?c=…&s=…) lleva un código para que el precio de la
// llamada no lo saque cualquiera: el repo es público, así que el código no puede estar aquí. Se lee
// de CODIGO_LLAMADA en Vercel y, si no está, del metadato `codigo_llamada` del producto de la
// Comunidad en Stripe (como el grupo de WhatsApp). Para cambiarlo, basta con cambiar ese metadato:
// el enlace viejo deja de dar 99 € en cinco minutos como mucho.
let guardado: { codigo: string; hasta: number } | null = null;

async function codigoVigente(): Promise<string> {
  if (process.env.CODIGO_LLAMADA) return process.env.CODIGO_LLAMADA;
  if (guardado && guardado.hasta > Date.now()) return guardado.codigo;
  try {
    const p = await stripe.products.retrieve(PRODUCTO_COMUNIDAD);
    const codigo = p.metadata?.codigo_llamada || "";
    guardado = { codigo, hasta: Date.now() + 5 * 60 * 1000 };
    return codigo;
  } catch {
    return guardado?.codigo || "";
  }
}

export async function esCodigoLlamada(c: unknown): Promise<boolean> {
  if (typeof c !== "string" || !c || c.length > 64) return false;
  const bueno = await codigoVigente();
  if (!bueno) return false;
  const a = Buffer.from(c);
  const b = Buffer.from(bueno);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Quién la ofreció (danna, jessica…): va a la factura para contar las ventas del equipo.
export function nombreSetter(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
}
