import { NextResponse } from "next/server";
import { loadOrdersArray, saveOrdersArray } from "@/lib/server/orderStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await loadOrdersArray();
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
    const existing = await loadOrdersArray();
    const next = Array.isArray(body) ? body : [body, ...existing];
    await saveOrdersArray(next);

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to save order." },
      { status: 500 },
    );
  }
}
