import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import type { Metadata } from "next";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Tacin Arabi Collection | WhatsApp-first Shopping",
  description:
    "A lightweight, mobile-first commerce landing page for Bangladesh with fast checkout via WhatsApp.",
  themeColor: "#8a4b3c",
  metadataBase: new URL("https://tacinarabicollection.vercel.app"),
  openGraph: {
    title: "Tacin Arabi Collection",
    description:
      "Shop curated fashion and ceramics with fast WhatsApp checkout, COD, and bKash/Nagad payments.",
    type: "website",
    images: [{ url: "/images/og-cover.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og-cover.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
