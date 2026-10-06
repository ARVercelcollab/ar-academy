import type { Ficha } from "./ghl";

/**
 * El contenido del plan, según lo que contestó cada chica en /plan.
 *
 * Tres tablas escritas una vez (estructura-landing-y-plan.md §5):
 *   - por PROBLEMA (pregunta 3, cuatro opciones): título, «dónde estás», tres pasos de la
 *     semana, las cuatro primeras clases, el paso por el que empieza y la chica que empezó
 *     donde ella;
 *   - por OBJETIVO (pregunta 4, tres opciones): «a dónde vas»;
 *   - por OCUPACIÓN (pregunta 1, cinco opciones): la etiqueta de la cabecera y una línea de
 *     encuadre.
 * Las opciones se comparan con el texto literal de public/plan/index.html (`var S`). Si una
 * pregunta cambia allí, cambia aquí. Si una respuesta no cuadra con ninguna, se usa la de
 * «No sé por dónde empezar», que es la plantilla de /plan/ejemplo.
 *
 * Marcas de texto: **negrita** y [[cursiva en vino]].
 */

export type Clase = { yt: string; titulo: string; etiqueta: string; porQueTitulo: string; porQue: string };
export type Paso = { t: string; p: string };
export type Caso = {
  nombre: string;
  dato: string; // «32 años · España»
  foto?: string;
  titulo: [string, string];
  logro: string;
  historia: string;
  cita?: string;
};
export type PasoRuta = {
  n: string;
  nombre: string;
  porQue: string;
  mentora: string;
  clases: { texto: string; yt?: string; ancla?: boolean }[];
  empieza?: boolean;
  entraTodoElMundo?: boolean;
  final?: boolean;
};

export type PlanArmado = {
  token: string;
  previa: boolean;
  cierre: "formacion" | "comunidad";
  urlComunidad: string;
  nombre: string;
  h1: [string, string];
  chips: string[];
  cita: string;
  citaRespuesta: string;
  pasoInicio: number;
  donde: { titulo: [string, string]; parrafos: string[] };
  adonde: { titulo: [string, string]; parrafos: string[] };
  pasos: Paso[];
  clases: Clase[];
  ruta: PasoRuta[];
  remate: string;
  caso: Caso | null;
};

// ── Opciones literales del formulario ─────────────────────────────────────────
export const OCUPACION = {
  vive: "Soy modelo o creadora de contenido a tiempo completo y ya vivo de ello",
  colabora: "Trabajo por cuenta ajena y hago alguna colaboración como segundo ingreso",
  cero: "Trabajo por cuenta ajena y empiezo de cero en esto",
  estudia: "Soy estudiante",
  nada: "No estudio ni trabajo ahora mismo",
} as const;

export const PROBLEMA = {
  marca: "No sé cómo posicionar mi marca personal para cobrar más por mis trabajos",
  negociar: "Me llegan propuestas pero no sé negociar",
  colaboraciones: "No sé cómo conseguir colaboraciones de forma continua",
  empezar: "No sé por dónde empezar, necesito una guía paso a paso",
} as const;

export const OBJETIVO = {
  extra: "Solo quiero un ingreso extra, de 1.000 € a 2.000 €",
  fuente: "Quiero que sea mi primera fuente de ingresos: de 2.000 € a 5.000 €",
  todo: "Voy con todo: más de 5.000 €",
} as const;

type ClaveProblema = keyof typeof PROBLEMA;
type ClaveObjetivo = keyof typeof OBJETIVO;
type ClaveOcupacion = keyof typeof OCUPACION;

function clave<T extends Record<string, string>>(tabla: T, valor: string, porDefecto: keyof T): keyof T {
  const v = (valor || "").trim();
  const k = (Object.keys(tabla) as (keyof T)[]).find((x) => tabla[x] === v);
  return k ?? porDefecto;
}

