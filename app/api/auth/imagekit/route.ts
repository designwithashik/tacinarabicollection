/*
 * What this file does:
 *   - Returns ImageKit auth parameters for secure client-side uploads.
 * Why it exists:
 *   - Allows admin inventory uploads without exposing private key in browser.
 * Notes:
 *   - Uses ImageKit private key server-side only.
 */

import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(imagekit.getAuthenticationParameters());
}
