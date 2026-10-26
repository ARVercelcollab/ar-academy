import { NextResponse } from "next/server";
import { precioComunidad, DIRECTO, SUBIDA_WORKSHOP, SUBIDA_COMUNIDAD } from "@/lib/comunidad";

export const dynamic = "force-dynamic";

// Lo que vende /comunidad ahora mismo, para la página del workshop (public/workshop/index.html):
// es un HTML estático y no sabe la fecha del servidor. Con esto enseña el precio que se cobra.
export function GET() {
  const { euros, fase } = precioComunidad();
  return NextResponse.json(
    {
      fase,
      euros,
      directo: DIRECTO,
      subidaWorkshop: SUBIDA_WORKSHOP,
      subidaComunidad: SUBIDA_COMUNIDAD,
      // La clave PÚBLICA de Stripe (pk_…), la misma que usa el formulario de la Comunidad: el HTML
      // estático no puede leer las variables de Vercel. Es pública por diseño.
      pk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
