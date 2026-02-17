import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_URL" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const payload = new FormData();
    const inferredName = (file as Blob & { name?: string }).name || `upload-${Date.now()}.bin`;
    payload.append("file", file, inferredName);

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/admin/upload`, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const raw = await response.text();
    const parsed = raw
      ? ((): { image_url?: string; error?: string } => {
          try {
            return JSON.parse(raw) as { image_url?: string; error?: string };
          } catch {
            return { error: raw };
          }
        })()
      : { error: "Empty upload response" };

    if (!response.ok) {
      return NextResponse.json(
        { error: parsed.error || "Upload failed" },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ image_url: parsed.image_url ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload proxy failed" },
      { status: 500 }
    );
  }
}
