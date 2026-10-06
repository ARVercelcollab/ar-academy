import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * El enlace de cada plan: /plan/{token}.
 *
 * El token es el id del contacto de GHL más una firma HMAC. Así:
 *   - la URL no lleva ningún dato personal (ni nombre, ni email, ni respuestas);
 *   - no hace falta guardar nada en GHL para encontrar el plan: el id va dentro;
 *   - nadie puede fabricar el plan de otra chica cambiando el id, porque la firma
 *     no cuadraría.
 *
 * La clave es PLAN_TOKEN_SECRET (variable de entorno de Vercel). Si se cambia, todos
 * los enlaces ya enviados dejan de funcionar: no se toca.
 */

const SEP = ".";

function clave(): string {
  const k = process.env.PLAN_TOKEN_SECRET;
  if (!k || k.length < 16) throw new Error("plan/token: falta PLAN_TOKEN_SECRET");
  return k;
}

function firma(contactId: string): string {
  return createHmac("sha256", clave()).update("plan:" + contactId).digest("base64url").slice(0, 22);
}

export function tokenDePlan(contactId: string): string {
  return contactId + SEP + firma(contactId);
}

/** Devuelve el id del contacto si el token es bueno; si no, null. */
export function contactoDeToken(token: string): string | null {
  const [id, f, ...resto] = String(token || "").split(SEP);
  if (resto.length || !id || !f || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  const buena = Buffer.from(firma(id));
  const dada = Buffer.from(f);
  if (buena.length !== dada.length || !timingSafeEqual(buena, dada)) return null;
  return id;
}

export const URL_BASE = "https://www.ariannyrivasacademy.com";

export function urlDePlan(contactId: string, cierre: "formacion" | "comunidad" = "formacion"): string {
  const t = tokenDePlan(contactId);
  return `${URL_BASE}/plan/${t}${cierre === "comunidad" ? "/comunidad" : ""}`;
}
