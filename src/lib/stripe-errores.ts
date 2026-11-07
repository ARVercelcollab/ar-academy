// Lo que dice Stripe cuando rechaza un cobro, en el idioma de ella: «Your card has insufficient
// funds» no se le enseña así. Lo usan /api/plan/pago y /api/create-subscription (workshop).
export function mensajeDeError(e: { code?: string; decline_code?: string; type?: string }): string {
  const c = e.decline_code || e.code || "";
  if (c === "insufficient_funds") return "Tu tarjeta no tiene saldo suficiente. Prueba con otra.";
  if (c === "expired_card") return "La tarjeta está caducada. Prueba con otra.";
  if (c === "incorrect_cvc" || c === "invalid_cvc") return "El código de seguridad (CVC) no es correcto.";
  if (c === "authentication_required")
    return "Tu banco pide una verificación que no se ha podido completar. Prueba otra vez o con otra tarjeta.";
  if (e.type === "StripeCardError" || c === "card_declined" || c === "do_not_honor" || c === "generic_decline")
    return "Tu banco ha rechazado el pago. Prueba con otra tarjeta o consulta con tu banco.";
  return "No hemos podido completar el pago. Inténtalo de nuevo en un momento.";
}
