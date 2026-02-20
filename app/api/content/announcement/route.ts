import { NextResponse } from "next/server";
import { loadAnnouncement } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const announcement = await loadAnnouncement();
    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ text: "", active: false });
  }
}
