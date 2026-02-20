export const runtime = "edge";
import { notFound } from "next/navigation";
import { products, type Product } from "../../../lib/models/products";
import { loadInventoryArray, toStorefrontProduct } from "../../../lib/server/inventoryStore";
import ProductDetailClient from "./ProductDetailClient";

type Params = { id: string };

type InventoryProduct = Product & {
  active?: boolean;
};

const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const inventory = await loadInventoryArray();
    const fromInventory = inventory.find((item) => item.id === id && item.active !== false);
    if (fromInventory) {
      return toStorefrontProduct(fromInventory) as InventoryProduct;
    }
  } catch {
    // fallback to local products
  }

  return products.find((item) => item.id === id) ?? null;
};

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.image],
    description: `${product.name} from Tacin Arabi Collection with elegant modest styling and nationwide delivery.`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Tacin Arabi Collection",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: `https://tacinarabicollection.pages.dev/products/${product.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
