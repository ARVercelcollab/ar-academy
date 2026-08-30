declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

/**
 * `eventId` es la clave de la DEDUPLICACIÓN. El mismo registro se manda dos veces —una desde
 * el navegador y otra desde nuestro servidor, que es la que llega siempre— y Meta las une en
 * una sola conversión si comparten este id. Sin él contaría dos.
 */
export function trackEvent(
  event: string,
  data?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventId) window.fbq("track", event, data, { eventID: eventId });
    else window.fbq("track", event, data);
  }
}

/** Lee una cookie del navegador. Para `_fbp` y `_fbc`, que mejoran mucho el emparejamiento. */
export function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(^| )" + nombre + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : undefined;
}

// Events we track:
// - PageView: automatic on every page load
// - ViewContent: when user scrolls to key sections
// - Lead: when user completes step 1 (registration) — SOLO Comunidad
// - CompleteRegistration: registro de la MASTERCLASS. Evento propio a propósito:
//   compartir `Lead` con la Comunidad mezclaba las dos señales y Meta optimizaba
//   hacia la más barata, que no es la que queremos.
// - InitiateCheckout: when user enters step 2 (payment)
// - Purchase: when payment succeeds
// - AddToCart: when user clicks any CTA button
