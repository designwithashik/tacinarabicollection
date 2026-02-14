export const runtime = 'edge';
import type { Metadata } from "next";
import { products } from "../../../lib/products";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

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
  imageUrl?: string | null;
  price?: number;
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
    const inventory = await loadInventoryArray();
    const fromInventory = inventory.find((item) => item.id === id);
    if (fromInventory) {
      return toStorefrontProduct(fromInventory);
    }
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
