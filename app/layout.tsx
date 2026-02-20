import "./globals.css";
import type { Metadata } from "next";
import GlobalAnimatedWrapper from "../components/AnimatedWrapper";

export const metadata: Metadata = {
  title: {
    default: "Tacin Arabi Collection Bangladesh | Buy Kurti, Fashion & Ceramic Online",
    template: "%s | Tacin Arabi Collection",
  },
  description:
    "Shop women's fashion, kurti collections, and ceramic home pieces online in Bangladesh. Enjoy WhatsApp ordering, cash on delivery, and secure bKash/Nagad payment support with nationwide delivery.",
  keywords: [
    "Tacin Arabi Collection",
    "online shopping Bangladesh",
    "kurti online Bangladesh",
    "women fashion Bangladesh",
    "ceramic products Bangladesh",
    "WhatsApp shopping Bangladesh",
    "cash on delivery Bangladesh",
    "bKash Nagad payment",
  ],
  metadataBase: new URL("https://tacinarabicollection.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tacin Arabi Collection Bangladesh | WhatsApp Fashion Shopping",
    description:
      "Discover trending kurti, modest fashion, and ceramic lifestyle picks in Bangladesh with fast WhatsApp checkout, COD, and secure bKash/Nagad payments.",
    url: "https://tacinarabicollection.vercel.app",
    siteName: "Tacin Arabi Collection",
    locale: "en_BD",
    alternateLocale: ["bn_BD"],
    type: "website",
    images: [{ url: "/images/og-cover.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tacin Arabi Collection Bangladesh | Shop Fashion via WhatsApp",
    description:
      "Buy kurti, fashion essentials, and ceramics online in Bangladesh with nationwide delivery and fast WhatsApp order support.",
    images: ["/images/og-cover.svg"],
    site: "@tacinarabi",
    creator: "@tacinarabi",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#8a4b3c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-BD">
      <body><GlobalAnimatedWrapper>{children}</GlobalAnimatedWrapper></body>
    </html>
  );
}
