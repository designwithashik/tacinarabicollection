import { NextResponse } from "next/server";

const TRANSPARENT_ICO = Uint8Array.from([
  0,0,1,0,1,0,16,16,0,0,1,0,32,0,40,1,0,0,22,0,0,0,
  40,0,0,0,16,0,0,0,32,0,0,0,1,0,32,0,0,0,0,0,0,1,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
]);

export function GET() {
  return new NextResponse(TRANSPARENT_ICO, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
