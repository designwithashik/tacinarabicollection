import { NextResponse } from "next/server";
import { buildWorkerHeaders, buildWorkerUrl } from "@/lib/server/workerApi";

export const runtime = "edge";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.text();
    const response = await fetch(buildWorkerUrl(`/api/admin/products/${encodeURIComponent(params.id)}`), {
      method: "PUT",
      headers: buildWorkerHeaders({ "Content-Type": "application/json" }),
      body,
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
