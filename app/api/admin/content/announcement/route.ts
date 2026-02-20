import { NextResponse } from "next/server";
import { loadAnnouncement, saveAnnouncement } from "@/lib/server/siteContentStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const announcement = await loadAnnouncement();
    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ text: "", active: false });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown; active?: unknown };
    await saveAnnouncement({ text: body?.text, active: body?.active });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to save announcement." },
      { status: 500 }
    );
  }
}
