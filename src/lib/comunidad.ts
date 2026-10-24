// Lo que vende /comunidad y a qué precio (Carlos, 2026-10-24). En noviembre, el workshop «Posa para
// marcas» del martes 24-11 con la Comunidad para siempre; desde el 1-12, la Comunidad sola.
//
//   hasta el 16-11 23:59 de Madrid → el workshop en directo + la Comunidad · 99 €
//   del 17-11 al 24-11            → lo mismo · 149 €
//   del 25-11 al 30-11            → la grabación del workshop + la Comunidad · 149 €
//   desde el 1-12                 → la Comunidad sola · 199 €
//
// Todo sale de aquí: la página del workshop pregunta la fase a /api/comunidad/oferta, el cobro
// (/api/create-subscription) elige el precio con la misma fecha y src/proxy.ts decide qué página se
// ve en /comunidad. Las horas van en UTC: noviembre en Madrid es UTC+1.
export const SUBIDA_WORKSHOP = Date.UTC(2026, 10, 16, 23, 0, 0); // 17-11-2026 00:00 en Madrid
export const FIN_DIRECTO = Date.UTC(2026, 10, 24, 23, 0, 0); // 25-11-2026 00:00 en Madrid
export const SUBIDA_COMUNIDAD = Date.UTC(2026, 10, 30, 23, 0, 0); // 1-12-2026 00:00 en Madrid

// El directo: martes 24-11-2026 a las 20:00 de Madrid.
export const DIRECTO = Date.UTC(2026, 10, 24, 19, 0, 0);

// El cobro respeta el precio anterior media hora más: la página puede tardar un poco en enterarse
// y nadie debe pagar más de lo que vio.
export const MARGEN_COBRO_MS = 30 * 60 * 1000;

export type Fase = "workshop" | "grabacion" | "comunidad";

export function faseComunidad(ahora: number = Date.now()): Fase {
  if (ahora < FIN_DIRECTO) return "workshop";
  if (ahora < SUBIDA_COMUNIDAD) return "grabacion";
  return "comunidad";
}

export function precioComunidad(ahora: number = Date.now()) {
  const euros = ahora < SUBIDA_WORKSHOP ? 99 : ahora < SUBIDA_COMUNIDAD ? 149 : 199;
  return { euros, subio: ahora >= SUBIDA_COMUNIDAD, fase: faseComunidad(ahora) };
}

// Lo que se cobra: lo mismo, con el margen.
export function cobroComunidad(ahora: number = Date.now()) {
  return precioComunidad(ahora - MARGEN_COBRO_MS);
}

// La marca de la oferta en la factura de Stripe (metadata.oferta). La que mira /api/stripe-webhook
// para meterla en el grupo del workshop. La de «producto» no cambia: es la que da Skool.
export const OFERTA: Record<Fase, string> = {
  workshop: "workshop-24-11",
  grabacion: "grabacion-workshop-24-11",
  comunidad: "comunidad",
};

export function esDelWorkshop(oferta: string | undefined | null) {
  return oferta === OFERTA.workshop || oferta === OFERTA.grabacion;
}
