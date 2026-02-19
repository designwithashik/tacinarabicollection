import { NextResponse } from "next/server";
import { workerApiFetch } from "@/lib/server/workerApi";

export const runtime = "edge";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await workerApiFetch(`/admin/products/${encodeURIComponent(params.id)}`);
    return NextResponse.json(await res.json());
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load product." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const payload = {
      name: String(body.name ?? "").trim(),
      price: Number(body.price ?? 0),
      image_url: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
      image_file_id: typeof body.imageFileId === "string" ? body.imageFileId.trim() : null,
      is_active: body.active === false ? 0 : 1,
    };

    const response = await workerApiFetch(`/admin/products/${encodeURIComponent(params.id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
