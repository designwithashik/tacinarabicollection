import { NextResponse } from "next/server";
import { fetchStorefrontProducts } from "@/lib/server/storefrontApi";

export const runtime = "edge";
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const heroOnly = searchParams.get("hero") === "true";

    const products = await fetchStorefrontProducts();
    const activeProducts = products.filter((p) => p.active);

    if (heroOnly) {
      return NextResponse.json(activeProducts.slice(0, 3));
    }

    return NextResponse.json(activeProducts);
  } catch {
    return NextResponse.json([]);
  }
}
