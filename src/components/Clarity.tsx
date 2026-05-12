"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasConsentedCookies } from "./CookieBanner";

export default function Clarity() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsentedCookies());

    const checkConsent = () => setConsented(hasConsentedCookies());
    window.addEventListener("click", checkConsent);
    return () => window.removeEventListener("click", checkConsent);
  }, []);

  if (!consented) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "wpzmtcwawd");
      `}
    </Script>
  );
}
