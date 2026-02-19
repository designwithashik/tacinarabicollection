import { NextResponse } from "next/server";
import { workerApiFetch } from "@/lib/server/workerApi";

export const runtime = "edge";

type WorkerProduct = {
  id: number;
  image_file_id?: string | null;
};

const deleteImageFromImageKit = async (fileId: string) => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is missing.");
  }

  const auth = `Basic ${btoa(`${privateKey}:`)}`;
  const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: {
      Authorization: auth,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to delete asset from ImageKit.");
  }
};

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const detailsRes = await workerApiFetch(`/admin/products/${encodeURIComponent(params.id)}`);
    const product = (await detailsRes.json()) as WorkerProduct;

    if (product.image_file_id) {
      await deleteImageFromImageKit(product.image_file_id);
    }

    await workerApiFetch(`/admin/products/${encodeURIComponent(params.id)}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
