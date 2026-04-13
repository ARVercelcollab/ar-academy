import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone } = await req.json();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    try {
      await fetch(process.env.MAKE_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead_created",
          name,
          email,
          phone,
          emailTo: "ariannyrivasacademy@gmail.com",
          emailSubject: `nuevo lead COMUNIDAD: ${name}`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (webhookErr) {
      console.error("Make webhook failed:", webhookErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
