import { NextResponse } from "next/server";
import { loadFilters, saveFilters } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await loadFilters();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array payload." },
        { status: 400 },
      );
    }

    await saveFilters(body);

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to save filters." },
      { status: 500 },
    );
  }
}
