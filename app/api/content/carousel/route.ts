import { NextResponse } from "next/server";
import { loadCarousel } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const items = await loadCarousel();
    const data = items.filter((item) => item.active).sort((a, b) => a.order - b.order);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
