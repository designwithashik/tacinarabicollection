import { NextResponse } from "next/server";

export const runtime = "nodejs";

const getSecret = (request: Request) =>
  request.headers.get("x-admin-secret") ?? "";

const getAdminSecret = () =>
  process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const isAuthorized = (request: Request) => {
  const secret = getAdminSecret();
  return Boolean(secret) && getSecret(request) === secret;
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json(
    { ok: false, error: "Rollback disabled for products:current" },
    { status: 400 }
  );
}
