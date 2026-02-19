import { NextResponse } from "next/server";
import { workerApiFetch } from "@/lib/server/workerApi";

export const runtime = "edge";
export const revalidate = 0;

type WorkerProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  is_active: number;
};

const toStorefrontProduct = (item: WorkerProduct) => ({
  id: String(item.id),
  name: item.name,
  price: Number(item.price),
  image: item.image_url ?? "",
  imageUrl: item.image_url,
  category: "Clothing" as const,
  colors: ["Beige"],
  sizes: ["M", "L", "XL"],
  active: Number(item.is_active ?? 1) === 1,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  heroFeatured: false,
  title: item.name,
  subtitle: "",
});

export async function GET() {
  try {
    const res = await workerApiFetch("/products");
    const products = ((await res.json()) as WorkerProduct[]) ?? [];
    return NextResponse.json(products.map(toStorefrontProduct));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
