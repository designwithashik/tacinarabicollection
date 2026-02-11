import type { Metadata } from "next";
import { kv } from "@vercel/kv";
import { products } from "../../../lib/products";

export const dynamic = "force-dynamic";

type Params = { id: string };

type LayoutProps = {
  children: React.ReactNode;
  params: Params;
};

type ProductLike = {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  price?: number;
};

const isProductLike = (value: unknown): value is ProductLike => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProductLike>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "tacin-arabi-product";

const toImageKitPreviewUrl = (input: string, name: string) => {
  if (!input || !input.startsWith("https://ik.imagekit.io/")) return input;

  const seoName = slugify(name);
  const [base] = input.split("?");
  const hasTr = /\/tr:/.test(base);
  const transform = "w-1200,h-630,c-maintain_ratio,q-70,f-webp";

  const transformedBase = hasTr
    ? base.replace(/\/tr:[^/]+\//, `/tr:${transform}/`)
    : base.replace("https://ik.imagekit.io/", `https://ik.imagekit.io/tr:${transform}/`);

  return `${transformedBase}?ik-seo=${encodeURIComponent(`${seoName}.webp`)}`;
};

const getProductById = async (id: string): Promise<ProductLike | null> => {
  try {
    const fromHash = await kv.hget<unknown>("tacin_collection_final", id);
    if (isProductLike(fromHash)) return fromHash;

    const all = (await kv.hgetall<Record<string, unknown>>("tacin_collection_final")) ?? {};
    const maybe = Object.values(all).find(
      (item) => isProductLike(item) && (item as ProductLike).id === id
    );
    if (isProductLike(maybe)) return maybe;
  } catch {
    // fallback below
  }

  const local = products.find((item) => item.id === id);
  return local
    ? {
        id: local.id,
        name: local.name,
        image: local.image,
        price: local.price,
      }
    : null;
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductById(params.id);

  if (!product) {
    return {
      title: "Product | Tacin Arabi Collection",
      description: "WhatsApp-first shopping for fashion and ceramics.",
    };
  }

  const imageSource = product.image || product.imageUrl || "/images/og-cover.svg";
  const previewImage = toImageKitPreviewUrl(imageSource, product.name);
  const title = `${product.name} | Tacin Arabi Collection`;
  const description =
    typeof product.price === "number"
      ? `Shop ${product.name} for ৳${product.price.toLocaleString("en-BD")} with WhatsApp checkout.`
      : `Shop ${product.name} with fast WhatsApp checkout.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
    },
  };
}

export default function ProductLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