// ── Las clases ────────────────────────────────────────────────────────────────
const C = {
  zara: { yt: "oXrZwDEh2Q4", titulo: "Si quieres modelar para ZARA, primero mira esta clase", etiqueta: "Clase" },
  portafolio: { yt: "_Z3FUO0Wwa0", titulo: "Cómo hacer un portafolio de modelo profesional paso a paso", etiqueta: "Clase" },
  mente: { yt: "pGJ-HgohR-8", titulo: "Reprogramar tu mente también es parte del modelaje", etiqueta: "Clase" },
  alba: { yt: "Y579S4qK0BY", titulo: "Alba: de no atreverse a modelar a ganar dinero con su imagen", etiqueta: "Tu caso" },
  marca: { yt: "PHyImmNq_oE", titulo: "Cómo construir tu marca personal desde cero", etiqueta: "Clase · 44 min" },
  casting: { yt: "M5yvR_AKbUo", titulo: "Errores que te hacen perder un casting", etiqueta: "Clase · 10 min" },
  redes: { yt: "f2sdsrpO1C0", titulo: "¿Se puede vivir de las redes y el UGC?", etiqueta: "Charla · 75 min" },
};

// ── Por PROBLEMA ──────────────────────────────────────────────────────────────
type BloqueProblema = {
  h1: [string, string];
  chip: string;
  citaRespuesta: string;
  pasoInicio: number;
  donde: { titulo: [string, string]; parrafos: string[] };
  pasos: Paso[];
  clases: Clase[];
  remate: string;
};

