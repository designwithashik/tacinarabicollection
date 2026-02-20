import { NextResponse } from "next/server";
import { loadOrdersArray, saveOrdersArray } from "@/lib/server/orderStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = { "Cache-Control": "no-store" };

const isValidStatus = (
  value: unknown,
): value is "pending" | "delivering" | "sent" | "failed" =>
  value === "pending" ||
  value === "delivering" ||
  value === "sent" ||
  value === "failed";

export async function GET() {
  try {
    const orders = await loadOrdersArray();
    return NextResponse.json(orders, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json([], { headers: noStoreHeaders, status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: unknown;
      customerName?: unknown;
      phone?: unknown;
      address?: unknown;
      total?: unknown;
    };

    const nextOrder = {
      id: crypto.randomUUID(),
      items: Array.isArray(body.items) ? body.items : [],
      customerName:
        typeof body.customerName === "string" ? body.customerName.trim() : "",
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      address: typeof body.address === "string" ? body.address.trim() : "",
      total:
        typeof body.total === "number"
          ? body.total
          : typeof body.total === "string"
            ? Number(body.total)
            : 0,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    const existing = await loadOrdersArray();
    const next = [nextOrder, ...existing];
    await saveOrdersArray(next);

    return NextResponse.json(nextOrder, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      { error: "Unable to create order." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown; status?: unknown };
    const id = typeof body.id === "string" ? body.id : "";

    if (!id || !isValidStatus(body.status)) {
      return NextResponse.json(
        { error: "Invalid payload." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const orders = await loadOrdersArray();
    const updated = orders.map((order) =>
      order.id === id ? { ...order, status: body.status } : order,
    );
    const target = updated.find((order) => order.id === id);

    if (!target) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    await saveOrdersArray(updated);

    return NextResponse.json(target, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      { error: "Unable to update order." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? "";

    if (!id) {
      return NextResponse.json(
        { error: "Order id is required." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const orders = await loadOrdersArray();
    const next = orders.filter((order) => order.id !== id);

    if (next.length === orders.length) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    await saveOrdersArray(next);

    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete order." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
