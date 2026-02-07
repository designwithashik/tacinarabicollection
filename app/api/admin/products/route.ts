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
};

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const isAuthorized = (request: Request) =>
  Boolean(process.env.ADMIN_SECRET) &&
  getSecret(request) === process.env.ADMIN_SECRET;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const stored = (await kv.get<StoredProduct[]>("products")) ?? [];
  return NextResponse.json(stored);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (await request.json()) as Partial<StoredProduct>;
  if (!payload.id || !payload.name || !payload.image || !payload.price) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const stored = (await kv.get<StoredProduct[]>("products")) ?? [];
  const updated: StoredProduct = {
    id: payload.id,
    name: payload.name,
    price: Number(payload.price),
    size: payload.size,
    image: payload.image,
    active: payload.active ?? true,
    updatedAt: Date.now(),
  };
  const next = stored.some((item) => item.id === updated.id)
    ? stored.map((item) => (item.id === updated.id ? updated : item))
    : [updated, ...stored];
  await kv.set("products", next);
  return NextResponse.json(updated);
}
