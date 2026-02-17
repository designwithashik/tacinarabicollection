import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_URL" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const payload = new FormData();
    const fileName = file instanceof File ? file.name : `upload-${Date.now()}.bin`;
    payload.append("file", file, fileName);

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/admin/upload`, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await response.text();
    if (!text) {
      return NextResponse.json({ error: "Empty upload response" }, { status: 502 });
    }

    const data = JSON.parse(text) as { image_url?: string; error?: string };
    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Upload failed" }, { status: response.status });
    }

    return NextResponse.json({ image_url: data.image_url ?? null });
  } catch {
    return NextResponse.json({ error: "Upload proxy failed" }, { status: 500 });
  }
}
