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

type AdminLog = {
  action: string;
  productId?: string;
  timestamp: number;
};

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const isAuthorized = (request: Request) =>
  Boolean(process.env.ADMIN_SECRET) &&
  getSecret(request) === process.env.ADMIN_SECRET;

const saveSnapshot = async (products: StoredProduct[]) => {
  const versions = (await kv.get<StoredProduct[][]>("products_versions")) ?? [];
  const next = [products, ...versions].slice(0, 5);
  await kv.set("products_versions", next);
};

const appendLog = async (entry: AdminLog) => {
  const logs = (await kv.get<AdminLog[]>("admin_logs")) ?? [];
  await kv.set("admin_logs", [entry, ...logs].slice(0, 200));
};

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
    tags: payload.tags ?? [],
    stockStatus: payload.stockStatus ?? "in",
  };
  const next = stored.some((item) => item.id === updated.id)
    ? stored.map((item) => (item.id === updated.id ? updated : item))
    : [updated, ...stored];
  await kv.set("products", next);
  await saveSnapshot(next);
  await appendLog({
    action: "upsert",
    productId: updated.id,
    timestamp: Date.now(),
  });
  return NextResponse.json(updated);
}
