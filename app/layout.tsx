export const runtime = "edge";
import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import GlobalAnimatedWrapper from "../components/AnimatedWrapper";
import Footer from "../components/Footer";

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

export const metadata = {
  metadataBase: new URL("https://tacinarabicollection.pages.dev"),
  title: {
    default: "Tacin Arabi Collection | Elegant Modest Fashion in Bangladesh",
    template: "%s | Tacin Arabi Collection",
  },
  description:
    "Discover refined modest fashion, elegant kurtis, and curated lifestyle pieces inspired by heritage and modern sophistication.",
  openGraph: {
    title: "Tacin Arabi Collection",
    description: "Live with heritage. Wear with elegance.",
    url: "https://tacinarabicollection.pages.dev",
    siteName: "Tacin Arabi Collection",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tacin Arabi Collection",
    description: "Live with heritage. Wear with elegance.",
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
    <html lang="en-BD" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Tacin Arabi Collection",
              url: "https://tacinarabicollection.pages.dev",
            }),
          }}
        />
      </head>
      <body>
        <GlobalAnimatedWrapper>{children}</GlobalAnimatedWrapper>
        <Footer />
      </body>
    </html>
  );
}
