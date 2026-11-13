import type { Order, OrderStatus } from "@/lib/types";
import { formatPKR } from "@/lib/utils";

export const DEFAULT_WHATSAPP_TEMPLATES: Record<OrderStatus, string> = {
  pending: "Assalam o Alaikum {name}! Thank you for your order {orderNumber} of {total} at AH Clothing Hub. We will confirm it shortly.",
  confirmed: "Hi {name}, your order {orderNumber} has been confirmed ✅ We are preparing it for dispatch.",
  packed: "Hi {name}, your order {orderNumber} is packed and will be handed to the courier soon 📦",
  shipped: "Hi {name}, your order {orderNumber} has been shipped via {courier}. Tracking: {tracking} 🚚",
  delivered: "Hi {name}, your order {orderNumber} has been delivered. We hope you love it! ❤️",
  cancelled: "Hi {name}, your order {orderNumber} has been cancelled. Reply here if you have any questions.",
  returned: "Hi {name}, we have received the return for order {orderNumber}. We will update you about the refund/exchange shortly.",
};

export const TEMPLATE_TOKENS = ["{name}", "{orderNumber}", "{total}", "{status}", "{courier}", "{tracking}", "{city}"];

export function fillTemplate(tpl: string, o: Order) {
  return tpl
    .replaceAll("{name}", o.customer.name.split(" ")[0] || o.customer.name)
    .replaceAll("{orderNumber}", o.orderNumber)
    .replaceAll("{total}", formatPKR(o.total))
    .replaceAll("{status}", o.status)
    .replaceAll("{courier}", o.courier?.name ?? "our courier partner")
    .replaceAll("{tracking}", o.courier?.trackingNumber ?? "—")
    .replaceAll("{city}", o.shipping.city);
}
