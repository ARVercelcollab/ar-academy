import { CSS_PLAN } from "./plantilla-css";
import type { PlanArmado } from "./contenido";

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

// Estilos que la plantilla de /plan/ejemplo no trae: el vídeo del bloque final.
const CSS_EXTRA = `<style>
.accv{margin:22px 0 0;border:1px solid var(--line)}
.accv .clf{cursor:pointer}
.accvt{padding:14px 16px;margin:0 !important;font-size:14.5px}
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
        <div class="clf"><img src="https://i.ytimg.com/vi/${esc(c.yt)}/maxresdefault.jpg" alt="" loading="lazy" onload="if(this.naturalWidth<200)this.onerror()" onerror="this.onerror=this.onload=null;this.src=this.src.replace('maxresdefault','sddefault')"><div class="play"></div><span class="dur">${esc(c.etiqueta)}</span></div>
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

  // El vídeo del bloque final: miniatura y, al pulsar, el reproductor (mismo patrón que las clases).
  const va = p.videoAcceso;
  const videoAcceso = va
    ? `
    <p>Y si solo te da tiempo a ver una cosa, que sea esta: cómo trabajamos con cada alumna, paso a paso, contado por mí.</p>
    <div class="accv">
      <div class="clf" data-yt="${esc(va.yt)}" data-start="${seg(va.start)}"><img src="https://i.ytimg.com/vi/${esc(va.yt)}/maxresdefault.jpg" alt="" loading="lazy" onload="if(this.naturalWidth<200)this.onerror()" onerror="this.onerror=this.onload=null;this.src=this.src.replace('maxresdefault','sddefault')"><div class="play"></div><span class="dur">${esc(va.etiqueta)}</span></div>
      <p class="accvt">${esc(va.titulo)}</p>
    </div>`
    : "";

  // La Comunidad. A una menor se le pide que lo hable antes con sus padres: en la llamada de
  // bienvenida se les invita a estar (negocio.md §5).
  const comunidadTexto = p.menor
    ? `<p>En la <b>Comunidad AR</b> tienes los primeros módulos de la formación, los directos conmigo y chicas que están justo donde tú, a tu ritmo y sin prisa.</p>
    <p><b>Antes de entrar, háblalo con tus padres.</b> Enséñales este plan y la clase 4, que es para ellos. En la llamada de bienvenida les pedimos que estén contigo: así lo empiezan juntos.</p>`
    : `<p>Si ahora mismo no es el momento de la formación completa, no pasa nada: no tienes que esperar para empezar. En la <b>Comunidad AR</b> tienes los primeros módulos de la formación, los directos conmigo y chicas que están justo donde tú.</p>
    <p>Es la forma de hacer tus tres pasos de esta semana con alguien al lado, y cuando estés lista para ir a por todo, ya sabes dónde estoy.</p>`;

  const cierre =
    p.cierre === "comunidad"
      ? `<section class="top-line" id="acceso">
  <div class="wrap">
    <span class="lab">${pad(n + 1)} · Tu siguiente paso</span>
    <h2>Empieza <span class="it">acompañada.</span></h2>
    ${comunidadTexto}
    <div class="cta-wrap">
      <a class="pillbtn big full solid" id="combtn" href="${esc(p.urlComunidad)}" target="_blank" rel="noopener">Entrar en la Comunidad AR</a>
    </div>
    <p class="soft">${p.menor ? "Y si tienes cualquier duda, o la tienen tus padres, escríbeme por WhatsApp." : "Y si tienes cualquier duda, contéstame por WhatsApp."} Te leo yo. 🤍</p>
  </div>
</section>`
      : `<section class="top-line" id="acceso">
  <div class="wrap">
    <span class="lab">${pad(n + 1)} · Cuando estés lista</span>
    <h2>Antes de dar el paso, <span class="it">conóceme.</span></h2>
    <p>Mira el contenido del canal y de mi Instagram. Ahí está gran parte de lo que enseño, gratis y sin pedirte nada. Quiero que sepas cómo trabajo antes de que decidas nada.</p>${videoAcceso}
    <div class="know">
      <a class="pillbtn" href="https://www.youtube.com/@Ariannyrivass" target="_blank" rel="noopener">Ver el canal de YouTube</a>
      <a class="pillbtn" href="https://www.instagram.com/ariaannyrivas" target="_blank" rel="noopener">Ver mi Instagram</a>
    </div>
    <p style="margin-top:34px">Y si después de verlo lo tienes claro: cada mes abrimos <b>un número limitado de plazas</b> para trabajar conmigo y con mi equipo, acompañada de principio a fin. No trabajamos con todo el mundo, solo con chicas comprometidas y decididas.</p>
    <div class="wa">
      <small>Escríbeme esta palabra por WhatsApp</small>
      <p><span id="wamsg"></span><span class="caret"></span></p>
    </div>
    <div class="cta-wrap">
      <a class="pillbtn big full btnwa" id="wabtn" href="https://wa.me/34722655343?text=ACCESO" target="_blank" rel="noopener">Escribir ACCESO por WhatsApp</a>
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
    <p>No es un temario. Es la secuencia que llevamos tres años viendo funcionar, y cada paso existe porque el anterior lo hizo posible. En cada uno te dejo quién lo imparte, y donde hay clase abierta, la clase, para que lo veas por dentro.</p>
    <div class="route" id="route">
      <div class="rline"><i id="rl"></i></div>
      ${ruta}
    </div>
    <p class="kick">${rico(p.remate)}</p>
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
function embed(caja,id,s){
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
  avisa('clase',id);
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
/* el vídeo del bloque final */
document.querySelectorAll('.accv .clf').forEach(function(caja){
  caja.setAttribute('role','button');caja.setAttribute('tabindex','0');caja.setAttribute('aria-label','Ver la clase');
  function abre(){ embed(caja,caja.dataset.yt,caja.dataset.start); }
  caja.addEventListener('click',abre);
  caja.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();abre();} });
});
var wam=document.getElementById('wamsg'),word='ACCESO',wp=0;
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