const POR_PROBLEMA: Record<ClaveProblema, BloqueProblema> = {
  empezar: {
    h1: ["se acabó", "adivinar."],
    chip: "«No sé por dónde empezar»",
    citaRespuesta: "Pues te la voy a dar. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 1,
    donde: {
      titulo: ["Hiciste lo más difícil", "en el orden equivocado."],
      parrafos: [
        "Has mirado, has probado cosas sueltas, y de tanto intento sin respuesta sacaste la conclusión que parecía la única posible: que a lo mejor esto no es para ti.",
        "Mira lo que pasa sin que nadie te lo diga: **casi todo el mundo entra por el paso 7 de un camino de 10.** Las fotos y la técnica van casi al final, y son lo primero que te enseñan a hacer. No fallaste tú. Falló el orden.",
      ],
    },
    pasos: [
      { t: "Empieza por la cabeza, no por las fotos", p: "Es el paso 1 del camino y el que todo el mundo se salta. Ve la clase 3 y luego el caso de Alba: ella tampoco sabía por dónde empezar." },
      { t: "Mira cómo trabaja una marca por dentro", p: "Antes de hacerte ninguna foto, entiende qué buscan cuando contratan. La clase 1 te lo cuenta con una marca que conoces." },
      { t: "Arranca tu portafolio con método", p: "Con lo que ya tienes. La clase 2 te enseña paso a paso qué se pide hoy, para que no gastes en fotos a ciegas." },
    ],
    clases: [
      { ...C.zara, porQueTitulo: "Por qué la primera:", porQue: "es lo que quieres, trabajar con marcas, contado desde dentro." },
      { ...C.portafolio, porQueTitulo: "Por qué:", porQue: "el activo que te van a pedir en todas partes, hecho con método y no a ciegas." },
      { ...C.mente, porQueTitulo: "Por qué:", porQue: "la cabeza va antes que la técnica. Es el paso 1 del camino." },
      { ...C.alba, porQueTitulo: "Por qué ella:", porQue: "Alba empezó sin saber por dónde, y sin creérselo. Escúchala contarlo." },
    ],
    remate:
      "**Casi todo el mundo empieza por el paso 7.** Fotos y técnica antes que cabeza, orden, identidad, marca y voz. Por eso hay tanta chica con un book precioso y ninguna llamada. La técnica no falla: falla lo que tenía que venir antes. Tú ya no tienes ese problema: [[ya sabes el orden.]]",
  },
  marca: {
    h1: ["que te paguen", "por quién eres."],
    chip: "«Quiere cobrar más por su marca»",
    citaRespuesta: "Y tiene solución. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 4,
    donde: {
      titulo: ["Imagen ya tienes.", "Falta que se entienda."],
      parrafos: [
        "Haces trabajos, o estás cerca, pero cobras lo que te ofrecen y no lo que vale lo que haces. No es falta de talento: es que todavía no está claro, ni para ti ni para las marcas, **qué te hace distinta.**",
        "Eso tiene nombre: **marca personal.** Es el paso 4 de un camino de 10, y casi nadie llega a él porque se queda en el 7, creyendo que con mejores fotos le van a pagar más. No funciona así: **pagan más a quien saben por qué contratar.**",
      ],
    },
    pasos: [
      { t: "Define qué te hace distinta", p: "Antes de tocar tu Instagram, escribe tres palabras que quieres que piense una marca al verte. La clase 1 te enseña a sacarlas." },
      { t: "Ordena tu perfil como un portafolio", p: "Biografía, destacadas y las primeras fotos contando lo mismo. La clase 2 te dice qué mira una marca antes de escribirte." },
      { t: "Pon tu precio con argumentos", p: "Una tarifa base escrita, y de ahí no se baja. La clase 3 te cuenta los errores que hacen perder trabajos, y dinero." },
    ],
    clases: [
      { ...C.marca, porQueTitulo: "Por qué la primera:", porQue: "es tu paso, contado entero: cómo se construye una marca que las marcas entienden." },
      { ...C.portafolio, porQueTitulo: "Por qué:", porQue: "tu perfil es tu portafolio. Aquí ves qué tiene que tener para que te paguen más." },
      { ...C.casting, porQueTitulo: "Por qué:", porQue: "cómo presentarte para que te elijan a ti, y no a la siguiente." },
      { ...C.alba, porQueTitulo: "Por qué ella:", porQue: "Alba pasó de no atreverse a ganar dinero con su imagen. Escúchala contarlo." },
    ],
    remate:
      "**Casi todo el mundo intenta cobrar más con mejores fotos.** Es el paso 7. Pero lo que sube tu tarifa está antes: que se entienda quién eres y por qué contratarte a ti. Tú ya sabes dónde está tu palanca: [[en tu marca.]]",
  },
  negociar: {
    h1: ["se acabó decir", "que sí a todo."],
    chip: "«Le llegan propuestas»",
    citaRespuesta: "Lo más difícil ya lo tienes: te escriben. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 8,
    donde: {
      titulo: ["Te escriben.", "Ahora toca cobrar bien."],
      parrafos: [
        "Te llegan propuestas, y eso es lo que la mayoría todavía no consigue. Pero cuando llega una dudas: cuánto pedir, qué incluye, qué pasa con los derechos de uso, si aceptar un canje. Y por miedo a perderla, dices que sí a lo primero.",
        "Eso es el paso 8 del camino, **técnicas de casting:** presentarte, que te contraten, **cobrar bien y estar protegida legalmente.** Nadie te lo enseñó porque casi nadie lo enseña.",
      ],
    },
    pasos: [
      { t: "Ten tu tarifa escrita antes de que te escriban", p: "Una cifra por foto, otra por vídeo y otra por jornada, y aparte los derechos de uso. Si la improvisas en el chat, pierdes." },
      { t: "Pregunta antes de contestar", p: "Qué uso le van a dar, cuánto tiempo, en qué países y cuántas piezas. Con esas cuatro respuestas el precio sale solo." },
      { t: "Si usan tu imagen en anuncios, se paga", p: "Un canje puede tener sentido para empezar. Unos derechos de uso, nunca gratis. La clase 1 te cuenta lo que nadie cuenta." },
    ],
    clases: [
      { ...C.casting, porQueTitulo: "Por qué la primera:", porQue: "es tu paso: presentarte y que te contraten sin regalar tu trabajo." },
      { ...C.marca, porQueTitulo: "Por qué:", porQue: "negocia mejor quien tiene una marca clara detrás. Aquí se construye." },
      { ...C.redes, porQueTitulo: "Por qué:", porQue: "cómo cobran de verdad las creadoras que viven de esto: tarifas, UGC y marcas." },
      { ...C.alba, porQueTitulo: "Por qué ella:", porQue: "Alba aprendió a cobrar por su imagen. Escúchala contarlo." },
    ],
    remate:
      "**Casi todo el mundo cree que lo difícil es que te escriban.** Y lo difícil es lo que viene después: decir un precio y sostenerlo. Eso se aprende, y tiene su paso en el camino. Tú ya sabes dónde está tu palanca: [[en cómo negocias.]]",
  },
  colaboraciones: {
    h1: ["que trabajar no dependa", "de la suerte."],
    chip: "«Quiere colaboraciones continuas»",
    citaRespuesta: "Y se puede ordenar. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 4,
    donde: {
      titulo: ["Colaboras a veces.", "Falta que sea siempre."],
      parrafos: [
        "Te sale un trabajo, luego nada durante semanas, y vuelta a empezar. No es mala suerte: es que tus colaboraciones dependen de que alguien te encuentre, y no de **un sistema que haga que te encuentren.**",
        "Ese sistema son tres pasos del camino: **marca personal (4), redes sociales (6) y UGC (9).** Cuando están en orden, las marcas llegan y tú eliges con quién trabajar.",
      ],
    },
    pasos: [
      { t: "Publica pensando en las marcas", p: "Cada publicación tiene que enseñar algo que una marca pueda comprar: cómo luces su producto, cómo lo cuentas. La clase 2 te enseña a hacerlo." },
      { t: "Escribe tú a cinco marcas esta semana", p: "No esperes a que te encuentren. Cinco marcas que ya consumes, un mensaje corto y tu portafolio. La clase 1 te enseña cómo trabaja una marca por dentro." },
      { t: "Abre la vía del UGC", p: "Contenido para marcas sin depender de tus seguidores. Es otra forma de cobrar, cada vez más pedida. Está en la clase 2." },
    ],
    clases: [
      { ...C.zara, porQueTitulo: "Por qué la primera:", porQue: "para que una marca te elija, primero hay que entender qué busca. Contado desde dentro." },
      { ...C.redes, porQueTitulo: "Por qué:", porQue: "cómo viven de las redes y del UGC las que tienen trabajo todos los meses." },
      { ...C.marca, porQueTitulo: "Por qué:", porQue: "lo que hace que las marcas te escriban a ti es tu marca. Aquí se construye." },
      { ...C.alba, porQueTitulo: "Por qué ella:", porQue: "Alba pasó de no atreverse a ganar dinero con su imagen. Escúchala contarlo." },
    ],
    remate:
      "**Casi todo el mundo busca la siguiente colaboración de una en una.** Por eso un mes hay y otro no. Lo que hace que no paren es un sistema: marca, contenido y una forma de cobrar que no dependa de seguidores. Tú ya sabes dónde está tu palanca: [[en tu sistema.]]",
  },
};

