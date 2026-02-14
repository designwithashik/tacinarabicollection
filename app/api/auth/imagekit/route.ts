export const runtime = 'edge';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const signAuthPayload = async (privateKey: string, token: string, expire: number) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(privateKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const payload = `${token}${expire}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
};

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          error: "Environment variables missing.",
        },
        { status: 500 }
      );
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const expire = Math.floor(Date.now() / 1000) + 30 * 60;
    const signature = await signAuthPayload(privateKey, token, expire);

    return NextResponse.json({ token, expire, signature });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
