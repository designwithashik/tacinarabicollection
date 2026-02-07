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
  metadataBase: new URL("https://tacinarabicollection.vercel.app"),
  openGraph: {
    title: "Tacin Arabi Collection",
    description:
      "Shop curated fashion and ceramics with fast WhatsApp checkout, COD, and bKash/Nagad payments.",
    type: "website",
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