// ── Por OBJETIVO ──────────────────────────────────────────────────────────────
const POR_OBJETIVO: Record<ClaveObjetivo, { chip: string; titulo: [string, string]; parrafos: string[] }> = {
  extra: {
    chip: "Quiere un ingreso extra",
    titulo: ["Un ingreso extra,", "sin dejar lo tuyo."],
    parrafos: [
      "Ese fue el objetivo que marcaste: **de 1.000 € a 2.000 € al mes con tu imagen.** Es realista, y es por donde empiezan muchas de mis alumnas: unas pocas colaboraciones al mes, bien cobradas.",
      "Para eso no hace falta más tiempo: hace falta **hacer en orden lo que ya tienes.** Eso es lo que tienes debajo. Y al final del camino, la salida: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas.",
    ],
  },
  fuente: {
    chip: "Quiere vivir de esto",
    titulo: ["Que sea tu primera fuente", "de ingresos."],
    parrafos: [
      "Ese fue el objetivo que marcaste: **de 2.000 € a 5.000 € al mes con tu imagen y tu marca personal.** Ese mercado existe, y ya viste en la página a quién está buscando.",
      "Lo que te faltaba no era mercado. Era **saber qué preparar antes de presentarte, y en qué orden.** Eso es exactamente lo que tienes debajo. Y al final del camino, la salida: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas.",
    ],
  },
  todo: {
    chip: "Va con todo",
    titulo: ["Vas con todo.", "Y se nota."],
    parrafos: [
      "Marcaste **más de 5.000 € al mes.** Ese nivel existe: campañas, derechos de uso, contratos con marcas, representación. Pero no se llega saltando pasos: se llega con **una marca que las marcas reconocen y alguien que negocie por ti.**",
      "Eso es justo el final de tu camino: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas. Todo lo que tienes debajo es lo que te pone en esa puerta.",
    ],
  },
};

