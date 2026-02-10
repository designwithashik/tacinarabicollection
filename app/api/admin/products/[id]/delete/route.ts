/*
 * What this file does:
 *   - Deletes a single admin product from KV.
 * Why it exists:
 *   - Persistent inventory cleanup without redeploy.
 * Notes:
 *   - Admin-only route for destructive product actions.
 */

import { NextResponse } from "next/server";
import { getKVProducts, setKVProducts } from "../../../../../../lib/kvProducts";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const current = await getKVProducts();
  const updated = current.filter((p) => p.id !== id);
  await setKVProducts(updated);
  return NextResponse.json({ success: true });
}
