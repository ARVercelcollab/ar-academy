"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasConsentedCookies } from "./CookieBanner";

export default function MetaPixel() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsentedCookies());

    // Listen for consent changes
    const checkConsent = () => setConsented(hasConsentedCookies());
    window.addEventListener("click", checkConsent);
    return () => window.removeEventListener("click", checkConsent);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1613484133037939');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1613484133037939&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
}
