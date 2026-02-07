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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (await request.json()) as Partial<StoredProduct>;
  const stored = (await kv.get<StoredProduct[]>("products")) ?? [];
  const next = stored.map((item) =>
    item.id === params.id
      ? {
          ...item,
          ...payload,
          price: payload.price !== undefined ? Number(payload.price) : item.price,
          updatedAt: Date.now(),
        }
      : item
  );
  await kv.set("products", next);
  await saveSnapshot(next);
  await appendLog({ action: "update", productId: params.id, timestamp: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const stored = (await kv.get<StoredProduct[]>("products")) ?? [];
  const next = stored.map((item) =>
    item.id === params.id ? { ...item, active: false, updatedAt: Date.now() } : item
  );
  await kv.set("products", next);
  await saveSnapshot(next);
  await appendLog({ action: "archive", productId: params.id, timestamp: Date.now() });
  return NextResponse.json({ ok: true });
}
