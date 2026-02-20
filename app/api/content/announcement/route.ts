import { NextResponse } from "next/server";
import { loadAnnouncement } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await loadAnnouncement();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { text: "", active: false },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
