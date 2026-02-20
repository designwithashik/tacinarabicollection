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

    const dynamicImport = new Function("m", "return import(m)") as (
      moduleName: string
    ) => Promise<{ default: new (config: { publicKey: string; privateKey: string; urlEndpoint: string }) => { getAuthenticationParameters: () => unknown } }>;

    const imageKitModule = await dynamicImport("imagekit").catch(() => null);

    if (!imageKitModule?.default) {
      return NextResponse.json(
        {
          error: "ImageKit SDK is not installed in this environment.",
        },
        { status: 503 }
      );
    }

    const imagekit = new imageKitModule.default({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    return NextResponse.json(imagekit.getAuthenticationParameters());
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
