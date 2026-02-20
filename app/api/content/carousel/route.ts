import { NextResponse } from "next/server";
import { loadCarousel } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await loadCarousel();
    return NextResponse.json(items.filter((item) => item.active).sort((a, b) => a.order - b.order));
  } catch {
    return NextResponse.json([]);
  }
}
