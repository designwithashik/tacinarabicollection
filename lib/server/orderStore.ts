import { kv } from "@vercel/kv";

export const ORDER_KEY = "orders:records";

export type StoredOrderStatus = "pending" | "delivering" | "sent" | "failed";

export type StoredOrder = {
  id: string;
  items: unknown[];
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: StoredOrderStatus;
  createdAt: string;
  paymentMethod?: string;
  deliveryZone?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeStatus = (value: unknown): StoredOrderStatus => {
  if (value === "pending") return "pending";
  if (value === "delivering") return "delivering";
  if (value === "sent") return "sent";
  if (value === "failed") return "failed";
  return "pending";
};

const normalizeOrder = (value: unknown): StoredOrder | null => {
  if (!isRecord(value)) return null;

  const customer = isRecord(value.customer) ? value.customer : null;
  const customerName =
    normalizeString(value.customerName) || normalizeString(customer?.name);
  const phone =
    normalizeString(value.phone) || normalizeString(customer?.phone);
  const address =
    normalizeString(value.address) || normalizeString(customer?.address);
  const id = normalizeString(value.id);

  if (!id || !customerName || !phone || !address) return null;

  const parsedTotal =
    typeof value.total === "number"
      ? value.total
      : typeof value.total === "string"
        ? Number(value.total)
        : Number.NaN;

  return {
    id,
    items: Array.isArray(value.items) ? value.items : [],
    customerName,
    phone,
    address,
    total: Number.isFinite(parsedTotal) ? parsedTotal : 0,
    status: normalizeStatus(value.status),
    createdAt: normalizeString(value.createdAt) || new Date().toISOString(),
    paymentMethod: normalizeString(value.paymentMethod),
    deliveryZone: normalizeString(value.deliveryZone),
  };
};

const normalizeOrders = (payload: unknown): StoredOrder[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map(normalizeOrder)
    .filter((item): item is StoredOrder => Boolean(item));
};

export async function loadOrdersArray(): Promise<StoredOrder[]> {
  const payload = await kv.get<unknown>(ORDER_KEY);

  if (!payload) return [];

  if (typeof payload === "string") {
    try {
      return normalizeOrders(JSON.parse(payload));
    } catch {
      return [];
    }
  }

  return normalizeOrders(payload);
}

export async function saveOrdersArray(items: unknown) {
  const normalized = normalizeOrders(items);
  await kv.set(ORDER_KEY, JSON.stringify(normalized));
}
