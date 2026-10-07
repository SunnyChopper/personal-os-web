'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { getGardenGaMeasurementId, gardenPageview, GA_SURFACE } from '@/lib/analytics';

export function GoogleAnalytics() {
  const measurementId = getGardenGaMeasurementId();
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId) return;
    gardenPageview(pathname);
  }, [measurementId, pathname]);

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false,
            anonymize_ip: true,
            surface: '${GA_SURFACE}'
          });
        `}
      </Script>
    </>
  );
}
