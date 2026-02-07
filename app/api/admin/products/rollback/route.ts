import { NextResponse } from "next/server";

export const runtime = "nodejs";

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const isAuthorized = (request: Request) =>
  Boolean(process.env.ADMIN_SECRET) &&
  getSecret(request) === process.env.ADMIN_SECRET;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json(
    { ok: false, error: "Rollback disabled for products:current" },
    { status: 400 }
  );
}
