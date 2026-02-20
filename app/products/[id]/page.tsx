export const runtime = "edge";
import { notFound } from "next/navigation";
import { products, type Product } from "../../../lib/products";
import ProductDetailClient from "./ProductDetailClient";
import { createClient } from "@supabase/supabase-js";

type Params = { id: string };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (data) {
      return {
        id: String(data.id),
        name: data.name,
        price: Number(data.price ?? 0),
        image: data.image_url ?? "/images/product-1.svg",
        imageUrl: data.image_url,
        category: data.category === "Ceramic" ? "Ceramic" : "Clothing",
        colors: Array.isArray(data.colors) ? data.colors : ["Beige"],
        sizes: Array.isArray(data.sizes) ? data.sizes : ["M", "L", "XL"],
      };
    }
  } catch (error) {
    console.error(error);
  }

  return products.find((item) => item.id === id) ?? null;
};

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
