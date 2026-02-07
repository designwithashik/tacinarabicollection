import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type StoredProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
  tags?: string[];
  stockStatus?: "in" | "low" | "out";
};

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const isAuthorized = (request: Request) =>
  Boolean(process.env.ADMIN_SECRET) &&
  getSecret(request) === process.env.ADMIN_SECRET;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (await request.json()) as { index?: number };
  const versions = (await kv.get<StoredProduct[][]>("products_versions")) ?? [];
  const index = payload.index ?? 0;
  const target = versions[index];
  if (!target) {
    return NextResponse.json({ ok: false, error: "No snapshot found" }, { status: 400 });
  }
  await kv.set("products", target);
  return NextResponse.json({ ok: true });
}
