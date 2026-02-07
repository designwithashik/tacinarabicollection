import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { products } from "../../../lib/products";

type StoredProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
};

const defaultColors = ["Beige", "Olive", "Maroon", "Black"];
const defaultSizes = ["M", "L", "XL"];

const mapToShopProduct = (item: StoredProduct) => ({
  id: item.id,
  name: item.name,
  price: item.price,
  image: item.image,
  category: "Clothing",
  colors: defaultColors,
  sizes: item.size ? [item.size] : defaultSizes,
});

export const revalidate = 30;

export async function GET() {
  try {
    const stored = (await kv.get<StoredProduct[]>("products")) ?? [];
    if (stored.length === 0 && process.env.NODE_ENV === "development") {
      return NextResponse.json(products);
    }
    const active = stored.filter((item) => item.active !== false);
    const mapped = active.map(mapToShopProduct);
    return NextResponse.json(mapped);
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(products);
    }
    return NextResponse.json([], { status: 200 });
  }
}
