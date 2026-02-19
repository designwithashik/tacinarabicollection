import { NextResponse } from "next/server";
import { workerApiFetch } from "@/lib/server/workerApi";

export const runtime = "edge";

type WorkerAdminProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  image_file_id?: string | null;
  is_active: number;
};

const toAdminProduct = (item: WorkerAdminProduct) => ({
  id: String(item.id),
  name: item.name,
  price: Number(item.price),
  image: item.image_url ?? "",
  imageUrl: item.image_url,
  imageFileId: item.image_file_id ?? null,
  category: "Clothing" as const,
  colors: ["Beige"],
  sizes: ["M", "L", "XL"],
  active: Number(item.is_active ?? 1) === 1,
  heroFeatured: false,
  title: item.name,
  subtitle: "",
  updatedAt: new Date().toISOString(),
});

export async function GET() {
  try {
    const res = await workerApiFetch("/admin/products");
    const items = ((await res.json()) as WorkerAdminProduct[]) ?? [];
    return NextResponse.json(items.map(toAdminProduct));
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      name: String(body.name ?? "").trim(),
      price: Number(body.price ?? 0),
      image_url: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
      image_file_id: typeof body.imageFileId === "string" ? body.imageFileId.trim() : null,
      is_active: body.active === false ? 0 : 1,
    };

    const res = await workerApiFetch("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(await res.json(), { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 500 });
  }
}
