import type { Ficha } from "./ghl";

/**
 * El contenido del plan, según lo que contestó cada chica en /plan.
 *
 * Tres tablas escritas una vez (estructura-landing-y-plan.md §5):
 *   - por PROBLEMA (pregunta 3, cuatro opciones): título, «dónde estás», tres pasos de la
 *     semana, la clase 1 y el paso por el que empieza;
 *   - por OBJETIVO (pregunta 4, tres opciones): «a dónde vas» y el minuto en el que arranca
 *     la clase 2;
 *   - por OCUPACIÓN (pregunta 1, cinco opciones): la etiqueta de la cabecera, una línea de
 *     encuadre y el final del paso 2 (Organización).
 *
 * Las cuatro primeras clases (videos.md §3.1-3.4, fase 1 del 2026-10-07):
 *   1 · la de su problema · 2 · cuánto gana una modelo, desde el minuto de su objetivo ·
 *   3 · mentalidad (fija) · 4 · una chica que empezó donde ella, elegida por parecido.
 * Un vídeo no se repite dentro del mismo plan.
 *
 * Menor de edad (edad < 18): sin cifras de ingresos, «a dónde vas» va de formarse con calma
 * y con su familia, la clase 4 es el vídeo para sus padres y el cierre es la Comunidad.
 *
 * Las opciones se comparan con el texto literal de public/plan/index.html (`var S`). Si una
 * pregunta cambia allí, cambia aquí. Si el problema no se reconoce se usa el contenido de
 * «No sé por dónde empezar», pero sin cita: nunca se le pone en la boca algo que no dijo.
 *
 * Marcas de texto: **negrita** y [[cursiva en vino]].
 */

export type Clase = {
  yt: string;
  start?: number; // segundo en el que arranca el reproductor (youtube-nocookie ?start=)
  titulo: string;
  etiqueta: string;
  porQueTitulo: string;
  porQue: string;
};
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
  clases: { texto: string; yt?: string; start?: number; ancla?: boolean }[];
  empieza?: boolean;
  entraTodoElMundo?: boolean;
  final?: boolean;
};
export type Video = { yt: string; start?: number; titulo: string; etiqueta: string };

