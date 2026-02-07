import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

const getAdminSecret = () =>
  process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const isAuthorized = (request: Request) => {
  const secret = getAdminSecret();
  return Boolean(secret) && getSecret(request) === secret;
};

const PRODUCTS_KEY = "products:current";

const getStoredProducts = async () => {
  const current = (await kv.get<{ data: StoredProduct[] }>(PRODUCTS_KEY)) ?? {
    data: [],
  };
  return Array.isArray(current.data) ? current.data : [];
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (await request.json()) as Partial<StoredProduct>;
  const stored = await getStoredProducts();
  const next = stored.map((item) => {
    if (item.id !== params.id) return item;
    return {
      ...item,
      ...payload,
      price: payload.price !== undefined ? Number(payload.price) : item.price,
      updatedAt: Date.now(),
    };
  });
  await kv.set(PRODUCTS_KEY, { data: next });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const stored = await getStoredProducts();
  const next = stored.map((item) =>
    item.id === params.id ? { ...item, active: false, updatedAt: Date.now() } : item
  );
  await kv.set(PRODUCTS_KEY, { data: next });
  return NextResponse.json({ ok: true });
}
