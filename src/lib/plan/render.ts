import { CSS_PLAN } from "./plantilla-css";
import type { PlanArmado } from "./contenido";
import { precioComunidad } from "@/lib/comunidad";

/**
 * El HTML del plan de cada chica. Es la plantilla de /plan/ejemplo con los huecos
 * rellenos: mismo diseño, mismas animaciones, mismo consentimiento y píxel.
 * Todo lo que viene de GHL pasa por `esc` antes de entrar en la página.
 */

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

// Los textos de las tablas son nuestros (no vienen de la chica) y llevan <b> y la cursiva
// en vino con [[...]]. Se escapan igual y luego se reponen solo esas dos marcas.
function rico(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\[\[(.+?)\]\]/g, '<span class="it">$1</span>');
}

function titulo(t: [string, string]): string {
  return `${esc(t[0])} <span class="it">${esc(t[1])}</span>`;
}

// Segundo en el que arranca un vídeo (para el ?start= del reproductor). 0 = desde el principio.
function seg(s: unknown): number {
  const n = Math.floor(Number(s));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function mayuscula(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Estilos que la plantilla de /plan/ejemplo no trae: la hoja de ruta contada por Ari y el cierre.
const CSS_EXTRA = `<style>
/* La hoja de ruta contada por Ari (bloque 05) */
.rv{margin:26px 0 0;border:1px solid var(--line)}
/* el play abajo, en la mesa de la miniatura, para que no tape el mapa */
.rv .clf{place-items:end center;padding-bottom:12px}
.rv .clf .play{width:64px;height:64px}
.rv .clf .play::before{border-left-width:17px;border-top-width:10px;border-bottom-width:10px;margin-left:5px}
@media (max-width:430px){.rv .clf{padding-bottom:8px}.rv .clf .play{width:48px;height:48px}.rv .clf .play::before{border-left-width:13px;border-top-width:7.5px;border-bottom-width:7.5px;margin-left:4px}}
.rvt{padding:15px 16px}
.rvt small{display:block;font-size:9.5px;letter-spacing:.14em;color:var(--vino);font-weight:500;margin-bottom:6px;text-transform:uppercase}
.rvt h3{margin:0;font-size:15px;font-weight:400;line-height:1.3;letter-spacing:-.01em}
.caps{margin:20px 0 30px}
.caps small{display:block;font-size:10.5px;letter-spacing:.16em;color:var(--tx-3);font-weight:500;margin-bottom:8px;text-transform:uppercase}
.caps ol{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.cap{all:unset;box-sizing:border-box;display:flex;gap:14px;align-items:baseline;width:100%;padding:12px 2px;border-bottom:1px solid var(--line);cursor:pointer;font-family:var(--sans);color:var(--tx-2);font-size:15px;font-weight:300;line-height:1.35;transition:color .2s}
.cap:hover,.cap.on{color:var(--tx)}
.cap:focus-visible{outline:2px solid var(--vino);outline-offset:2px}
.capt{flex:none;width:44px;font-variant-numeric:tabular-nums;color:var(--vino);font-weight:500;font-size:13px}
.capn em{font-style:normal;display:inline-block;margin:4px 0 0 8px;font-size:9.5px;letter-spacing:.14em;color:var(--vino);border:1px dashed var(--vino);padding:3px 7px;font-weight:500;text-transform:uppercase;vertical-align:1px}
.rcta{margin-top:30px}
/* Los próximos pasos de la Comunidad (cierre nuevo) */
.nxl{display:block;margin:30px 0 4px;font-size:10.5px;letter-spacing:.16em;color:var(--tx-3);font-weight:500;text-transform:uppercase}
.nx{margin-bottom:8px}
/* El mensaje de WhatsApp ya escrito (cierre nuevo): la frase grande y, debajo, el resto */
.wa p.wa2{margin-top:10px;font-size:16px;line-height:1.45;letter-spacing:0;font-weight:400;font-style:italic;color:var(--tx) !important}
</style>`;

export function renderPlan(p: PlanArmado): string {
  const chips = p.chips
    .map((c, k) => `<span class="chip" style="animation-delay:${(0.15 + k * 0.1).toFixed(2)}s">${esc(c)}</span>`)
    .join("\n      ");

  const pasos = p.pasos
    .map(
      (s, k) =>
        `<div class="step"><span class="n">${k + 1}</span><div><h3>${esc(s.t)}</h3><p>${rico(s.p)}</p></div></div>`,
    )
    .join("\n      ");

  const clases = p.clases
    .map(
      (c, k) => `<article class="cl" data-cl="${k}" data-yt="${esc(c.yt)}" data-start="${seg(c.start)}">
        <div class="clf"><img src="https://i.ytimg.com/vi/${esc(c.yt)}/maxresdefault.jpg" alt="" loading="lazy" onload="if(this.naturalWidth<200)this.onerror()" onerror="this.onerror=this.onload=null;this.src=this.src.replace('maxresdefault','sddefault')"><div class="play"></div></div>
        <div class="clb"><span class="tag2">Clase ${k + 1}</span><h3>${esc(c.titulo)}</h3><button class="vw" aria-label="Marcar como vista">✓</button></div>
        <p class="clwhy"><b>${esc(c.porQueTitulo)}</b> ${esc(c.porQue)}</p>
      </article>`,
    )
    .join("\n      ");

  const ruta = p.ruta
    .map((st) => {
      const cls = ["st", st.empieza ? "" : "", st.entraTodoElMundo ? "you" : "", st.final ? "final" : ""]
        .filter(Boolean)
        .join(" ");
      const tags =
        (st.empieza ? `<span class="starttag">Por aquí empieza tu plan</span>` : "") +
        (st.entraTodoElMundo ? `<span class="youtag">Por aquí entra casi todo el mundo</span>` : "") +
        (st.final ? `<span class="starttag">La salida</span>` : "");
      const chipsClase = st.clases
        .map((c) =>
          c.ancla
            ? `<a class="cchip" href="#clases">${esc(c.texto)}</a>`
            : `<button class="cchip" data-yt="${esc(c.yt)}" data-start="${seg(c.start)}" data-t="${esc(c.texto)}">${esc(c.texto)}</button>`,
        )
        .join("");
      const conPlayer = st.clases.some((c) => !c.ancla);
      return `<div class="${cls}" data-big="${st.n}"><span class="stn">${st.n}</span>
        ${tags}
        <h3>${esc(st.nombre)}</h3>
        <p class="stwhy">${rico(st.porQue)}</p>
        <div class="strow"><span class="mchip">${rico(st.mentora)}</span>${chipsClase}</div>${conPlayer ? '\n        <div class="stplayer"><div class="clf"></div></div>' : ""}
      </div>`;
    })
    .join("\n      ");

  const caso = p.caso
    ? `<section class="top-line">
  <div class="wrap">
    <span class="lab">06 · Una chica que empezó donde tú</span>
    <h2>${titulo(p.caso.titulo)}</h2>
    <div class="caso">
      ${p.caso.foto ? `<img src="${esc(p.caso.foto)}" alt="${esc(p.caso.nombre)}" loading="lazy">` : ""}
      <div>
        <small>${esc(p.caso.nombre)} · ${esc(p.caso.dato)}</small>
        <h3>${esc(p.caso.logro)}</h3>
        <p>${rico(p.caso.historia)}</p>
        ${p.caso.cita ? `<q>«${esc(p.caso.cita)}»</q>` : ""}
      </div>
    </div>
  </div>
</section>`
    : "";

  const n = p.caso ? 7 : 6;
  const pad = (x: number) => (x < 10 ? "0" + x : String(x));

  // La hoja de ruta contada por Ari: va antes de la ruta por escrito, con sus capítulos. El tramo
  // en el que empieza su plan lleva la misma marca que el paso en la ruta.
  const vr = p.videoRuta;
  const mmssR = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const tramoSuyo = vr.capitulos.find((c) => c.pasos && p.pasoInicio >= c.pasos[0] && p.pasoInicio <= c.pasos[1]);
  const introRuta = `<p>Con ella, Irene ha desfilado en la Paris Fashion Week, Andrea va a trabajar con Mercedes-Benz y con Mattel, Mar ha salido en Vogue e Iliana tiene hoy su propia academia de modelos en México. <b>Antes de que la leas, quiero contártela yo.</b></p>
    <div class="rv" id="rv">
      <div class="clf" data-yt="${esc(vr.yt)}"><img src="https://i.ytimg.com/vi/${esc(vr.yt)}/maxresdefault.jpg" alt="" loading="lazy" onload="if(this.naturalWidth<200)this.onerror()" onerror="this.onerror=this.onload=null;this.src=this.src.replace('maxresdefault','sddefault')"><div class="play"></div></div>
      <div class="rvt"><small>La hoja de ruta · contada por mí</small><h3>${esc(vr.titulo)}</h3></div>
    </div>
    <div class="caps">
      <small>Lo que vas a ver</small>
      <ol>
        ${vr.capitulos
          .map(
            (c) =>
              `<li><button class="cap" data-start="${seg(c.s)}"><span class="capt">${mmssR(seg(c.s))}</span><span class="capn">${esc(c.t)}${c === tramoSuyo ? "<em>Por aquí empieza tu plan</em>" : ""}</span></button></li>`,
          )
          .join("\n        ")}
      </ol>
    </div>
    <p>Y aquí abajo la tienes por escrito, paso a paso. En cada paso te dejo quién lo imparte y, donde la hay, <b>una clase abierta</b>: para que veas un poco de lo que hay dentro de la academia y de lo que trabajamos con nuestras alumnas.</p>`;
  // Al final de la ruta, las ganas de hacerla acompañada: lleva a su siguiente paso (#acceso).
  const ctaRuta = `
    <div class="rcta">
      <p>Este orden lo puedes seguir sola. Lo que cambia cuando lo haces acompañada es que no vas a ciegas: alguien revisa lo que haces y te dice qué está bien, qué no y por dónde seguir.</p>
      <div class="cta-wrap"><a class="pillbtn big full solid" href="#acceso">Quiero hacer este camino acompañada</a></div>
    </div>`;

  // Los cierres (Carlos, 23-10): «si estás lista», sin mandarla fuera del plan (ni canal ni
  // Instagram), y directa a su paso: el mensaje «¡QUIERO ACCEDER!» por WhatsApp, o el formulario
  // de pago de la Comunidad (/comunidad#registro lo abre solo).
  // El mensaje que le dejamos escrito para Ari (Carlos, 23-10). Empieza por «¡QUIERO ACCEDER!»
  // para que la setter lo reconozca al momento.
  const WA_FRASE = "¡QUIERO ACCEDER!";
  const WA_RESTO =
    "Arianny, ya vi mi plan y la hoja de ruta, y estoy comprometida y lista para trabajar de la mano contigo y con tu equipo. ¿Hay una plaza disponible para mí este mes?";
  const sentido = `<p>Si has visto todo esto y te hace sentido, ya sabes cómo trabajamos. Con esta hoja de ruta preparamos a cada alumna en todas sus facetas para que sea una profesional excelente, no solo como modelo o creadora, sino en todas las áreas de su vida.`;
  // Comunidad: qué pasa cuando entra (Carlos, 23-10: la llamada de onboarding y los próximos
  // pasos). Tras pagar, la web le dice que revise el correo para entrar (Skool); la llamada de
  // bienvenida la agenda el equipo por WhatsApp (negocio.md §2; con la menor, con sus padres).
  // En noviembre la Comunidad se vende con el workshop «Posa para marcas» del 24-11, sin llamada de
  // bienvenida y con el grupo de WhatsApp (Carlos, 24-10); el botón lleva a la página del workshop,
  // que es /comunidad. A la menor se le mantiene la llamada con sus padres (hasta que Carlos diga).
  // Desde el 1-12, el cierre de siempre. Lo decide la fecha (src/lib/comunidad.ts).
  const { euros, fase } = precioComunidad();
  const conWorkshop = fase !== "comunidad";
  const pasosWorkshop: [string, string][] = [
    ["Rellenas tus datos y haces el pago", p.menor ? "Desde el botón de abajo, con tus padres al lado." : "Desde el botón de abajo. Te lleva directa."],
    ["Entras en el grupo de WhatsApp del workshop", "Te lo damos al momento. Ahí estamos todas y te aviso de todo."],
    ["Te llega un correo con tu acceso", "Con él entras a la Comunidad, donde están todas mis alumnas y las mentoras."],
    ...(p.menor
      ? ([["Hablamos con tus padres", "Te escribimos por WhatsApp para una llamada corta con una persona de mi equipo y con tus padres: les explicamos cómo funciona todo."]] as [string, string][])
      : []),
    fase === "workshop"
      ? ["Nos vemos el martes 24 a las 20:00", "En directo, y si no puedes, queda grabado. Dentro, empiezas por la mentalidad: el paso 1 de tu hoja de ruta."]
      : ["Ves la grabación del workshop", "Cuando quieras, las veces que quieras. Y dentro, empiezas por la mentalidad: el paso 1 de tu hoja de ruta."],
  ];
  const pasosCom: [string, string][] = conWorkshop ? pasosWorkshop : [
    ["Rellenas tus datos y haces el pago", p.menor ? "Desde el botón de abajo, con tus padres al lado." : "Desde el botón de abajo. Te lleva directa."],
    ["Te llega un correo con tu acceso", "Con él entras a la Comunidad, donde están todas mis alumnas."],
    [
      "Agendamos tu llamada de bienvenida",
      p.menor
        ? "Te escribimos por WhatsApp para buscar el día. Es con una persona de mi equipo y con tus padres: les explicamos cómo funciona todo y por dónde vas a empezar."
        : "Te escribimos por WhatsApp para buscar el día. Una persona de mi equipo te enseña exactamente cómo funciona la Comunidad y por dónde empezar con tu plan.",
    ],
    ["Empiezas por la mentalidad", "Es el paso 1 de la hoja de ruta y el primer módulo que te espera dentro. A tu ritmo."],
  ];
  // Lo que tiene en la Comunidad, con la llamada de bienvenida como un «además». A la menor se le
  // pide que lo hable con sus padres; que estén en la llamada lo dice el paso 3.
  const precioWorkshop =
    euros === 99
      ? `<b>Ahora mismo, 99 €</b>, un solo pago. El 17 de noviembre sube a 149 €.`
      : fase === "workshop"
        ? `<b>Ahora mismo, 149 €</b>, un solo pago, hasta el directo del martes 24.`
        : `La grabación del workshop y la Comunidad: <b>149 €</b>, un solo pago, hasta el 30 de noviembre.`;
  const comunidadWorkshop = `<p>Este mes, la puerta de entrada es mi workshop <b>«Posa para marcas»</b>: ${
    fase === "workshop" ? "el martes 24 de noviembre te enseño en directo" : "en la grabación del directo del 24 de noviembre te enseño"
  } a posar para que las marcas te contraten como modelo. Posar con ropa y con producto, la cara y las manos en una campaña, y un casting en directo con qué fotos mandarle a una marca.</p>
    <p>Y con tu entrada te quedas en la <b>Comunidad de AR Academy para siempre</b>: todas mis alumnas y las mentoras, los eventos, los directos conmigo, el acceso a AR Xperience París 2027 (el viaje y la experiencia se pagan aparte) y el grupo de WhatsApp del workshop.</p>
    <p>${precioWorkshop}</p>${
    p.menor
      ? `
    <p><b>Antes de entrar, háblalo con tus padres.</b> Enséñales este plan y la clase 4, que es para ellos.</p>`
      : ""
  }`;
  const comunidadNuevo = conWorkshop ? comunidadWorkshop : `<p>En la <b>Comunidad de AR Academy</b> tienes el entorno correcto${p.menor ? " para empezar" : ""}: estás con todas mis alumnas, tienes acceso a todos los eventos y a los directos conmigo, y las bases para empezar a ${p.menor ? "trabajar con tu imagen, a tu ritmo y sin prisa" : "generar ingresos con tu imagen"}. <b>Y además, una llamada de bienvenida</b> con una persona de mi equipo, para que conozcas exactamente cómo funciona la Comunidad y cuáles son tus próximos pasos.</p>${
    p.menor
      ? `
    <p><b>Antes de entrar, háblalo con tus padres.</b> Enséñales este plan y la clase 4, que es para ellos.</p>`
      : ""
  }`;
  const proximosCom = `
    <small class="nxl">Así entras</small>
    <div class="steps nx">
      ${pasosCom.map(([t, x], k) => `<div class="step"><span class="n">${k + 1}</span><div><h3>${esc(t)}</h3><p>${esc(x)}</p></div></div>`).join("\n      ")}
    </div>`;
  const cierre =
    p.cierre === "comunidad"
      ? `<section class="top-line" id="acceso">
  <div class="wrap">
    <span class="lab">${pad(n + 1)} · Tu siguiente paso</span>
    <h2>Si estás lista, <span class="it">empieza acompañada.</span></h2>
    ${sentido}</p>
    ${comunidadNuevo}${proximosCom}
    <div class="cta-wrap">
      <a class="pillbtn big full solid" id="combtn" href="${esc(p.urlComunidad)}#registro" target="_blank" rel="noopener">${conWorkshop ? "Quiero entrar en el workshop y en la Comunidad" : "Quiero acceder a la Comunidad de AR Academy"}</a>
    </div>
  </div>
</section>`
      : `<section class="top-line" id="acceso">
  <div class="wrap">
    <span class="lab">${pad(n + 1)} · Tu siguiente paso</span>
    <h2>Si estás lista, <span class="it">da el paso.</span></h2>
    ${sentido} Y le abrimos un abanico de oportunidades en marcas, castings, pasarelas y contenido.</p>
    <p>Si tienes claro que quieres trabajar con nosotros: cada mes abrimos <b>un número limitado de plazas</b> en <b>The Perfect Model</b>, nuestro programa más avanzado, para trabajar conmigo y con mi equipo, acompañada de principio a fin. No trabajamos con todo el mundo, solo con chicas comprometidas y decididas.</p>
    <div class="wa">
      <small>Si estás lista para empezar, envíame este mensaje por WhatsApp</small>
      <p><span id="wamsg" data-w="${esc(WA_FRASE)}"></span><span class="caret"></span></p>
      <p class="wa2">${esc(WA_RESTO)}</p>
    </div>
    <div class="cta-wrap">
      <a class="pillbtn big full btnwa" id="wabtn" href="https://wa.me/34722655343?text=${encodeURIComponent(WA_FRASE + " " + WA_RESTO)}" target="_blank" rel="noopener">Enviar mi mensaje por WhatsApp</a>
    </div>
  </div>
</section>`;

  const datosJS = JSON.stringify({
    t: p.token,
    nombre: p.nombre,
    previa: p.previa,
    cierre: p.cierre,
    nclases: p.clases.length,
  }).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.nombre ? `El plan de ${esc(p.nombre)}` : "Tu plan"} · AR Academy</title>
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#831A36">
<meta property="og:title" content="Tu plan personalizado · AR Academy">
<meta property="og:description" content="Preparado con lo que me contaste. Léelo con calma.">
<meta property="og:image" content="https://www.ariannyrivasacademy.com/plan/og-plan.jpg">
<link rel="icon" href="/plan/icono-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/plan/icono-180.png">
<link rel="stylesheet" href="https://use.typekit.net/cbv1cvv.css">
${CSS_PLAN}
${CSS_EXTRA}
</head>
<body>
<div class="rp"><i id="rp"></i></div>
<div class="tickbar"><div class="tickrow" id="tick"></div></div>
<header>
  <div class="halo"></div>
  <div class="wrap">
    <span class="lab">Tu plan · preparado para ti · léelo con calma</span>
    <h1 id="h1">${p.nombre ? esc(p.nombre) + ", " + esc(p.h1[0]) : esc(mayuscula(p.h1[0]))} <span class="it">${esc(p.h1[1])}</span></h1>
    <div class="chips">
      ${chips}
    </div>${
      p.cita
        ? `
    <div class="said">
      <small>Esto me lo contaste tú</small>
      <p>«${esc(p.cita)}»</p>
      <p class="saidr">${rico(p.citaRespuesta)}</p>
    </div>`
        : ""
    }
  </div>
</header>
<section class="top-line">
  <div class="wrap">
    <span class="lab">01 · Dónde estás</span>
    <h2>${titulo(p.donde.titulo)}</h2>
    ${p.donde.parrafos.map((x) => `<p>${rico(x)}</p>`).join("\n    ")}
    <div class="mini" id="mini" aria-label="Los 10 pasos del camino"></div>
    <div class="minicap"><span><b>Paso ${p.pasoInicio}</b> · por aquí empieza tu plan</span><span><b>Paso 7</b> · por aquí entra casi todo el mundo</span></div>
  </div>
</section>
<section class="top-line">
  <div class="wrap">
    <span class="lab">02 · A dónde vas</span>
    <h2>${titulo(p.adonde.titulo)}</h2>
    ${p.adonde.parrafos.map((x) => `<p>${rico(x)}</p>`).join("\n    ")}
  </div>
</section>
<section class="top-line">
  <div class="wrap">
    <span class="lab">03 · Tus tres siguientes pasos</span>
    <h2>Esta semana, <span class="it">solo esto.</span></h2>
    <div class="steps">
      ${pasos}
    </div>
  </div>
</section>
<section class="top-line" id="clases">
  <div class="wrap">
    <span class="lab">04 · Tus primeras clases</span>
    <h2>Empieza por aquí. <span class="it">Hoy.</span></h2>
    <div class="prog"><span>Has visto <b id="pc">0 de ${p.clases.length}</b></span><span class="mbar"><i id="pb"></i></span></div>
    <div class="cls">
      ${clases}
    </div>
  </div>
</section>
<section class="top-line">
  <div class="wrap">
    <span class="lab">05 · El camino completo</span>
    <h2>Esto es lo que hace falta. <span class="it">En este orden.</span></h2>
    <p>No es un temario. Es la hoja de ruta que siguen mis alumnas, la secuencia que llevamos tres años viendo funcionar, y cada paso existe porque el anterior lo hizo posible.</p>
    ${introRuta}
    <div class="route" id="route">
      <div class="rline"><i id="rl"></i></div>
      ${ruta}
    </div>
    <p class="kick">${rico(p.remate)}</p>${ctaRuta}
  </div>
</section>
${caso}
<section class="top-line">
  <div class="wrap">
    <span class="lab">${pad(n)} · Para quién no es</span>
    <h2>Esto no es <span class="it">para todas.</span></h2>
    <p>Si lo que buscas es hacerte famosa rápido y sin trabajar, este no es tu sitio y prefiero decírtelo ya.</p>
    <p><b>Aquí no filtramos por altura ni por talla. Filtramos por compromiso.</b> Es lo único que no puedo poner yo por ti.</p>
  </div>
</section>
${cierre}
<footer>
  AR Academy · la academia sin estereotipos<br>
  Página privada · solo tuya · no aparece en buscadores<br>
  <a href="/plan#legal">Privacidad</a> · <a href="/plan#legal">Aviso legal</a> · <a href="/plan#legal">Cookies</a>
</footer>
${p.previa ? '<div class="previa">Vista previa de la setter · no cuenta como abierto</div>' : ""}
<script>window.__PLAN=${datosJS};</script>
<script>${JS_PLAN}</script>
</body>
</html>`;
}

// El guion de la plantilla de /plan/ejemplo, con estos cambios: la franja lleva su nombre,
// el mini-mapa marca su paso de inicio, las clases vistas se guardan por plan, cada vídeo
// arranca en su minuto (data-start → ?start=), y se avisa al servidor cuando ella lo abre y
// cuando reproduce una clase (nunca en la vista previa).
// Sin píxel de Meta ni banner de cookies: la URL lleva su token y no tiene que salir de casa.
// Lo que se mide va a GHL como etiquetas (/api/plan/evento).
const JS_PLAN = `(function(){
var P=window.__PLAN||{};
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function kinetic(el){
  if(!el||el.dataset.k)return;el.dataset.k='1';
  var out='',idx=0;
  Array.prototype.slice.call(el.childNodes).forEach(function(n){
    var it=n.nodeType===1&&n.classList&&n.classList.contains('it');
    n.textContent.split(/(\\s+)/).forEach(function(w){
      if(/^\\s*$/.test(w)){out+=w;return}
      var d=document.createElement('span');d.textContent=w;
      out+='<span class="kw'+(it?' it':'')+'"><span class="ki" style="transition-delay:'+(idx*26)+'ms">'+d.innerHTML+'</span></span>';idx++;
    });
  });
  el.innerHTML=out;
  requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('kin')})});
  setTimeout(function(){el.classList.add('kin')},900);
}
kinetic(document.getElementById('h1'));
if('IntersectionObserver' in window && !RM){
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){kinetic(en.target);io.unobserve(en.target)}})},{threshold:.35});
  document.querySelectorAll('section h2').forEach(function(el){io.observe(el)});
} else { document.querySelectorAll('section h2').forEach(kinetic); }
var tk=document.createElement('span');tk.innerHTML='<i class="dot" aria-hidden="true"></i>';
tk.appendChild(document.createTextNode('Plan personalizado · preparado para '+(P.nombre||'ti')));
document.getElementById('tick').appendChild(tk);
var rp=document.getElementById('rp');
function leer(){var h=document.documentElement;var p=h.scrollTop/(h.scrollHeight-h.clientHeight);rp.style.transform='scaleX('+(p||0)+')'}
addEventListener('scroll',leer,{passive:true});leer();
var mini=document.getElementById('mini'),ini=+(document.querySelector('.minicap b')||{}).textContent.replace(/\\D/g,'')||1;
for(var m=1;m<=10;m++){
  var b=document.createElement('b');b.textContent=m;
  if(m===7)b.className='hot';if(m===ini&&m!==7)b.className='st1';
  mini.appendChild(b);
  if(m<10){var s=document.createElement('s');mini.appendChild(s)}
}
var rev=document.querySelectorAll('.step,.cl,.st');
if('IntersectionObserver' in window){
  var io2=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io2.unobserve(en.target)}})},{threshold:.2});
  rev.forEach(function(el,k){el.style.transitionDelay=(k%4*70)+'ms';io2.observe(el)});
  setTimeout(function(){rev.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add('in')})},1200);
} else { rev.forEach(function(el){el.classList.add('in')}); }
var route=document.getElementById('route'),rl=document.getElementById('rl');
if(route&&!RM){
  var dib=function(){var r=route.getBoundingClientRect();var p=(innerHeight*.55-r.top)/r.height;p=Math.max(0,Math.min(1,p));rl.style.transform='scaleY('+p+')'};
  addEventListener('scroll',dib,{passive:true});dib();
} else if(rl){ rl.style.transform='scaleY(1)'; }
/* avisos al servidor: abierto y clase reproducida. Nunca en la vista previa. */
function avisa(ev,extra){
  if(P.previa||!P.t)return;
  var body=JSON.stringify({t:P.t,ev:ev,yt:extra||''});
  try{ if(navigator.sendBeacon){navigator.sendBeacon('/api/plan/evento',new Blob([body],{type:'application/json'}));return} }catch(e){}
  try{ fetch('/api/plan/evento',{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}) }catch(e){}
}
setTimeout(function(){ if(document.visibilityState!=='hidden') avisa('abierto'); },2500);
function embed(caja,id,s,ev){
  if(caja.querySelector('iframe'))return;
  var f=document.createElement('iframe');
  /* La página no manda «de dónde vienes» (no-referrer: la URL lleva su token), pero el
     reproductor de YouTube lo exige y sin él da «Error 153». Al iframe solo le llega el
     dominio (strict-origin-when-cross-origin), nunca la URL con el token. */
  f.referrerPolicy='strict-origin-when-cross-origin';
  s=Math.floor(+s||0);
  f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1&playsinline=1'+(s>0?'&start='+s:'');
  f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.title='Clase';
  caja.appendChild(f);
  avisa(ev||'clase',id);
}
var N=P.nclases||4,K='plan_vistas_'+(P.t||'x').slice(-8),seen=[];
for(var z=0;z<N;z++)seen.push(false);
try{ var st=localStorage.getItem(K); if(st){var a=JSON.parse(st); if(a&&a.length===N) seen=a;} }catch(e){}
function paintProg(){
  var n=seen.filter(Boolean).length;
  document.getElementById('pc').textContent=n+' de '+N;
  document.getElementById('pb').style.width=(n/N*100)+'%';
  document.querySelectorAll('.cl').forEach(function(c){c.classList.toggle('done',!!seen[+c.dataset.cl])});
}
document.querySelectorAll('.cl').forEach(function(c){
  var i=+c.dataset.cl, caja=c.querySelector('.clf');
  function marca(v){ seen[i]=v; try{localStorage.setItem(K,JSON.stringify(seen))}catch(e){} paintProg(); }
  c.querySelector('.vw').addEventListener('click',function(){marca(!seen[i])});
  caja.setAttribute('role','button');caja.setAttribute('tabindex','0');caja.setAttribute('aria-label','Ver la clase');
  function abre(){ embed(caja,c.dataset.yt,c.dataset.start); if(!seen[i]) marca(true); }
  caja.addEventListener('click',abre);
  caja.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();abre();} });
});
paintProg();
document.querySelectorAll('.cchip[data-yt]').forEach(function(ch){
  ch.addEventListener('click',function(){
    var st=ch.closest('.st'), pl=st.querySelector('.stplayer'), caja=pl.querySelector('.clf');
    var mismo=ch.classList.contains('on');
    st.querySelectorAll('.cchip').forEach(function(o){o.classList.remove('on')});
    if(mismo){pl.classList.remove('on');caja.innerHTML='';return}
    ch.classList.add('on');caja.innerHTML='';pl.classList.add('on');embed(caja,ch.dataset.yt,ch.dataset.start);
    pl.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
  });
});
/* la hoja de ruta contada por Ari: el vídeo y sus capítulos (cada uno lo arranca en su minuto) */
var rv=document.querySelector('#rv .clf');
if(rv){
  rv.setAttribute('role','button');rv.setAttribute('tabindex','0');rv.setAttribute('aria-label','Ver el vídeo de la hoja de ruta');
  var abreRV=function(s){ var f=rv.querySelector('iframe'); if(f) rv.removeChild(f); embed(rv,rv.dataset.yt,s,'ruta'); };
  rv.addEventListener('click',function(){ if(!rv.querySelector('iframe')) abreRV(0); });
  rv.addEventListener('keydown',function(e){ if((e.key==='Enter'||e.key===' ')&&!rv.querySelector('iframe')){e.preventDefault();abreRV(0);} });
  document.querySelectorAll('.cap').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.cap').forEach(function(o){o.classList.remove('on')});
      b.classList.add('on'); abreRV(+b.dataset.start||0);
      rv.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});
    });
  });
}
var wam=document.getElementById('wamsg'),word=(wam&&wam.getAttribute('data-w'))||'ACCESO',wp=0;
if(wam){
  if('IntersectionObserver' in window){
    var io3=new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting)return;io3.disconnect();
      (function t(){ if(wp<=word.length){ wam.textContent=word.slice(0,wp); wp++; setTimeout(t,RM?0:140);} })();
    })},{threshold:.5});
    io3.observe(wam.parentElement);
  } else { wam.textContent=word; }
}
var wb=document.getElementById('wabtn');
if(wb)wb.addEventListener('click',function(){ avisa('acceso'); });
var cb=document.getElementById('combtn');
if(cb)cb.addEventListener('click',function(){ avisa('comunidad'); });
})();`;
