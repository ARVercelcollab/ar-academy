declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, data);
  }
}

// Events we track:
// - PageView: automatic on every page load
// - ViewContent: when user scrolls to key sections
// - Lead: when user completes step 1 (registration)
// - InitiateCheckout: when user enters step 2 (payment)
// - Purchase: when payment succeeds
// - AddToCart: when user clicks any CTA button
