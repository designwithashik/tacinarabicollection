import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const logs = (await kv.get<AdminLog[]>("admin_logs")) ?? [];
  return NextResponse.json(logs);
}