// ── Por OCUPACIÓN ─────────────────────────────────────────────────────────────
const POR_OCUPACION: Record<ClaveOcupacion, { chip: string; linea: string }> = {
  vive: { chip: "Ya vive de su imagen", linea: "Ya vives de tu imagen, así que esto no va de empezar: va de **cobrar lo que vale lo que ya haces.**" },
  colabora: { chip: "Trabaja y ya colabora", linea: "Ya tienes un pie dentro con tus colaboraciones. Ahora toca que **dejen de ser sueltas.**" },
  cero: { chip: "Trabaja por cuenta ajena", linea: "Trabajas por cuenta ajena, así que tu tiempo cuenta: este plan está pensado para avanzar **con tu trabajo, no en lugar de él.**" },
  estudia: { chip: "Estudia", linea: "Estudias, y eso juega a tu favor: **empiezas antes que casi todas**, y con tiempo para hacerlo bien." },
  nada: { chip: "Puede dedicarle tiempo", linea: "Ahora mismo tienes algo que muchas no tienen: **tiempo para dedicarle de verdad.**" },
};

// ── La ruta de 10 pasos (fija; solo cambia por dónde empieza) ────────────────
function ruta(inicio: number): PasoRuta[] {
  const pasos: PasoRuta[] = [
    { n: "01", nombre: "Mentalidad", porQue: "La cabeza antes que la técnica. Sin esto, cada silencio se convierte en un veredicto sobre ti, y ya sabes cómo acaba eso.", mentora: "Con **Flor Caminero** · psicóloga y modelo · 1 a 1", clases: [{ texto: "Reprogramar tu mente", yt: "pGJ-HgohR-8" }] },
    { n: "02", nombre: "Organización", porQue: "Marcaste «cuanto antes». Aquí es donde ese «ya» se convierte en calendario: tu tiempo, ordenado para que el plan se cumpla, con todo lo que ya tienes encima.", mentora: "Con **Victoria Poggioli** · 1 a 1", clases: [] },
    { n: "03", nombre: "Imagen y estilismo", porQue: "Quién eres tú delante de una cámara, antes de ponerte delante de una. Tu imagen habla antes de que tú lo hagas.", mentora: "Con **Jazmín Pérez** · 1 a 1", clases: [{ texto: "Clase · Colorimetría para modelos", yt: "mUhYzmRkKB0" }] },
    { n: "04", nombre: "Marca personal", porQue: "Que las marcas te encuentren a ti, confíen en ti y te paguen más por ello. Aquí se construye.", mentora: "Con **Carlos Correa** · grupal", clases: [{ texto: "Clase completa · 44 min", yt: "PHyImmNq_oE" }] },
    { n: "05", nombre: "Oratoria", porQue: "Comunicar bien en castings, eventos y redes. De esto dependen tus relaciones, tus contactos y tus oportunidades.", mentora: "Con **Angélica Triana**", clases: [] },
    { n: "06", nombre: "Redes sociales", porQue: "Todo lo anterior, llevado a tu contenido: perder el miedo a la cámara, crear, editar, publicar. Es donde miran las marcas.", mentora: "Con **Pierina Alves** · 1 a 1", clases: [{ texto: "Charla · ¿Se puede vivir de las redes? · 75 min", yt: "f2sdsrpO1C0" }] },
    { n: "07", nombre: "Pasarela y fotopose", porQue: "La técnica. Es donde casi todas empiezan, con un book por delante y seis pasos por detrás sin hacer. Ahora sí le toca.", mentora: "Con **Arianny** · 1 a 1 con **Mili Wirtz**", clases: [{ texto: "Domina la pasarela", yt: "uxNjzq3DRrg" }, { texto: "Aprende a posar en 5 min", yt: "U9Gn1jmGw3A" }], entraTodoElMundo: true },
    { n: "08", nombre: "Técnicas de casting", porQue: "Presentarte, que te contraten, cobrar bien y estar protegida legalmente. Lo que nadie te contó, contado entero.", mentora: "Con **Arianny** · 1 a 1 con **Mili Wirtz**", clases: [{ texto: "Errores que te hacen perder un casting · 10 min", yt: "M5yvR_AKbUo" }] },
    { n: "09", nombre: "UGC", porQue: "Otra vía de cobrar de las marcas, cada vez más pedida. Tu mentora vuelve a ser Pierina: la charla del paso 6 cubre también esta parte.", mentora: "Con **Pierina Alves** · 1 a 1", clases: [] },
    { n: "10", nombre: "AR Agency", porQue: "Cuando el equipo se cerciora de que estás formada y preparada, nuestra agencia internacional te representa: castings de campaña, revistas, pasarela, contenido. **Y durante todo el camino, una mentora dedicada solo a ti.** Por eso esto no es otro curso.", mentora: "Nuestra **agencia internacional** · te representamos nosotros", clases: [], final: true },
  ];
  return pasos.map((p) => ({ ...p, empieza: +p.n === inicio && inicio !== 10 }));
}

