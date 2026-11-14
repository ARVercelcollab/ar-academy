import { NextResponse, type NextRequest } from "next/server";
import { precioComunidad, precioLlamada, DIRECTO, SUBIDA_WORKSHOP, SUBIDA_COMUNIDAD } from "@/lib/comunidad";
import { esCodigoLlamada } from "@/lib/llamada";

export const dynamic = "force-dynamic";

// Lo que vende /comunidad ahora mismo, para la página del workshop (public/workshop/index.html):
// es un HTML estático y no sabe la fecha del servidor. Con esto enseña el precio que se cobra.
// Con ?c= (el código del enlace de las setters, /workshop/llamada), el precio de la llamada.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  const llamada = c ? await esCodigoLlamada(c) : false;
  const { euros, fase } = llamada ? precioLlamada() : precioComunidad();
  return NextResponse.json(
    {
      fase,
      euros,
      // El precio de la web, para que la página de la llamada diga cuánto cuesta fuera de ella.
      web: precioComunidad().euros,
      llamada,
      directo: DIRECTO,
      subidaWorkshop: SUBIDA_WORKSHOP,
      subidaComunidad: SUBIDA_COMUNIDAD,
      // La clave PÚBLICA de Stripe (pk_…), la misma que usa el formulario de la Comunidad: el HTML
      // estático no puede leer las variables de Vercel. Es pública por diseño.
      pk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    },
    { headers: { "Cache-Control": c ? "private, no-store" : "public, max-age=60" } }
  );
}
