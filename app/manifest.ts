import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tacin Arabi Collection",
    short_name: "Tacin Arabi",
    start_url: "/",
    display: "standalone",
    background_color: "#f2e8df",
    theme_color: "#8a4b3c",
    icons: [
      {
        src: "/images/tacin-logo.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/images/tacin-logo.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
