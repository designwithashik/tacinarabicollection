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
  return NextResponse.json({ ok: true });
}
