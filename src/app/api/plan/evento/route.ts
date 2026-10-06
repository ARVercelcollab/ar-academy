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
const ETIQUETA: Record<string, string> = {
  abierto: "plan · abierto",
  clase: "plan · vio clase",
  acceso: "plan · pulsó acceso",
  comunidad: "plan · pulsó comunidad",
};

export async function POST(req: Request) {
  let b: Record<string, unknown> = {};
  try {
    b = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = contactoDeToken(String(b.t || ""));
  const tag = ETIQUETA[String(b.ev || "")];
  if (!id || !tag) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const r = await sumarEtiquetas(id, [tag]);
    if (!r.ok) console.error("plan/evento: etiqueta falló", r.status);
  } catch (e) {
    console.error("plan/evento", e);
  }
  return NextResponse.json({ ok: true });
}
