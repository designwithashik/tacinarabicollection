import ImageKit from "imagekit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          error: "Environment variables missing in Vercel.",
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
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
