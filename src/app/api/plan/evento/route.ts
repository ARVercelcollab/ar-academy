import { NextResponse } from "next/server";
import { contactoDeToken } from "@/lib/plan/token";
import { sumarEtiquetas } from "@/lib/plan/ghl";

/**
 * Lo que hace ella dentro de su plan, como etiquetas en GHL (se suman, nunca se quitan):
 *   abierto    → `plan · abierto`        (lo abrió y estuvo al menos 2,5 s)
 *   clase      → `plan · vio clase`      (dio al play en alguna clase)
 *   acceso     → `plan · pulsó acceso`   (pulsó «Escribir ACCESO por WhatsApp»)
 *   comunidad  → `plan · pulsó comunidad`
 * Lo manda el navegador; los robots que abren el enlace para la vista previa de WhatsApp no
 * ejecutan JavaScript, así que no cuentan como abierto. La vista previa de la setter tampoco.
 */
// Un Map y no un objeto: con un objeto, `ev: "__proto__"` o `"toString"` devolvían algo
// (el prototipo, una función) y se mandaba a GHL como etiqueta (comprobado el 2026-10-07).
const ETIQUETA = new Map<string, string>([
  ["abierto", "plan · abierto"],
  ["clase", "plan · vio clase"],
  ["acceso", "plan · pulsó acceso"],
  ["comunidad", "plan · pulsó comunidad"],
]);

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!b || typeof b !== "object") return NextResponse.json({ ok: false }, { status: 400 });
  let id: string | null;
  try {
    id = contactoDeToken(String(b.t ?? ""));
  } catch (e) {
    console.error("plan/evento: no se puede comprobar el enlace", String(e).slice(0, 200));
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const tag = ETIQUETA.get(String(b.ev ?? ""));
  if (!id || !tag) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const r = await sumarEtiquetas(id, [tag]);
    if (!r.ok) console.error("plan/evento: etiqueta falló", r.status);
  } catch (e) {
    console.error("plan/evento", String(e).slice(0, 200));
  }
  return NextResponse.json({ ok: true });
}
