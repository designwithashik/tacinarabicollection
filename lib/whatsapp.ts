import type { CartItem } from "./cart";
import type { CustomerInfo } from "./orders";
import { getPublicImageUrl } from "./images";

export const buildWhatsAppMessage = (options: {
  customer: CustomerInfo;
  items: CartItem[];
  paymentMethod: string;
  deliveryZone: string;
  deliveryFee: number;
  transactionId?: string;
  paymentScreenshot?: string;
  total: number;
}) => {
  const lines = [
    `Assalamualaikum! New order from Tacin Arabi Collection`,
    `Name: ${options.customer.name}`,
    `Phone: ${options.customer.phone}`,
    `Address: ${options.customer.address}`,
    ``,
    `Order Details:`,
    ...options.items.map((item, index) => {
      const imageUrl = getPublicImageUrl(item.image);
      const line = `${index + 1}. ${item.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ৳${
        item.price * item.quantity
      }`;
      return imageUrl ? `${line} | Image: ${imageUrl}` : `${line} | Image: unavailable`;
    }),
    ``,
    `Subtotal: ৳${options.total - options.deliveryFee}`,
    `Delivery Zone: ${options.deliveryZone}`,
    `Delivery Charge: ৳${options.deliveryFee}`,
    `Total Payable: ৳${options.total}`,
    `Payment Method: ${options.paymentMethod}`,
  ];

  if (options.transactionId) {
    lines.push(`Transaction ID: ${options.transactionId}`);
  }

  if (options.paymentScreenshot) {
    lines.push(`Payment Screenshot: ${options.paymentScreenshot}`);
  }

  return encodeURIComponent(lines.join("\n"));
};
