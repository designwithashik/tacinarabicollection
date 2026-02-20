import type { CartItem } from "../models/cart";
import type { CustomerInfo } from "../models/orders";
import { getPublicImageUrl } from "./images";

const formatMoney = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `৳${safe}`;
};

const getSafeQuantity = (value: number) => Math.max(1, Math.floor(value || 1));

const isValidPublicImageUrl = (value: string | null) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const buildWhatsAppMessage = (options: {
  customer: CustomerInfo;
  items: CartItem[];
  paymentMethod: string;
  deliveryZone: string;
  deliveryFee: number;
  transactionId?: string;
  total: number;
}) => {
  const safeItems = options.items.filter(
    (item) => item && item.id && item.name && Number.isFinite(item.price)
  );
  const safeDeliveryFee = Number.isFinite(options.deliveryFee) ? options.deliveryFee : 0;
  const safeTotal = Number.isFinite(options.total) ? options.total : 0;
  const safeSubtotal = Math.max(0, safeTotal - safeDeliveryFee);

  const lines = [
    `Assalamualaikum! New order from Tacin Arabi Collection`,
    `Name: ${options.customer.name}`,
    `Phone: ${options.customer.phone}`,
    `Address: ${options.customer.address}`,
    ``,
    `Order Details:`,
    ...safeItems.map((item, index) => {
      const safeQuantity = getSafeQuantity(item.quantity);
      const lineTotal = (Number.isFinite(item.price) ? item.price : 0) * safeQuantity;
      // Sanitize image references: include only valid public URLs, never filenames.
      const normalizedImageInput = item.imageUrl ?? item.image ?? null;
      const publicImageUrl = getPublicImageUrl(normalizedImageInput ?? "");
      const imageUrl = isValidPublicImageUrl(publicImageUrl) ? publicImageUrl : null;
      const line = `${index + 1}. ${item.name} | Qty: ${safeQuantity} | Unit: ${formatMoney(
        item.price
      )} | Line Total: ${formatMoney(lineTotal)}`;
      return imageUrl ? `${line} | Image: ${imageUrl}` : line;
    }),
    ``,
    `Subtotal: ${formatMoney(safeSubtotal)}`,
    ...(options.deliveryZone ? [`Delivery Zone: ${options.deliveryZone}`] : []),
    `Delivery Charge: ${formatMoney(safeDeliveryFee)}`,
    `Order Total: ${formatMoney(safeTotal)}`,
    ...(options.paymentMethod ? [`Payment Method: ${options.paymentMethod}`] : []),
  ];

  if (options.transactionId) {
    lines.push(`Transaction ID: ${options.transactionId}`);
  }

  return encodeURIComponent(lines.join("\n"));
};
