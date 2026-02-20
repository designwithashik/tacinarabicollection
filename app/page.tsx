export const runtime = 'edge';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import HomeClient from "./HomeClient";
import type { Metadata } from "next";

const siteUrl = "https://tacinarabicollection.vercel.app";

export const metadata: Metadata = {
  title: "Buy Kurti & Women Fashion Online in Bangladesh",
  description:
    "Shop premium kurti collections, modest fashion essentials, and ceramics with fast WhatsApp ordering, nationwide Bangladesh delivery, and secure COD/bKash/Nagad payments.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tacin Arabi Collection",
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-192.svg`,
    sameAs: ["https://wa.me/8801522119189"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+8801522119189",
        contactType: "customer service",
        areaServed: "BD",
        availableLanguage: ["en", "bn"],
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tacin Arabi Collection",
    url: siteUrl,
    inLanguage: ["en-BD", "bn-BD"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomeClient />
    </>
  );
}
