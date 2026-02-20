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

const toValidDate = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const startDate = toValidDate(searchParams.get("startDate"));
    const endDate = toValidDate(searchParams.get("endDate"));

    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(1, Number(searchParams.get("limit") ?? "10") || 10);

    const orders = await loadOrdersArray();

    const filtered = orders
      .filter((order) => {
        if (!search) return true;
        const name = (order.customerName ?? "").toLowerCase();
        const phone = (order.phone ?? "").toLowerCase();
        return name.includes(search) || phone.includes(search);
      })
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        if (Number.isNaN(createdAt.getTime())) return false;

        if (startDate && createdAt < startDate) {
          return false;
        }

        if (endDate) {
          const inclusiveEnd = new Date(endDate);
          inclusiveEnd.setHours(23, 59, 59, 999);
          if (createdAt > inclusiveEnd) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * limit, safePage * limit);

    return NextResponse.json(
      {
        data: paginated,
        total,
        page: safePage,
        totalPages,
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      { data: [], total: 0, page: 1, totalPages: 1 },
      { headers: noStoreHeaders, status: 500 },
    );
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
