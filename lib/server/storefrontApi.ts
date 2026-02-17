import type { AdminProduct } from "@/lib/inventory";

type WorkerProduct = {
  id: number;
  name: string;
  price: number;
  stock?: number;
  image_url?: string | null;
  is_active?: number;
  created_at?: string;
  description?: string | null;
};

const toStorefrontProduct = (item: WorkerProduct): AdminProduct => {
  const createdAt = item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString();

  return {
    id: String(item.id),
    name: item.name,
    price: Number(item.price ?? 0),
    image: item.image_url ?? "",
    category: "Clothing",
    colors: ["Beige"],
    sizes: ["M", "L", "XL"],
    active: item.is_active !== 0,
    updatedAt: createdAt,
    heroFeatured: false,
    title: item.name,
    subtitle: "",
  };
};

export async function fetchStorefrontProducts(): Promise<AdminProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return [];

  try {
    const response = await fetch(`${baseUrl}/products`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as WorkerProduct[];
    if (!Array.isArray(payload)) return [];
    return payload.map(toStorefrontProduct);
  } catch {
    return [];
  }
}
