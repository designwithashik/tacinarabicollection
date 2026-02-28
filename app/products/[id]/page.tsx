import { notFound } from "next/navigation";
import { products, type Product } from "../../../lib/products";
import {
  loadInventoryArray,
  toStorefrontProduct,
} from "../../../lib/server/inventoryStore";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { id: string };

type InventoryProduct = Product & {
  active?: boolean;
};

const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const inventory = await loadInventoryArray();
    const fromInventory = inventory.find(
      (item) => item.id === id && item.active !== false,
    );
    if (fromInventory) {
      return toStorefrontProduct(fromInventory) as InventoryProduct;
    }
  } catch {
    // fallback to local products
  }

  return products.find((item) => item.id === id) ?? null;
};

export default async function ProductPage({ params }: { params: Params }) {
  const decodedId = decodeURIComponent(params.id);
  const product = await getProductById(decodedId);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
