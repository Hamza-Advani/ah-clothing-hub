import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function discountPercent(price: number, salePrice?: number | null) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/** Normalises a Pakistani mobile number to +92XXXXXXXXXX (no spaces). */
export function normalizePkPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  if (digits.startsWith("3")) return `+92${digits}`;
  return `+${digits}`;
}

export const PK_PHONE_REGEX = /^(\+92|0|92)?3\d{2}[\s-]?\d{7}$/;

export function formatDate(d: Date | string | number, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString("en-PK", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function whatsappLink(phone: string, text?: string) {
  const n = phone.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Cloudinary/Unsplash-aware sizing helper for <Image> blur-free loading. */
export function imageUrl(url: string, width = 900) {
  if (url.includes("images.unsplash.com")) {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", "80");
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  }
  return url;
}

/** Only allow same-site relative redirects (prevents open-redirects). */
export function safeNext(next: string | null, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
