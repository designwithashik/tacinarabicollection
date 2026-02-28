export const dynamic = "force-dynamic";
export const revalidate = 0;

import HomeClient from "./HomeClient";
import type { AdminProduct } from "../lib/inventory";
import {
  loadInventoryArray,
  toStorefrontProduct,
} from "@/lib/server/inventoryStore";
import type { Metadata } from "next";
import type {
  AnnouncementContent,
  CarouselItem,
  FilterPanelItem,
} from "@/lib/siteContent";

const siteUrl = "https://tacinarabicollection.vercel.app";

export const metadata: Metadata = {
  title: "Buy Kurti & Women Fashion Online in Bangladesh",
  description:
    "Shop premium kurti collections, modest fashion essentials, and ceramics with fast WhatsApp ordering, nationwide Bangladesh delivery, and secure COD/bKash/Nagad payments.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  let initialAdminProducts: AdminProduct[] = [];
  let initialAnnouncement: AnnouncementContent = { text: "", active: true };
  let initialCarouselSlides: CarouselItem[] = [];
  let initialFilters: FilterPanelItem[] = [];

  try {
    const products = await loadInventoryArray();
    initialAdminProducts = products.map(toStorefrontProduct) as AdminProduct[];
  } catch {
    initialAdminProducts = [];
  }

  try {
    const [carouselRes, announcementRes, filtersRes] = await Promise.all([
      fetch(`${siteUrl}/api/content/carousel`, { cache: "no-store" }),
      fetch(`${siteUrl}/api/content/announcement`, { cache: "no-store" }),
      fetch("/api/content/filters", { cache: "no-store" }),
    ]);

    if (carouselRes.ok) {
      initialCarouselSlides = (await carouselRes.json()) as CarouselItem[];
    }

    if (announcementRes.ok) {
      initialAnnouncement =
        (await announcementRes.json()) as AnnouncementContent;
    }

    if (filtersRes.ok) {
      initialFilters = (await filtersRes.json()) as FilterPanelItem[];
    }
  } catch {
    initialCarouselSlides = [];
    initialAnnouncement = { text: "", active: true };
    initialFilters = [];
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tacin Arabi Collection",
    url: siteUrl,
    logo: `${siteUrl}/images/tacin-logo.svg`,
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
      <HomeClient
        initialAdminProducts={initialAdminProducts}
        initialCarouselSlides={initialCarouselSlides}
        initialAnnouncement={initialAnnouncement}
        initialFilters={initialFilters}
      />
    </>
  );
}