// ── El caso de alumna por problema (se rellena con el catálogo de casos) ──────
export const CASO_POR_PROBLEMA: Partial<Record<ClaveProblema, Caso>> = {};

// ── Armar el plan ─────────────────────────────────────────────────────────────
export function armarPlan(
  f: Ficha,
  token: string,
  opts: { previa: boolean; cierre: "formacion" | "comunidad" },
): PlanArmado {
  const kp = clave(PROBLEMA, f.dolor, "empezar") as ClaveProblema;
  const ko = clave(OBJETIVO, f.objetivo, "fuente") as ClaveObjetivo;
  const kc = f.ocupacion ? (clave(OCUPACION, f.ocupacion, "cero") as ClaveOcupacion) : null;
  const bp = POR_PROBLEMA[kp];
  const bo = POR_OBJETIVO[ko];

  const pais = f.pais && !/^otro/i.test(f.pais) ? f.pais.replace(/^Resto de Europa$/, "Europa") : "";
  const chips = [
    pais,
    f.edad ? `${f.edad} años` : "",
    kc ? POR_OCUPACION[kc].chip : "",
    bp.chip,
    bo.chip,
  ].filter(Boolean);

  const adonde = {
    titulo: bo.titulo,
    parrafos: kc ? [bo.parrafos[0], POR_OCUPACION[kc].linea, bo.parrafos[1]] : bo.parrafos,
  };

  return {
    token,
    previa: opts.previa,
    cierre: opts.cierre,
    urlComunidad: "https://www.ariannyrivasacademy.com/comunidad",
    nombre: f.nombre,
    h1: bp.h1,
    chips,
    cita: f.dolor || PROBLEMA.empezar,
    citaRespuesta: bp.citaRespuesta,
    pasoInicio: bp.pasoInicio,
    donde: bp.donde,
    adonde,
    pasos: bp.pasos,
    clases: bp.clases,
    ruta: ruta(bp.pasoInicio),
    remate: bp.remate,
    caso: CASO_POR_PROBLEMA[kp] ?? null,
  };
}

// ── Qué cierre lleva su plan ──────────────────────────────────────────────────
// Propuesta pendiente de validar por Carlos (decisiones.md): la formación para quien puede
// empezar ya; la Comunidad para menores, para quien hoy no tiene ingresos ni trabajo y para
// Latam sin ingresos. Es una recomendación: la nota trae los dos enlaces y la setter decide.
const PAISES_FORMACION = ["España", "Resto de Europa", "Estados Unidos o Canadá", "Australia o Emiratos"];
const INGRESOS_BAJOS = ["Todavía nada", "Menos de 750 €"];

export function cierreRecomendado(d: {
  edad: number | null;
  ocupacion: string;
  ingresos: string;
  pais: string;
}): "formacion" | "comunidad" {
  if (d.edad !== null && d.edad < 18) return "comunidad";
  const sinTrabajo = d.ocupacion === OCUPACION.estudia || d.ocupacion === OCUPACION.nada;
  if (sinTrabajo && INGRESOS_BAJOS.includes(d.ingresos)) return "comunidad";
  if (!PAISES_FORMACION.includes(d.pais) && INGRESOS_BAJOS.includes(d.ingresos)) return "comunidad";
  return "formacion";
}
