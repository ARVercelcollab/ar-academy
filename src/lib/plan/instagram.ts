/**
 * Su ficha de Instagram, a partir del @ que escribe en el formulario del plan (2026-10-12).
 *
 * El formulario solo emparejaba por correo y teléfono, y la ficha de Instagram no tiene
 * ninguno de los dos: medido ese día, 10 de 56 chicas del plan tenían su ficha de Instagram
 * aparte, con la conversación y la tarjeta de Captación, y otra ficha nueva con el plan. El
 * @ es lo único que tienen en común.
 */

// El @ desnudo, escriba lo que escriba: `@Maria_Rivas`, `instagram.com/maria_rivas/?hl=es`
// → `maria_rivas`. La misma regla que `normaliza_handle` del backend de Sofi (quiz.py).
export function normalizaHandle(v: unknown): string {
  let t = String(v ?? "").trim();
  const i = t.toLowerCase().indexOf("instagram.com");
  if (i >= 0) t = t.slice(i + "instagram.com".length).replace(/^\/+/, "").split("?")[0].split("/")[0];
  return t
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export type Candidata = {
  id: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
  customFields?: { id: string; value?: unknown }[];
};

// De lo que devuelve la búsqueda de GHL, la ficha que es suya, o null.
//
// Solo cuenta una coincidencia EXACTA del @ con el nombre de la ficha (GHL guarda a veces el
// @ como nombre) o con su campo `ig_handle`. Si hay más de una, gana la que lleva la etiqueta
// de su cuenta de Instagram; si sigue habiendo duda, ninguna: mejor una ficha de más, que se
// fusiona a mano, que escribir el plan de una chica en la ficha de otra.
export function elegirFicha(lista: Candidata[], ig: string, campoIg: string): Candidata | null {
  const h = normalizaHandle(ig);
  if (h.length < 3) return null;
  const suyas = lista.filter((c) =>
    [
      c.firstName,
      c.contactName,
      `${c.firstName ?? ""}${c.lastName ?? ""}`,
      c.customFields?.find((f) => f.id === campoIg)?.value,
    ].some((v) => normalizaHandle(v) === h),
  );
  if (suyas.length <= 1) return suyas[0] ?? null;
  const deCuenta = suyas.filter((c) => (c.tags ?? []).some((t) => t.startsWith("cuenta ")));
  return deCuenta.length === 1 ? deCuenta[0] : null;
}
