import { NextResponse } from "next/server";
import { loadCarousel, saveCarousel } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await loadCarousel();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: unknown };
    const items = Array.isArray(body?.items) ? body.items : [];
    await saveCarousel(items);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to save carousel content." },
      { status: 500 }
    );
  }
}
