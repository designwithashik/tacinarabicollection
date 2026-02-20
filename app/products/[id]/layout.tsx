import type { Metadata } from "next";
import { products } from "../../../lib/products";

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

const getProductById = async (id: string): Promise<ProductLike | null> => {
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

  const previewImage = product.image || product.imageUrl || "/images/og-cover.svg";
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
