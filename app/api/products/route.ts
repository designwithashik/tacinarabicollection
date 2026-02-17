import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 60;

type BackendProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: number;
  slug: string;
  description?: string | null;
  created_at?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const heroOnly = searchParams.get("hero") === "true";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!baseUrl) {
      return NextResponse.json([]);
    }

    const response = await fetch(`${baseUrl}/products`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const backendProducts = (await response.json()) as BackendProduct[];

    const normalized = (backendProducts ?? []).map((product) => ({
      id: String(product.id),
      name: product.name,
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      image: product.image_url ?? "",
      imageUrl: product.image_url,
      category: "Clothing" as const,
      colors: ["Beige"],
      sizes: ["M", "L", "XL"],
      active: Number(product.is_active) === 1,
      updatedAt: new Date(product.created_at ?? Date.now()).toISOString(),
      createdAt: new Date(product.created_at ?? Date.now()).toISOString(),
      heroFeatured: true,
      title: product.name,
      subtitle: product.description ?? "",
      slug: product.slug,
    }));

    if (heroOnly) {
      return NextResponse.json(normalized.slice(0, 3));
    }

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json([]);
  }
}
