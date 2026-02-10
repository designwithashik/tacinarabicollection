/*
 * What this file does:
 *   - Updates a single admin product in KV.
 * Why it exists:
 *   - Persistent inventory edits without redeploy.
 * Notes:
 *   - Uses node runtime and updates updatedAt automatically.
 */

import { NextResponse } from "next/server";
import type { AdminProduct } from "../../../../../lib/inventory";
import { getKVProducts, setKVProducts } from "../../../../../lib/kvProducts";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as Partial<AdminProduct> & {
    imageUrl?: string;
  };
  const { id } = params;

  const { imageUrl: _imageUrl, ...bodyWithoutImageUrl } = body;
  const normalizedPatch: Partial<AdminProduct> = {
    ...bodyWithoutImageUrl,
    ...(body.imageUrl ? { image: body.imageUrl } : {}),
  };

  const current = await getKVProducts();

  const updated = current.map((p) =>
    p.id === id
      ? {
          ...p,
          ...normalizedPatch,
          id,
          updatedAt: new Date().toISOString(),
        }
      : p
  );

  await setKVProducts(updated);

  return NextResponse.json({ success: true });
}
