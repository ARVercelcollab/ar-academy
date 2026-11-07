import { NextResponse } from "next/server";
import { compraEnMeta, datosNavegador, metaConfigurada } from "@/lib/meta";

/**
 * Una compra DE PRUEBA a Meta, para comprobar la Conversions API sin pagar.
 *
 *   /api/meta/prueba?codigo=TEST12345
 *
 * El código es el de Events Manager → el píxel → «Probar eventos». Meta enseña la compra en esa
 * pestaña y NO la cuenta en los anuncios ni en los informes. Sin un código TEST… no se manda nada:
 * desde aquí es imposible mandar una compra de verdad.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const codigo = new URL(req.url).searchParams.get("codigo") || "";
  if (!/^TEST[A-Za-z0-9]{1,30}$/.test(codigo)) {
    return NextResponse.json({ ok: false, motivo: "falta ?codigo=TEST… (el de «Probar eventos»)" }, { status: 400 });
  }
  if (!metaConfigurada()) {
    return NextResponse.json({ ok: false, motivo: "falta META_CAPI_TOKEN o META_PIXEL_ID en Vercel" }, { status: 503 });
  }
  const id = `prueba_${Date.now()}`;
  const ok = await compraEnMeta(
    {
      facturaId: id,
      euros: 99,
      contenido: "Workshop 24-11",
      email: "prueba@ariannyrivasacademy.com",
      telefono: "+34600000000",
      nombre: "Prueba Conversions",
      clienteId: id,
      navegador: datosNavegador(req),
      pagina: "/workshop",
    },
    codigo,
  );
  return NextResponse.json({ ok, evento: id }, { status: ok ? 200 : 502 });
}
