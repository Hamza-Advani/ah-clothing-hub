/**
 * Payment providers module.
 * Add automatic gateways (JazzCash API, EasyPaisa API, Safepay) by implementing PaymentProvider
 * and registering them in PROVIDERS — the order flow does not need to change.
 */
import { HttpError } from "../lib/http.js";
import type { PaymentMethod, PaymentStatus, StoreSettings } from "../lib/types.js";

export type PaymentInput = { method: PaymentMethod; txnId: string | null; screenshot: { url: string; publicId: string } | null };
export type PaymentInit = { status: PaymentStatus; redirectUrl?: string };

export interface PaymentProvider {
  id: PaymentMethod;
  label: string;
  isEnabled(settings: StoreSettings): boolean;
  /** Validate input & return the initial payment status for a new order. */
  init(input: PaymentInput, ctx: { orderNumber: string; amount: number }): Promise<PaymentInit>;
}

const cod: PaymentProvider = {
  id: "cod",
  label: "Cash on Delivery",
  isEnabled: (s) => s.payments.cod.enabled,
  init: async () => ({ status: "pending" }),
};

/** Manual wallet transfer: customer uploads a screenshot, admin approves/rejects. */
function manualWallet(id: "jazzcash" | "easypaisa", label: string): PaymentProvider {
  return {
    id,
    label,
    isEnabled: (s) => s.payments[id].enabled,
    init: async (input) => {
      if (!input.screenshot?.url?.startsWith("https://res.cloudinary.com/")) throw new HttpError(400, "Please upload a valid payment screenshot.");
      return { status: "awaiting_approval" };
    },
  };
}

export const PROVIDERS: Record<PaymentMethod, PaymentProvider> = {
  cod,
  jazzcash: manualWallet("jazzcash", "JazzCash"),
  easypaisa: manualWallet("easypaisa", "EasyPaisa"),
};

export function getProvider(method: PaymentMethod, settings: StoreSettings) {
  const p = PROVIDERS[method];
  if (!p || !p.isEnabled(settings)) throw new HttpError(400, "This payment method is currently unavailable.");
  return p;
}
