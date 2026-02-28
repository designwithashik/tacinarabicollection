import { NextResponse } from "next/server";

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/images/tacin-logo.svg", request.url), {
    status: 308,
    headers: {
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