export type PlanArmado = {
  token: string;
  previa: boolean;
  cierre: "formacion" | "comunidad";
  menor: boolean;
  urlComunidad: string;
  nombre: string;
  h1: [string, string];
  chips: string[];
  cita: string; // vacía si no la reconocemos: entonces no sale el bloque «Esto me lo contaste tú»
  citaRespuesta: string;
  pasoInicio: number;
  donde: { titulo: [string, string]; parrafos: string[] };
  adonde: { titulo: [string, string]; parrafos: string[] };
  pasos: Paso[];
  clases: Clase[];
  ruta: PasoRuta[];
  remate: string;
  caso: Caso | null;
  videoAcceso: Video | null; // el vídeo del bloque final (solo en el cierre de formación)
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

function normal(v: string): string {
  return (v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Coincidencia exacta con una opción; si no, por palabras clave (por si la setter corrigió el
 *  campo a mano en GHL). Devuelve null si no hay forma de saberlo. */
function clave<T extends Record<string, string>>(
  tabla: T,
  valor: string,
  pistas: [RegExp, keyof T][],
): { k: keyof T; exacta: boolean } | null {
  const v = normal(valor);
  if (!v) return null;
  const k = (Object.keys(tabla) as (keyof T)[]).find((x) => normal(tabla[x]) === v);
  if (k) return { k, exacta: true };
  const p = pistas.find(([re]) => re.test(v));
  return p ? { k: p[1], exacta: false } : null;
}

const PISTAS_PROBLEMA: [RegExp, ClaveProblema][] = [
  [/negoci/, "negociar"],
  [/colabora/, "colaboraciones"],
  [/marca personal|posicion/, "marca"],
  [/empezar|por donde|paso a paso/, "empezar"],
];
const PISTAS_OBJETIVO: [RegExp, ClaveObjetivo][] = [
  [/extra|1\.?000 ?€? a 2\.?000/, "extra"],
  [/primera fuente|2\.?000 ?€? a 5\.?000/, "fuente"],
  [/con todo|mas de 5\.?000/, "todo"],
];
const PISTAS_OCUPACION: [RegExp, ClaveOcupacion][] = [
  [/vivo de ello|tiempo completo/, "vive"],
  [/colaboracion/, "colabora"],
  [/cuenta ajena|de cero/, "cero"],
  [/estudiante|estudio y/, "estudia"],
  [/ni trabajo|no estudio/, "nada"],
];

/** «1:50», «18:10». */
function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" + r : r}`;
}

// ── Los vídeos (todos comprobados con oEmbed el 2026-10-07: públicos y embebibles) ──
const YT = {
  mapa: "yf1uPBwX3gg", // Cómo ser Modelo Profesional en 2026 (Empezando desde CERO) · 16:10
  marcaCorta: "Rt9QCiGn90Q", // Sin MARCA PERSONAL no hay carrera como MODELO en 2026 · 6:32
  publicidad: "xlgModVDtgM", // El trabajo mejor pagado en el MODELAJE · 8:31
  cuantoGana: "lCrUKF0oWdQ", // La verdad sobre cuánto gana una modelo · 9:23 (con capítulos)
  mente: "pGJ-HgohR-8", // Reprogramar tu mente también es parte del modelaje · 5:40
  padres: "0kMp75UzGnk", // ¿Tu hija quiere ser MODELO o CREADORA DE CONTENIDO? · 11:58
  acceso: "xlwRBX-JLBM", // LOS PASOS EXACTOS PARA VIVIR DEL MODELAJE · 10:45
} as const;

// Capítulos exactos de lCrUKF0oWdQ: 1:50 principiante · 2:54 con experiencia · 3:35 profesional
// · 5:45 versatilidad.
const START_OBJETIVO: Record<ClaveObjetivo, number> = { extra: 110, fuente: 174, todo: 215 };
const START_VERSATILIDAD = 345;

type ClaseBase = Omit<Clase, "porQueTitulo" | "porQue">;
const C: Record<"mapa" | "marcaCorta" | "publicidad" | "mente", ClaseBase> = {
  mapa: { yt: YT.mapa, titulo: "Cómo ser modelo profesional empezando desde cero", etiqueta: "Clase · 16 min" },
  marcaCorta: { yt: YT.marcaCorta, titulo: "Sin marca personal no hay carrera como modelo", etiqueta: "Clase · 7 min" },
  // Capítulo «Cuánto puede cobrar una modelo y qué son los derechos de imagen».
  publicidad: { yt: YT.publicidad, start: 98, titulo: "El trabajo mejor pagado en el modelaje", etiqueta: "Clase · desde el 1:38" },
  mente: { yt: YT.mente, titulo: "Reprogramar tu mente también es parte del modelaje", etiqueta: "Clase · 6 min" },
};

function cuantoGana(start: number): ClaseBase {
  return {
    yt: YT.cuantoGana,
    start: start || undefined,
    titulo: "La verdad sobre cuánto gana una modelo, de principiante a profesional",
    etiqueta: start ? `Clase · desde el ${mmss(start)}` : "Clase · 9 min",
  };
}

const MENTE: Clase = {
  ...C.mente,
  porQueTitulo: "Por qué:",
  porQue: "la cabeza va antes que la técnica. Es el paso 1 del camino, empieces por donde empieces.",
};

// ── La clase 4: una chica que empezó donde tú ─────────────────────────────────
// Los minutos marcados con ≈ salen de la posición de la frase en la transcripción (±30 s) y
// arrancan 30 s antes para no cortarla. Hay que comprobarlos en el reproductor.
type ClaveCaso = "mar" | "frida" | "alba" | "kim" | "monica" | "laura" | "padres";
const CASOS: Record<ClaveCaso, ClaseBase & { semana: string }> = {
  // Entero: es el más corto de todos (5:39). Vende la formación, no la Comunidad.
  mar: {
    yt: "oP92cnKRY64",
    titulo: "Mar: llegó con cero experiencia y siguió el camino paso a paso",
    etiqueta: "Su historia · 6 min",
    semana: "Mar llegó con cero experiencia y fue paso a paso. Está en la clase 4 y son seis minutos: apunta qué hizo primero.",
  },
  // ≈18:41 «modelo mi propia ropa, pero no enseño mi cara».
  frida: {
    yt: "gV6qMJvgieQ",
    start: 1090,
    titulo: "Frida: ser madre y tener 30 años no le impidió modelar",
    etiqueta: "Su historia · desde el 18:10",
    semana: "Frida es madre de dos, tiene 30 años y no dejó que eso la frenara. Escúchala en la clase 4 y apunta qué hizo primero.",
  },
  // ≈17:54 «hice dos colaboraciones y a la tercera ya me pagaron». Provisional: ningún caso
  // publicado habla de negociar (videos.md §5, prioridad 1).
  alba: {
    yt: "Y579S4qK0BY",
    start: 1045,
    titulo: "Alba: de no atreverse a modelar a cobrar por su imagen",
    etiqueta: "Su historia · desde el 17:25",
    semana: "Alba no se atrevía ni a modelar. Escúchala en la clase 4 y apunta qué hizo primero.",
  },
  // ≈13:03 «muchos fotógrafos me hablan por Instagram y quieren colaborar conmigo… o marcas».
  kim: {
    yt: "RW784i33ILU",
    start: 755,
    titulo: "Kim: de cero a que la contraten marcas y a desfilar",
    etiqueta: "Su historia · desde el 12:35",
    semana: "Kim empezó de cero y muy insegura con las redes. Escúchala en la clase 4 y apunta qué hizo primero.",
  },
  // ≈0:30 «tengo 37 años». Desde el principio: se presenta enseguida.
  monica: {
    yt: "PWlRaa5xLs8",
    titulo: "Mónica: nunca es tarde para empezar como modelo y creadora UGC",
    etiqueta: "Su historia · 42 min",
    semana: "Mónica empezó con 37 años. Escúchala en la clase 4 y apunta qué hizo primero.",
  },
  // ≈0:52 «trabajo en administración y lo compagino un poco con el modelaje».
  laura: {
    yt: "LwOLf5d-TX8",
    titulo: "Laura: de no atreverse a hacerse fotos en la calle a desfilar",
    etiqueta: "Su historia · 17 min",
    semana: "Laura lo compagina con su trabajo. Escúchala en la clase 4 y apunta qué hizo primero.",
  },
  // Lo mismo que hace Sofi desde el 21-08 con las menores: el vídeo para que lo vean con sus padres.
  padres: {
    yt: YT.padres,
    titulo: "Para tus padres: cómo funciona esto hoy, contado por mí",
    etiqueta: "Para tus padres · 12 min",
    semana: "",
  },
};

type CasoElegido = { k: ClaveCaso; clase: Clase };

function caso(k: ClaveCaso, porQue: string, porQueTitulo = "Por qué ella:"): CasoElegido {
  const b = CASOS[k];
  return { k, clase: { yt: b.yt, start: b.start, titulo: b.titulo, etiqueta: b.etiqueta, porQueTitulo, porQue } };
}

/** El caso por parecido, nunca por espectacularidad (videos.md §3.4). Se aplica la primera
 *  regla que encaje; lo que la setter sepa por la conversación manda sobre esta tabla. */
function elegirCaso(
  kp: ClaveProblema,
  ko: ClaveObjetivo | null,
  kc: ClaveOcupacion | null,
  edad: number | null,
  menor: boolean,
): CasoElegido {
  if (menor)
    return caso(
      "padres",
      "como eres menor, este es para tus padres. Les cuento cómo funciona esto hoy, qué dudas suelen tener y qué aprenderías desde el primer día. Véanlo juntos.",
      "Por qué este:",
    );
  if (edad !== null && edad >= 35)
    return caso(
      "monica",
      "Mónica empezó con 37 años, siendo bailarina, y ahora es modelo y crea contenido UGC para marcas. Hay un mercado para cada persona, y no tienes que encajar en todos.",
    );
  if (edad !== null && edad >= 30)
    return caso(
      "frida",
      "Frida tiene 30 años y es madre de dos, y aun así empezó. Te la dejo en el momento en que cuenta cómo dejó de esconder la cara y empezaron a llamarla marcas.",
    );
  if ((kc === "cero" || kc === "colabora") && ko === "extra")
    return caso(
      "laura",
      "Laura trabaja en administración y lo compagina con el modelaje, que es justo lo que quieres hacer tú: un ingreso extra sin dejar lo tuyo.",
    );
  switch (kp) {
    case "marca":
      return caso(
        "frida",
        "Frida modelaba la ropa de su propio negocio sin enseñar la cara. Te la dejo en el momento en que lo cuenta: cuando empezó a mostrarse, empezaron a llamarla marcas.",
      );
    case "negociar":
      return caso(
        "alba",
        "Alba pasó de hacer colaboraciones gratis a cobrar por su trabajo. Te la dejo en el momento en que cuenta cómo fue ese salto.",
      );
    case "colaboraciones":
      return caso(
        "kim",
        "Kim era muy insegura con las redes, y ahora son fotógrafos y marcas quienes le escriben para colaborar. Te la dejo en el momento en que lo cuenta.",
      );
    default:
      return caso(
        "mar",
        "Mar llegó con cero experiencia y sin saber por dónde empezar, y siguió una hoja de ruta. Son seis minutos: escúchala entera.",
      );
  }
}

// ── La clase 2: a dónde vas ───────────────────────────────────────────────────
function claseObjetivo(ko: ClaveObjetivo | null): Clase {
  if (!ko)
    return {
      ...cuantoGana(0),
      porQueTitulo: "Por qué:",
      porQue: "para que sepas cuánto se paga en cada nivel, de la que empieza a la profesional, antes de ponerte una meta.",
    };
  const porQue: Record<ClaveObjetivo, string> = {
    extra:
      "marcaste un ingreso extra. Te la dejo en el nivel de la que empieza, y justo después viene el de la que ya tiene experiencia: ahí ves qué hace falta para dar el salto.",
    fuente:
      "quieres que esto sea tu primera fuente de ingresos. Te la dejo en el nivel de la modelo con experiencia, y después viene el de la profesional: ahí ves qué separa una de otra.",
    todo: "vas con todo, así que te la dejo en el nivel de la profesional. Justo después vienen los derechos de imagen, que es donde está ese nivel.",
  };
  return { ...cuantoGana(START_OBJETIVO[ko]), porQueTitulo: "Por qué:", porQue: porQue[ko] };
}

// Para una menor, la clase 2 no habla de cuánto se gana: es el mapa, o la marca personal si
// el mapa ya es su clase 1.
const MENOR_MAPA: Clase = {
  ...C.mapa,
  porQueTitulo: "Por qué:",
  porQue: "es el mapa: cómo funciona el modelaje hoy, de principio a fin. Para formarte con calma, sabiendo a dónde vas.",
};
const MENOR_MARCA: Clase = {
  ...C.marcaCorta,
  porQueTitulo: "Por qué:",
  porQue: "antes que el book, tu marca personal: cómo quieres que te vean. Se construye con calma, y cuanto antes la entiendas, mejor.",
};

// ── Por PROBLEMA ──────────────────────────────────────────────────────────────
// dijo: si sabemos qué problema marcó (si no, el contenido es el de «empezar», sin darlo por dicho).
type Ctx = { menor: boolean; dijo: boolean; ko: ClaveObjetivo | null; caso: CasoElegido };

type BloqueProblema = {
  h1: [string, string];
  chip: string;
  citaRespuesta: string;
  pasoInicio: number;
  donde: { titulo: [string, string]; parrafos: string[] };
  clases: (ctx: Ctx) => [Clase, Clase];
  pasos: (ctx: Ctx) => Paso[];
  remate: string;
};

const NIVEL = (ko: ClaveObjetivo | null) => (ko ? "en el nivel al que quieres llegar" : "en cada nivel");

// El paso de la semana que lleva a la clase 4. Para una menor, el vídeo de sus padres.
function pasoCaso(ctx: Ctx): Paso {
  if (ctx.menor)
    return {
      t: "Ve la clase 4 con tus padres",
      p: "Es un vídeo para ellos: les cuento cómo funciona esto por dentro y cómo trabajamos. Véanlo juntos, y desde hoy, cualquier propuesta que te llegue la ven ellos antes de que contestes.",
    };
  return { t: "Escucha a alguien que empezó donde tú", p: CASOS[ctx.caso.k].semana };
}

const POR_PROBLEMA: Record<ClaveProblema, BloqueProblema> = {
  empezar: {
    h1: ["se acabó", "adivinar."],
    chip: "«No sé por dónde empezar»",
    citaRespuesta: "Pues te la voy a dar. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 1,
    donde: {
      titulo: ["Hiciste lo más difícil", "en el orden equivocado."],
      parrafos: [
        "Has mirado, has probado cosas sueltas, y de tanto intento sin respuesta a lo mejor has llegado a pensar que esto no es para ti.",
        "Mira lo que pasa sin que nadie te lo diga: **casi todo el mundo entra por el paso 7 de un camino de 10.** Las fotos y la técnica van casi al final, y son lo primero que te enseñan a hacer. No fallaste tú. Falló el orden.",
      ],
    },
    clases: (ctx) => [
      {
        ...C.mapa,
        porQueTitulo: "Por qué la primera:",
        porQue: ctx.dijo
          ? "me pediste una guía paso a paso, y esto es el mapa: cómo funciona el modelaje hoy, de principio a fin."
          : "es el mapa: cómo funciona el modelaje hoy, de principio a fin. Por aquí se empieza.",
      },
      ctx.menor ? MENOR_MARCA : claseObjetivo(ctx.ko),
    ],
    pasos: (ctx) => [
      {
        t: "Empieza por la cabeza, no por las fotos",
        p: "Es el paso 1 del camino, y el que casi todas se saltan. Ve la clase 3 antes que nada: son seis minutos.",
      },
      {
        t: "Mira el mapa antes de moverte",
        p: ctx.menor
          ? "La clase 1 te enseña cómo funciona esto hoy, de principio a fin, y la 2, por qué tu marca personal va antes que el book. Así sabes a qué vas antes de gastar un euro en fotos."
          : `La clase 1 te enseña cómo funciona esto hoy, de principio a fin, y la 2, cuánto se paga ${NIVEL(ctx.ko)}. Así sabes a qué vas antes de gastar un euro en fotos.`,
      },
      pasoCaso(ctx),
    ],
    remate:
      "**Casi todo el mundo empieza por el paso 7.** Fotos y técnica antes que cabeza, orden, identidad, marca y voz. Por eso hay tanta chica con un book precioso y ninguna llamada. La técnica no falla: falla lo que tenía que venir antes. Tú ya no tienes ese problema: [[ya sabes el orden.]]",
  },
  marca: {
    h1: ["que te paguen", "por quién eres."],
    chip: "Quiere cobrar más por su marca",
    citaRespuesta: "Y tiene solución. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 4,
    donde: {
      titulo: ["Imagen ya tienes.", "Falta que se entienda."],
      parrafos: [
        "Haces trabajos, o estás cerca, pero cobras lo que te ofrecen y no lo que vale lo que haces. No es falta de talento: es que todavía no está claro, ni para ti ni para las marcas, **qué te hace distinta.**",
        "Eso tiene nombre: **marca personal.** Es el paso 4 de un camino de 10, y casi nadie llega a él porque se queda en el 7, creyendo que con mejores fotos le van a pagar más. No funciona así: **pagan más a quien saben por qué contratar.**",
      ],
    },
    clases: (ctx) => [
      {
        ...C.marcaCorta,
        porQueTitulo: "Por qué la primera:",
        porQue: "es tu pregunta: qué es la marca personal, por qué hoy pesa más que la foto y cinco pasos para construirla. Y en el paso 4 del camino tienes la clase en la que Carlos, el mentor de ese paso, y yo construimos mi perfil.",
      },
      ctx.menor ? MENOR_MAPA : claseObjetivo(ctx.ko),
    ],
    pasos: (ctx) => [
      {
        t: "Define qué te hace distinta",
        p: "Antes de tocar tu Instagram, escribe tres palabras que quieres que piense una marca al verte. La clase 1 te enseña por qué eso va antes que cualquier foto.",
      },
      {
        t: "Ordena tu perfil para que cuente lo mismo",
        p: "Biografía, destacadas y tus primeras fotos, contando esas tres palabras. Si una marca entra y en diez segundos no entiende quién eres, se va.",
      },
      ctx.menor
        ? pasoCaso(ctx)
        : {
            t: "Pon tu precio con argumentos",
            p: `Una tarifa base escrita, y de ahí no se baja. La clase 2 te cuenta cuánto se paga ${NIVEL(ctx.ko)}, para que tu precio no salga de la nada.`,
          },
    ],
    remate:
      "**Casi todo el mundo intenta cobrar más con mejores fotos.** Es el paso 7. Pero lo que sube tu tarifa está antes: que se entienda quién eres y por qué contratarte a ti. Tú ya sabes dónde está tu palanca: [[en tu marca.]]",
  },
  negociar: {
    h1: ["se acabó decir", "que sí a todo."],
    chip: "Le llegan propuestas",
    citaRespuesta: "Lo más difícil ya lo tienes: te escriben. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 8,
    donde: {
      titulo: ["Te escriben.", "Ahora toca cobrar bien."],
      parrafos: [
        "Te llegan propuestas, y eso es lo que la mayoría todavía no consigue. Pero cuando llega una, dudas: cuánto pedir, qué incluye, qué pasa con los derechos de uso, si aceptar un canje. Y por miedo a perderla, dices que sí a lo primero.",
        "Eso es el paso 8 del camino, **técnicas de casting:** presentarte, que te contraten, **cobrar bien y estar protegida legalmente.** Y casi nadie te lo cuenta entero.",
      ],
    },
    clases: (ctx) => [
      {
        ...C.publicidad,
        porQueTitulo: "Por qué la primera:",
        porQue: "es tu pregunta. Te la dejo en el minuto en que explico qué es una jornada, qué son los derechos de imagen y qué tienes que preguntar antes de aceptar un trabajo.",
      },
      ctx.menor ? MENOR_MAPA : claseObjetivo(ctx.ko),
    ],
    pasos: (ctx) => [
      {
        t: "Ten tu tarifa escrita antes de la próxima propuesta",
        p: ctx.menor
          ? "Una cifra por foto, otra por vídeo y otra por jornada, y aparte los derechos de uso, pensada con tus padres. Si la improvisas en el chat, pierdes."
          : `Una cifra por foto, otra por vídeo y otra por jornada, y aparte los derechos de uso. Si la improvisas en el chat, pierdes. La clase 2 te dice cuánto se paga ${NIVEL(ctx.ko)}.`,
      },
      {
        t: "Pregunta antes de contestar",
        p: ctx.menor
          ? "Qué uso le van a dar, durante cuánto tiempo, en qué países, si piden exclusividad y qué gastos van incluidos. Y que tus padres vean cada propuesta antes de que contestes. La clase 1 te da la lista entera."
          : "Qué uso le van a dar, durante cuánto tiempo, en qué países, si piden exclusividad y qué gastos van incluidos. Con esas respuestas, el precio sale solo. La clase 1 te da la lista entera.",
      },
      ctx.menor
        ? pasoCaso(ctx)
        : {
            t: "Si usan tu imagen en anuncios, se paga",
            p: "Un canje puede tener sentido para empezar. Unos derechos de uso, nunca gratis. La clase 1 te explica por qué la publicidad es el trabajo mejor pagado.",
          },
    ],
    remate:
      "**Casi todo el mundo cree que lo difícil es que te escriban.** Y lo difícil es lo que viene después: decir un precio y sostenerlo. Eso se aprende, y tiene su paso en el camino. Tú ya sabes dónde está tu palanca: [[en cómo negocias.]]",
  },
  colaboraciones: {
    h1: ["que trabajar no dependa", "de la suerte."],
    chip: "Quiere colaboraciones continuas",
    citaRespuesta: "Y se puede ordenar. **Todo lo que viene ahora está construido sobre lo que me contaste.**",
    pasoInicio: 4,
    donde: {
      titulo: ["Colaboras a veces.", "Falta que sea siempre."],
      parrafos: [
        "Te sale un trabajo, luego nada durante semanas, y vuelta a empezar. No es mala suerte: es que tus colaboraciones dependen de que alguien te encuentre, y no de **un sistema que haga que te encuentren.**",
        "Ese sistema son tres pasos del camino: **marca personal (4), redes sociales (6) y UGC (9).** Cuando están en orden, las marcas empiezan a llegar, y puedes elegir con quién trabajar.",
      ],
    },
    // Aquí la clase de «cuánto gana» es la 1, en el capítulo de versatilidad, y la 2 es la de
    // marca personal: un vídeo no se repite.
    clases: (ctx) => [
      ctx.menor
        ? MENOR_MAPA
        : {
            ...cuantoGana(START_VERSATILIDAD),
            porQueTitulo: "Por qué la primera:",
            porQue: ctx.ko
              ? `te la dejo en el minuto que va de lo tuyo: no depender de una sola vía para que el trabajo no pare. Y si quieres ver cuánto se paga en el nivel que marcaste, vuelve al ${mmss(START_OBJETIVO[ctx.ko])}.`
              : "te la dejo en el minuto que va de lo tuyo: no depender de una sola vía para que el trabajo no pare.",
          },
      {
        ...C.marcaCorta,
        porQueTitulo: "Por qué:",
        porQue: "lo que hace que las marcas te escriban a ti, y no a otra, es tu marca personal. Corta y al grano.",
      },
    ],
    pasos: (ctx) => [
      {
        t: "No dependas de una sola vía",
        p: ctx.menor
          ? "E-commerce, UGC, publicidad: hay muchas formas de trabajar con marcas, y conviene conocerlas todas antes de elegir. La clase 1 te enseña el mapa entero."
          : "E-commerce, UGC, publicidad: cuantas más formas de trabajar con marcas tengas, menos depende cada mes de la suerte. La clase 1 empieza justo ahí.",
      },
      {
        t: "Publica pensando en las marcas",
        p: "Cada publicación tiene que enseñar algo que una marca pueda comprar: cómo luces su producto, cómo lo cuentas. Tu perfil es tu portafolio, y la clase 2 te explica por qué tu marca personal va antes que todo esto.",
      },
      ctx.menor
        ? pasoCaso(ctx)
        : {
            t: "Escribe a 50 marcas esta semana",
            p: "No esperes a que te encuentren. Mínimo 50 marcas, y si llegas a 100, mejor: cuantas más escribas, más te contestan. Un mensaje corto y tu perfil ordenado. Las primeras dan vergüenza; a la décima ya no. Y es la mejor prueba de que vas en serio.",
          },
    ],
    remate:
      "**Casi todo el mundo busca la siguiente colaboración de una en una.** Por eso un mes hay y otro no. Lo que hace que no paren es un sistema: marca, contenido y una forma de cobrar que no dependa de seguidores. Tú ya sabes dónde está tu palanca: [[en tu sistema.]]",
  },
};

// ── Por OBJETIVO ──────────────────────────────────────────────────────────────
// {cn} = el número de la clase de «cuánto gana una modelo» en su plan (la 2, o la 1 si su
// problema es «colaboraciones»). No se promete ninguna cifra: las dice Ari en la clase.
type BloqueObjetivo = { chip: string; titulo: [string, string]; parrafos: string[] };
const POR_OBJETIVO: Record<ClaveObjetivo, BloqueObjetivo> = {
  extra: {
    chip: "Quiere un ingreso extra",
    titulo: ["Un ingreso extra,", "sin dejar lo tuyo."],
    parrafos: [
      "Ese es el objetivo que marcaste: **de 1.000 € a 2.000 € al mes con tu imagen.** No te voy a prometer una cifra, porque depende de ti: de tu constancia y del tiempo que le dediques. Lo que sí te digo es que ese mercado existe, y en la clase {cn} te cuento cuánto se paga en cada nivel.",
      "Para eso no hace falta más tiempo: hace falta **hacer en orden lo que ya tienes.** Eso es lo que tienes debajo. Y al final del camino está la salida: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas.",
    ],
  },
  fuente: {
    chip: "Quiere vivir de esto",
    titulo: ["Que sea tu primera fuente", "de ingresos."],
    parrafos: [
      "Ese es el objetivo que marcaste: **de 2.000 € a 5.000 € al mes con tu imagen y tu marca personal.** Ese mercado existe, y no busca un único tipo de chica: busca a la que llega preparada. En la clase {cn} te cuento cuánto se paga en cada nivel.",
      "Lo que te faltaba no era mercado. Era **saber qué preparar antes de presentarte, y en qué orden.** No es de un día para otro: lleva tiempo y disciplina, y eso es lo que tienes debajo. Y al final del camino, la salida: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas.",
    ],
  },
  todo: {
    chip: "Va con todo",
    titulo: ["Vas con todo.", "Y se nota."],
    parrafos: [
      "Marcaste **más de 5.000 € al mes.** Ese nivel existe: campañas, derechos de uso, contratos con marcas, representación. Pero no se llega saltando pasos ni de un día para otro: se llega con **una marca que las marcas reconocen y alguien que negocie por ti.**",
      // Sin «Eso es…»: entre este párrafo y el anterior entra la línea de su ocupación.
      "Y al final de tu camino está **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas. En la clase {cn} te dejo el nivel de la profesional, y todo lo que tienes debajo es lo que te pone en esa puerta.",
    ],
  },
};

// Si no sabemos su objetivo: sin cifra.
const SIN_OBJETIVO: BloqueObjetivo = {
  chip: "",
  titulo: ["Un camino", "con salida al final."],
  parrafos: [
    // «a partir del 1:50»: el capítulo de la principiante (START_OBJETIVO.extra). En «colaboraciones»
    // esa clase arranca en el 5:45, y los niveles quedan antes.
    "Primero hay que saber cómo funciona esto, y luego ponerse una meta. En la clase {cn}, a partir del 1:50, te cuento cuánto se paga en cada nivel, de la que empieza a la profesional, para que la tuya tenga los pies en la tierra.",
    "Lo que sí te digo es que el camino tiene salida: **AR Agency, nuestra agencia internacional,** que representa a las alumnas cuando están preparadas. Todo lo que tienes debajo es lo que te lleva hasta ahí.",
  ],
};

// Menor de edad: nada de ingresos. Formarse con calma, y con su familia.
function adondeMenor(edad: number | null): BloqueObjetivo {
  return {
    chip: "",
    titulo: ["Fórmate con calma,", "y en familia."],
    parrafos: [
      `${edad !== null ? `Tienes ${edad} años, y aquí` : "Aquí"} nadie te va a meter prisa. Ahora toca **formarte con calma:** tu cabeza, tu imagen, cómo te presentas. Lo demás llega después, y llega mejor cuando esto está hecho. Al final del camino, cuando estés preparada, está **AR Agency, nuestra agencia internacional.**`,
      "Y esto se hace **con tu familia, no a escondidas.** Enséñales este plan a tus padres y vean juntos la clase 4, que es para ellos. Que sepan qué vas a hacer y con quién.",
    ],
  };
}

// ── Por OCUPACIÓN ─────────────────────────────────────────────────────────────
const POR_OCUPACION: Record<ClaveOcupacion, { chip: string; linea: string; organiza: string }> = {
  vive: {
    chip: "Ya vive de su imagen",
    linea: "Ya vives de tu imagen, y eso es mucho camino hecho. Ahora toca **ordenarlo, para que crezca y lo cobres como vale.**",
    organiza: "con las sesiones y los encargos que ya tienes.",
  },
  colabora: {
    chip: "Trabaja y ya colabora",
    linea: "Ya tienes un pie dentro con tus colaboraciones. Ahora toca que **dejen de ser sueltas.**",
    organiza: "con tu trabajo y tus colaboraciones.",
  },
  cero: {
    chip: "Trabaja por cuenta ajena",
    linea: "Trabajas por cuenta ajena, así que tu tiempo cuenta: este plan está pensado para empezar **sin dejar tu trabajo.**",
    organiza: "con las horas que te deja tu trabajo.",
  },
  estudia: {
    chip: "Estudia",
    linea: "Estudias, y eso juega a tu favor: **ya sabes lo que es aprender con constancia**, y aquí es justo lo que hace falta.",
    organiza: "con tus clases y tus exámenes.",
  },
  nada: {
    chip: "Puede dedicarle tiempo",
    linea: "Ahora mismo tienes algo que muchas no tienen: **tiempo para dedicarle de verdad.**",
    organiza: "para que el tiempo que tienes rinda.",
  },
};

// ── La ruta de 10 pasos (fija; cambia por dónde empieza y el final del paso 2) ──
function ruta(inicio: number, kc: ClaveOcupacion | null): PasoRuta[] {
  const organiza = kc ? POR_OCUPACION[kc].organiza : "con todo lo que ya tienes encima.";
  const pasos: PasoRuta[] = [
    {
      n: "01",
      nombre: "Mentalidad",
      porQue: "La cabeza antes que la técnica. Sin esto, cada silencio se convierte en un veredicto sobre ti, y ya sabes cómo acaba eso.",
      mentora: "Con **Flor Caminero**",
      // La clase 3 es siempre la de mentalidad. Y la de Flor, para ver por dentro a la mentora.
      clases: [
        { texto: "La tienes arriba · clase 3", ancla: true },
        { texto: "Clase de Flor · mentalidad · 1 h", yt: "DOq5-LsbM7s" },
      ],
    },
    {
      n: "02",
      nombre: "Organización",
      porQue: `Marcaste «cuanto antes». Aquí es donde ese «ya» se convierte en calendario: tu tiempo, ordenado para que el plan se cumpla, ${organiza}`,
      mentora: "Con **Victoria Poggioli**",
      // La clase de Victoria en su canal, desde el 7:58 (Carlos, 08-10).
      clases: [{ texto: "¿Cómo definir tus metas y objetivos en 2026? · desde el 7:58", yt: "Y7Qs_G8TRX0", start: 478 }],
    },
    {
      n: "03",
      nombre: "Imagen y estilismo",
      porQue: "Quién eres tú delante de una cámara, antes de ponerte delante de una. Tu imagen habla antes de que tú lo hagas.",
      mentora: "Con **Jazmín Pérez**",
      // La ponencia de Jazmín, en el canal de la academia (la eligió Carlos).
      clases: [{ texto: "Ponencia de Jazmín · estilismo · 11 min", yt: "SprugSv8TZQ" }],
    },
    {
      n: "04",
      nombre: "Marca personal",
      porQue: "Que las marcas te encuentren a ti, confíen en ti y te paguen más por ello. Aquí se construye.",
      mentora: "Con **Carlos Correa**",
      // La clase con Carlos y Ari en la que analizan y construyen el perfil de Ari, en su
      // canal (Carlos, 08-10: sustituye a la ponencia de Carlos, lwf_1F7kXjo).
      clases: [{ texto: "Cómo Construir Tu Marca Personal como Modelo desde Cero (Clase Completa) · 44 min", yt: "PHyImmNq_oE" }],
    },
    {
      n: "05",
      nombre: "Oratoria",
      porQue: "Comunicar bien en castings, eventos y redes. De esto dependen tus relaciones, tus contactos y tus oportunidades.",
      mentora: "Con **Angélica Triana**",
      // Pendiente: una clase de Angélica (Carlos, 07-10: solo de la mentora de cada paso).
      clases: [],
    },
    {
      n: "06",
      nombre: "Redes sociales",
      porQue: "Todo lo anterior, llevado a tu contenido: perder el miedo a la cámara, crear, editar, publicar. Es donde miran las marcas.",
      mentora: "Con **Pierina Alves**",
      clases: [{ texto: "Charla · ¿Se puede vivir de las redes? · 75 min", yt: "f2sdsrpO1C0" }],
    },
    {
      n: "07",
      nombre: "Pasarela y fotopose",
      porQue: "La técnica. Es donde casi todas empiezan, con un book por delante y seis pasos por detrás sin hacer. Ahora sí le toca.",
      mentora: "Con **Arianny** y **Mili Wirtz**",
      clases: [
        { texto: "Domina la pasarela · 6 min", yt: "uxNjzq3DRrg" },
        { texto: "Posado para marcas · ZARA · 5 min", yt: "oXrZwDEh2Q4" },
      ],
      entraTodoElMundo: true,
    },
    {
      n: "08",
      nombre: "Técnicas de casting",
      porQue: "Presentarte, que te contraten, cobrar bien y estar protegida legalmente. Lo que casi nadie te cuenta, contado entero.",
      mentora: "Con **Arianny** y **Mili Wirtz**",
      clases: [{ texto: "Errores que te hacen perder un casting · 10 min", yt: "M5yvR_AKbUo" }],
    },
    {
      n: "09",
      nombre: "UGC",
      porQue: "Otra vía de cobrar de las marcas, cada vez más pedida. Tu mentora vuelve a ser Pierina: la charla del paso 6 cubre también esta parte.",
      mentora: "Con **Pierina Alves**",
      clases: [],
    },
    {
      n: "10",
      nombre: "AR Agency",
      porQue: "Cuando el equipo se cerciora de que estás formada y preparada, nuestra agencia internacional te representa: castings de campaña, revistas, pasarela, contenido. **Y durante todo el camino, acompañada por el equipo.** Por eso esto no es otro curso.",
      mentora: "Nuestra **agencia internacional** · te representamos nosotros",
      clases: [{ texto: "Una agencia sin estereotipos · 14 min", yt: "C8eHs2rVncc" }],
      final: true,
    },
  ];
  return pasos.map((p) => ({ ...p, empieza: +p.n === inicio && inicio !== 10 }));
}

// ── El caso de alumna con foto (bloque 06; vacío: el caso va en la clase 4) ───
export const CASO_POR_PROBLEMA: Partial<Record<ClaveProblema, Caso>> = {};

// El vídeo del bloque final de la formación: el plan contado por Ari, que acaba pidiendo ACCESO.
// El vídeo del bloque final. Hasta el 07-10 era «Los pasos exactos para vivir del modelaje»
// (xlwRBX-JLBM): contaba la ruta antigua y hablaba de «lista de espera». Carlos lo quitó: va
// el vídeo nuevo de la oferta (la ruta, cómo se trabaja, las dos modalidades y cómo se paga)
// cuando esté grabado. Mientras, el bloque final va sin vídeo.
const VIDEO_ACCESO: Video | null = null;

// ── Armar el plan ─────────────────────────────────────────────────────────────
export function armarPlan(
  f: Ficha,
  token: string,
  opts: { previa: boolean; cierre: "formacion" | "comunidad" },
): PlanArmado {
  const rp = clave(PROBLEMA, f.dolor, PISTAS_PROBLEMA);
  const ro = clave(OBJETIVO, f.objetivo, PISTAS_OBJETIVO);
  const rc = clave(OCUPACION, f.ocupacion, PISTAS_OCUPACION);
  const kp: ClaveProblema = rp?.k ?? "empezar";
  const kc = rc?.k ?? null;
  const edad = typeof f.edad === "number" && Number.isFinite(f.edad) ? Math.round(f.edad) : null;
  // Menor de edad: sin cifras de ingresos y con el cierre de la Comunidad (negocio.md §5:
  // a la menor se le vende la Comunidad, con sus padres en la llamada de bienvenida).
  // Si la edad no está en la ficha, vale la etiqueta `menor de edad` (la pone el formulario o Sofi).
  const menor =
    edad !== null ? edad < 18 : f.tags.some((t) => t.trim().toLowerCase() === "menor de edad");
  const ko = menor ? null : (ro?.k ?? null);
  const bp = POR_PROBLEMA[kp];

  const ctx: Ctx = { menor, dijo: !!rp, ko, caso: elegirCaso(kp, ko, kc, edad, menor) };
  const clases: Clase[] = [...bp.clases(ctx), MENTE, ctx.caso.clase];

  const bo = menor ? adondeMenor(edad) : ko ? POR_OBJETIVO[ko] : SIN_OBJETIVO;
  const cn = clases.findIndex((c) => c.yt === YT.cuantoGana) + 1;
  // Si esa clase no está en su plan (no debería pasar fuera de las menores), la frase se cae.
  const conClase = (s: string) =>
    cn
      ? s.replace(/\{cn\}/g, String(cn))
      : s
          .split(". ")
          .filter((x) => !x.includes("{cn}"))
          .join(". ");
  const adonde = {
    titulo: bo.titulo,
    parrafos: (kc ? [bo.parrafos[0], POR_OCUPACION[kc].linea, ...bo.parrafos.slice(1)] : bo.parrafos).map(conClase),
  };

  const pais = f.pais && !/^otro/i.test(f.pais) ? f.pais.replace(/^Resto de Europa$/, "Europa") : "";
  const chips = [
    pais,
    edad !== null && edad >= 10 && edad <= 99 ? `${edad} años` : "",
    kc ? POR_OCUPACION[kc].chip : "",
    rp ? bp.chip : "",
    bo.chip,
  ].filter(Boolean);

  // La cita solo si es, letra por letra, una de las opciones: nunca se inventa.
  const cita = rp?.exacta ? PROBLEMA[kp] : "";

  return {
    token,
    previa: opts.previa,
    cierre: menor ? "comunidad" : opts.cierre,
    menor,
    urlComunidad: "https://www.ariannyrivasacademy.com/comunidad",
    nombre: f.nombre || "",
    h1: bp.h1,
    chips,
    cita,
    citaRespuesta: cita ? bp.citaRespuesta : "",
    pasoInicio: bp.pasoInicio,
    donde: bp.donde,
    adonde,
    pasos: bp.pasos(ctx),
    clases,
    ruta: ruta(bp.pasoInicio, kc),
    remate: bp.remate,
    caso: CASO_POR_PROBLEMA[kp] ?? null,
    videoAcceso: menor ? null : VIDEO_ACCESO,
  };
}

// ── Qué cierre lleva su plan ──────────────────────────────────────────────────
// Carlos, 2026-10-07: las menores de 18 van directas a la Comunidad. El resto, formación
// (palabra ACCESO) por defecto; si al prospectarla la setter ve que encaja mejor la
// Comunidad, manda el otro enlace de la nota. Sin reglas por dinero ni por país: «el
// dinero no califica ni descalifica» (criterio de Carlos). La regla de los 24 años del
// SOP no se aplica al plan.
export function cierreRecomendado(d: { edad: number | null }): "formacion" | "comunidad" {
  return d.edad !== null && d.edad < 18 ? "comunidad" : "formacion";
}
