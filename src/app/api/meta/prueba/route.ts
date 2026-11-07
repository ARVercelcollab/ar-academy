import { NextResponse } from "next/server";

// Desactivada: la versión anterior mandaba una compra de 99 € con test_event_code, y Meta NO
// descarta esos eventos (los usa para medir y segmentar). La sustituye una prueba de conexión
// sin compra (auditoría del 7-11).
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: false, motivo: "desactivada" }, { status: 410 });
}
