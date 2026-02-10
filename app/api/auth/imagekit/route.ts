import ImageKit from "imagekit";
import { NextResponse } from "next/server";

// Force this route to be dynamic so it doesn't get cached as a 404
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    // Safety check: If vars are missing, return a 500 JSON error, NOT a 404
    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          error: "Keys missing in Vercel environment variables",
          debug: {
            publicKey: !!publicKey,
            privateKey: !!privateKey,
            url: !!urlEndpoint,
          },
        },
        { status: 500 }
      );
    }

    const imagekit = new ImageKit({
      publicKey: publicKey,
      privateKey: privateKey,
      urlEndpoint: urlEndpoint,
    });

    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
