/**
 * Store defaults used until the owner saves their own values in Admin → Settings / Pages.
 * No demo products, categories, reviews or orders — the catalogue comes only from Firestore.
 */
import type { PagesContent, StoreSettings } from "./types";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;

/** Brand mood imagery used for the default hero / login panels (replace via Admin → Settings → Homepage). */
export const BRAND_IMAGES = [img("1558769132-cb1aea458c5e"), img("1490481651871-ab68de25d43d")];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "AH Clothing Hub",
  tagline: "Modern heritage, made in Pakistan",
  logo: null,
  favicon: null,
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  socials: {},
  deliveryCharge: 250,
  freeDeliveryThreshold: 5000,
  citiesServed: [],
  profitCountsStatuses: ["delivered"],
  payments: {
    cod: { enabled: true },
    jazzcash: { enabled: false, accountTitle: "", accountNumber: "" },
    easypaisa: { enabled: false, accountTitle: "", accountNumber: "" },
  },
  announcement: ["Cash on Delivery available across Pakistan", "Free delivery on orders above Rs. 5,000"],
  heroBanners: [
    { id: "default-1", image: BRAND_IMAGES[0], eyebrow: "AH Clothing Hub", title: "Modern heritage, made in Pakistan", subtitle: "Eastern and western wear for women, men and kids — delivered to your door.", ctaLabel: "Shop now", ctaLink: "/shop", order: 1 },
    { id: "default-2", image: BRAND_IMAGES[1], eyebrow: "New season", title: "Style for every moment", subtitle: "Fresh pieces added regularly. Cash on Delivery nationwide.", ctaLabel: "Explore the shop", ctaLink: "/shop", order: 2 },
  ],
  templates: {
    whatsapp: {
      pending: "Assalam o Alaikum {name}! Thank you for your order {orderNumber} of {total} at AH Clothing Hub. We will confirm it shortly.",
      confirmed: "Hi {name}, your order {orderNumber} has been confirmed ✅ We are preparing it for dispatch.",
      shipped: "Hi {name}, your order {orderNumber} has been shipped via {courier}. Tracking: {tracking} 🚚",
      delivered: "Hi {name}, your order {orderNumber} has been delivered. We hope you love it! ❤️",
      cancelled: "Hi {name}, your order {orderNumber} has been cancelled. Reply here if you have any questions.",
    },
    email: {},
  },
};

export const DEFAULT_PAGES: PagesContent = {
  about: `<p>AH Clothing Hub is an online clothing store in Pakistan bringing together classic style and modern design — eastern and western wear for women, men and kids.</p><p>Shop online with Cash on Delivery across Pakistan.</p>`,
  returns: `<h3>Exchange & returns</h3><p>Not quite right? Contact us on WhatsApp or email with your order number and we will help you with an exchange or return.</p>`,
  privacy: `<p>We respect your privacy. We collect only the information required to process your orders — your name, contact details and delivery address. We never sell your data.</p>`,
  terms: `<p>By using this website you agree to our terms. Prices are listed in Pakistani Rupees (PKR). We reserve the right to cancel orders in case of pricing errors or stock unavailability, in which case any payment made will be refunded in full.</p>`,
  faq: [
    { q: "Do you offer Cash on Delivery?", a: "Yes, Cash on Delivery is available across Pakistan." },
    { q: "How do I track my order?", a: "Log in and open My Orders to see a live status timeline and your courier tracking number." },
  ],
};
