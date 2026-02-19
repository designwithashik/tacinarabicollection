import { NextResponse } from "next/server";
import { buildWorkerHeaders, buildWorkerUrl } from "@/lib/server/workerApi";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await fetch(buildWorkerUrl("/api/admin/products"), {
      headers: buildWorkerHeaders(),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => []);
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(buildWorkerUrl("/api/admin/products"), {
      method: "POST",
      headers: buildWorkerHeaders(),
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
