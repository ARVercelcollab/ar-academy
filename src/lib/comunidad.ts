// El precio de la Comunidad (Carlos, 2026-10-24): 99 € hasta Black Friday y 199 € desde el
// 1-12-2026 a las 00:00 de Madrid. Todo lo de /comunidad sale de aquí: la página se rehace cada
// minuto (revalidate en page.tsx) y el cobro mira la misma fecha, así que el cambio llega solo.
export const SUBIDA_COMUNIDAD = Date.UTC(2026, 10, 30, 23, 0, 0); // 1-12-2026 00:00 en Madrid

// El cobro respeta los 99 € media hora más: la página puede tardar un poco en rehacerse y nadie
// debe pagar más de lo que vio.
export const MARGEN_COBRO_MS = 30 * 60 * 1000;

export function precioComunidad(ahora: number = Date.now()) {
  const subio = ahora >= SUBIDA_COMUNIDAD;
  return { euros: subio ? 199 : 99, subio };
}
