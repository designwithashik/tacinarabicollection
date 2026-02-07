import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const current =
    (await kv.get<{ data: any[] }>("products:current")) ?? { data: [] };
  return NextResponse.json(current.data);
}
