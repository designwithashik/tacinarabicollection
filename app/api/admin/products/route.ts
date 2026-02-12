import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  loadInventoryArray,
  saveInventoryArray,
  toStorefrontProduct,
} from "@/lib/server/inventoryStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await loadInventoryArray();
    return NextResponse.json(items.map(toStorefrontProduct));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      price,
      description,
      category,
      imageUrl,
      whatsappNumber,
      heroFeatured,
    } = body;

    const existing = await loadInventoryArray();

    const newProduct = {
      id: crypto.randomUUID(),
      name: String(name ?? "").trim(),
      price: Number(price),
      imageUrl: typeof imageUrl === "string" && imageUrl.startsWith("http") ? imageUrl : null,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: typeof category === "string" ? category : "Clothing",
      description: typeof description === "string" ? description : "",
      whatsappNumber: typeof whatsappNumber === "string" ? whatsappNumber : "",
      colors: ["Beige"],
      sizes: ["M", "L", "XL"],
      heroFeatured: heroFeatured === true,
    };

    const updated = [...existing, newProduct];
    await saveInventoryArray(updated);

    revalidatePath("/");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ success: true, id: newProduct.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to save product." },
      { status: 500 }
    );
  }
}
