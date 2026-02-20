import type { CartItem } from "./cart";

export type CustomerInfo = {
  name: string;
  phone: string;
  address: string;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  deliveryZone: string;
  customer: CustomerInfo;
  status: "pending" | "delivering" | "sent" | "failed";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const normalizeOrder = (value: unknown): Order | null => {
  if (!isRecord(value) || !isRecord(value.customer)) return null;

  const total =
    typeof value.total === "number"
      ? value.total
      : typeof value.total === "string"
        ? Number(value.total)
        : Number.NaN;

  if (!Array.isArray(value.items)) return null;

  return {
    id: typeof value.id === "string" ? value.id : "",
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    items: value.items as CartItem[],
    total: Number.isFinite(total) ? total : 0,
    paymentMethod:
      typeof value.paymentMethod === "string" ? value.paymentMethod : "",
    deliveryZone:
      typeof value.deliveryZone === "string" ? value.deliveryZone : "inside",
    customer: {
      name: typeof value.customer.name === "string" ? value.customer.name : "",
      phone:
        typeof value.customer.phone === "string" ? value.customer.phone : "",
      address:
        typeof value.customer.address === "string"
          ? value.customer.address
          : "",
    },
    status:
      value.status === "pending" ||
      value.status === "delivering" ||
      value.status === "sent" ||
      value.status === "failed"
        ? value.status
        : "pending",
  };
};

export const getStoredOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as unknown[];

    return (Array.isArray(data) ? data : [])
      .map((raw) => {
        const source = isRecord(raw) ? raw : {};

        return normalizeOrder({
          id: source.id,
          createdAt: source.createdAt,
          items: source.items,
          total: source.total,
          paymentMethod: source.paymentMethod,
          deliveryZone: source.deliveryZone,
          status: source.status,
          customer: {
            name: source.customerName,
            phone: source.phone,
            address: source.address,
          },
        });
      })
      .filter((item): item is Order => Boolean(item));
  } catch {
    return [];
  }
};

export const addOrder = async (order: Order) => {
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: order.id,
      items: order.items,
      customerName: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      deliveryZone: order.deliveryZone,
    }),
  });
};
