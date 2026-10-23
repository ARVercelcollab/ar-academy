import { contactoDeToken } from "./token";
import { leerFicha } from "./ghl";
import { armarPlan } from "./contenido";
import { renderPlan, esc } from "./render";

/**
 * GET /plan/{token}            → el plan con el cierre de la formación (palabra ACCESO)
 * GET /plan/{token}/comunidad  → el mismo plan con el cierre de la Comunidad
 * ?previa=1                    → vista de la setter: no cuenta como abierto ni carga el píxel
 */
export async function servirPlan(req: Request, token: string, cierre: "formacion" | "comunidad") {
  const cabeceras = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
  };
  let id: string | null;
  try {
    id = contactoDeToken(token);
  } catch (e) {
    // Sin PLAN_TOKEN_SECRET en Vercel no se puede comprobar ningún enlace.
    console.error("plan/[token]: no se puede comprobar el enlace", String(e).slice(0, 200));
    return new Response(paginaNoEncontrada(true), { status: 503, headers: cabeceras });
  }
  if (!id) return new Response(paginaNoEncontrada(), { status: 404, headers: cabeceras });

  let ficha;
  try {
    ficha = await leerFicha(id);
  } catch (e) {
    console.error("plan/[token]: error leyendo GHL", String(e).slice(0, 200));
    return new Response(paginaNoEncontrada(true), { status: 503, headers: cabeceras });
  }
  if (!ficha) return new Response(paginaNoEncontrada(), { status: 404, headers: cabeceras });

  const previa = new URL(req.url).searchParams.get("previa") === "1";
  try {
    const html = renderPlan(armarPlan(ficha, token, { previa, cierre }));
    return new Response(html, { status: 200, headers: cabeceras });
  } catch (e) {
    // Un dato de la ficha que las tablas no esperan no puede dejarla ante una página rota.
    console.error("plan/[token]: error armando el plan", (e instanceof Error && e.stack ? e.stack : String(e)).slice(0, 800));
    return new Response(paginaNoEncontrada(true), { status: 500, headers: cabeceras });
  }
}

function paginaNoEncontrada(temporal = false) {
  const msg = temporal
    ? "Ahora mismo no puedo abrir tu plan. Prueba otra vez en un minuto."
    : "Este enlace no es válido. Escríbeme por WhatsApp y te mando el tuyo.";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Tu plan · AR Academy</title>
<style>body{margin:0;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;background:#fff;color:#161616;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center}a{display:inline-block;margin-top:18px;background:#25D366;color:#04240F;padding:14px 22px;text-decoration:none;text-transform:uppercase;font-size:14px}</style></head>
<body><div><p>${esc(msg)}</p><a href="https://wa.me/34722655343?text=${encodeURIComponent("Hola Arianny, quiero mi plan personalizado.")}">Escribir por WhatsApp</a></div></body></html>`;
}
