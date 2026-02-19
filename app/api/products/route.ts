import { NextResponse } from "next/server";
import { buildWorkerUrl } from "@/lib/server/workerApi";

export const runtime = "edge";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const heroOnly = searchParams.get("hero") === "true";

    const response = await fetch(buildWorkerUrl("/api/products"), { cache: "no-store" });
    if (!response.ok) return NextResponse.json([], { status: response.status });

    const products = (await response.json()) as Array<Record<string, unknown>>;
    const mapped = (products ?? [])
      .filter((item) => Number(item?.is_active ?? 1) === 1)
      .map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        image: String(item.image_url ?? ""),
        category: "Clothing",
        colors: ["Beige"],
        sizes: ["M", "L", "XL"],
        active: true,
        updatedAt: String(item.updated_at ?? item.created_at ?? new Date().toISOString()),
      }));

    if (heroOnly) {
      return NextResponse.json(mapped.slice(0, 3));
    }

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json([]);
  }
}
