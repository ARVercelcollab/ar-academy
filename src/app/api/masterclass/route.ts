import { NextResponse } from "next/server";

/**
 * Registro de la masterclass.
 *
 * POR QUÉ ESTE ENDPOINT Y NO UN FORMULARIO DE GHL: GHL empareja contactos por email y
 * teléfono. La chica que lleva semanas hablando con el setter por Instagram no tiene ninguno
 * de los dos en su ficha, así que un formulario nativo le crea un contacto NUEVO y acabamos
 * con dos fichas de la misma persona: una con el historial y otra con el teléfono.
 *
 * Por eso el formulario pide `@Instagram` y esto reenvía al backend del setter, que busca por
 * handle, fusiona si existe y solo crea si no existe.
 *
 * Variables de entorno:
 *   MASTERCLASS_WEBHOOK_URL    → https://<backend>/masterclass
 *   MASTERCLASS_WEBHOOK_SECRET → el WEBHOOK_SECRET del backend. Viaja en la cabecera
 *                                `X-Setter-Secret`, que es la que el backend valida
 *                                (setter/app.py, do_POST). Un `Authorization: Bearer`
 *                                aquí devuelve 401.
 */
export async function POST(req: Request) {
  let datos: Record<string, unknown>;

  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición mal formada" }, { status: 400 });
  }

  const { name, email, phone, instagram, edicion } = datos as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !instagram?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const destino = process.env.MASTERCLASS_WEBHOOK_URL;

  // Sin webhook configurado no se pierde el registro: queda en los logs de Vercel y se
  // recupera a mano. Preferimos eso a devolverle un error a alguien que ya rellenó todo.
  if (!destino) {
    console.warn("[masterclass] MASTERCLASS_WEBHOOK_URL sin configurar. Registro:", {
      name, email, phone, instagram, edicion,
    });
    return NextResponse.json({ ok: true, entregado: false });
  }

  try {
    const res = await fetch(destino, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MASTERCLASS_WEBHOOK_SECRET
          ? { "X-Setter-Secret": process.env.MASTERCLASS_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ name, email, phone, instagram, edicion }),
    });

    if (!res.ok) {
      console.error("[masterclass] el webhook respondió", res.status, {
        name, email, phone, instagram, edicion,
      });
      // Se le da por buena igualmente: el dato queda en el log y ella ya hizo su parte.
      return NextResponse.json({ ok: true, entregado: false });
    }

    return NextResponse.json({ ok: true, entregado: true });
  } catch (e) {
    console.error("[masterclass] no se pudo llamar al webhook", e, {
      name, email, phone, instagram, edicion,
    });
    return NextResponse.json({ ok: true, entregado: false });
  }
}
