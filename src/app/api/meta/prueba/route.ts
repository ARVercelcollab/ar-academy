import { NextResponse } from "next/server";
import { metaConfigurada, pruebaDeConexion } from "@/lib/meta";

/**
 * Prueba de la Conversions API, sin pagar y sin tocar las compras:
 *
 *   curl -X POST "https://www.ariannyrivasacademy.com/api/meta/prueba?codigo=TEST12345"
 *
 * El código es el de Events Manager → el píxel → «Probar eventos». Manda un evento personalizado,
 * «PruebaConexionAR», que no es una compra, sin importe y sin datos de quien la lanza, y dice qué
 * contestó Meta. Solo POST: así no salta al pegar el enlace en un chat (la vista previa hace GET).
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const codigo = new URL(req.url).searchParams.get("codigo") || "";
  if (!/^TEST[A-Za-z0-9]{1,30}$/.test(codigo)) {
    return NextResponse.json({ ok: false, motivo: "falta ?codigo=TEST… (el de «Probar eventos»)" }, { status: 400 });
  }
  if (!metaConfigurada()) {
    return NextResponse.json({ ok: false, motivo: "falta META_CAPI_TOKEN o META_PIXEL_ID en Vercel" }, { status: 503 });
  }
  const r = await pruebaDeConexion(codigo);
  return NextResponse.json({ ok: r.ok, status: r.status, meta: r.ok ? "recibido" : r.texto }, { status: r.ok ? 200 : 502 });
}
