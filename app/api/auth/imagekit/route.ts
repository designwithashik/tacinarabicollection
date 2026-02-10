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

export const runtime = "nodejs";

export async function GET() {
  // Initialize only at request-time so build doesn't fail when env vars
  // are absent in non-runtime contexts (e.g., static page-data collection).
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    return NextResponse.json(
      {
        error:
          "ImageKit env vars are missing. Set NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT.",
      },
      { status: 500 }
    );
  }

  const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return NextResponse.json(imagekit.getAuthenticationParameters());
}
