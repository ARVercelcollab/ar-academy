import { NextResponse, type NextRequest } from "next/server";
import { SUBIDA_COMUNIDAD } from "@/lib/comunidad";

// Hasta el 30-11, /comunidad es la página del workshop del 24-11 (public/workshop/index.html), con la
// Comunidad para siempre (Carlos, 2026-10-24: «una página sola, ya que vamos a incluir en la oferta la
// comunidad»). /workshop es la misma página, para los emails y los anuncios. A /comunidad apuntan los
// planes de cada chica, las setters y Sofi, así que la dirección no cambia.
// Desde el 1-12 vuelve sola la página de la Comunidad (src/app/comunidad), a 199 €, y /workshop
// lleva allí. /bienvenida, adonde vuelven los enlaces de pago de Stripe, es en noviembre la página de
// gracias del workshop.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const noviembre = Date.now() < SUBIDA_COMUNIDAD;
  if (pathname === "/comunidad" || pathname === "/workshop") {
    if (noviembre) return NextResponse.rewrite(new URL("/workshop/index.html", req.url));
    if (pathname === "/workshop") {
      const url = req.nextUrl.clone(); // con sus utm
      url.pathname = "/comunidad";
      return NextResponse.redirect(url);
    }
  }
  if (pathname === "/bienvenida" && noviembre) {
    return NextResponse.rewrite(new URL("/workshop/gracias/index.html", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/comunidad", "/workshop", "/bienvenida"],
};
