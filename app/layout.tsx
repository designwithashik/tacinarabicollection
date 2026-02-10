import "./globals.css";
import type { Metadata } from "next";

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
    <html
      lang="en"
      style={
        {
          "--font-heading": '"Playfair Display", Georgia, Times, serif',
          "--font-body":
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
      <body>{children}</body>
    </html>
  );
}
