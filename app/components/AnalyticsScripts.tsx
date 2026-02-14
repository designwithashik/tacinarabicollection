"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { CONSENT_UPDATED_EVENT, getConsentState } from "../../lib/consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;

export default function AnalyticsScripts() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const syncConsent = () => setHasConsent(getConsentState() === "granted");
    syncConsent();
    window.addEventListener(CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, syncConsent);
  }, []);

  const canLoadGtm = useMemo(() => Boolean(hasConsent && GTM_ID), [hasConsent]);
  const canLoadGa = useMemo(() => Boolean(hasConsent && GA_ID), [hasConsent]);
  const canLoadHotjar = useMemo(() => Boolean(hasConsent && HOTJAR_ID), [hasConsent]);

  return (
    <>
      {canLoadGtm ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});`}
          </Script>
          <Script
            id="gtm-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
          />
        </>
      ) : null}

      {canLoadGa ? (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}window.gtag = gtag;gtag('js', new Date());gtag('config', '${GA_ID}');`}
          </Script>
        </>
      ) : null}

      {canLoadHotjar ? (
        <Script id="hotjar-init" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${HOTJAR_ID},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      ) : null}
    </>
  );
}
