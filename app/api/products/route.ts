import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json([]);
  }
  const current =
    (await kv.get<{ data: any[] }>("products:current")) ?? { data: [] };
  return NextResponse.json(current.data);
}
