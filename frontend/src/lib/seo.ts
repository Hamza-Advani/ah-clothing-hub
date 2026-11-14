/**
 * SEO helpers — one place that builds per-page metadata so every page gets its own
 * canonical URL, Open Graph and Twitter tags (child pages must not inherit the homepage's).
 */
import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "AH Clothing Hub";

export const absoluteUrl = (path = "/") => (path.startsWith("http") ? path : `${SITE_URL}${path === "/" ? "" : path}`);

/** Strip HTML and collapse whitespace, cut at a word boundary for meta descriptions. */
export function plainText(html: string, max = 160) {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).replace(/[,.;:\s]+$/, "")}…`;
}

type PageMeta = {
  title: string;
  description: string;
  /** Path starting with "/" — becomes the canonical URL and og:url. */
  path: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  /** Use the title as-is (skip the "| AH Clothing Hub" template). */
  absoluteTitle?: boolean;
  noindex?: boolean;
  ogType?: "website" | "article";
};

export function pageMetadata({ title, description, path, images, absoluteTitle, noindex, ogType = "website" }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      locale: "en_PK",
      url: path,
      title: fullTitle,
      description,
      ...(images?.length ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images?.length ? { images: images.map((i) => i.url) } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Metadata for private / utility pages (cart, checkout, account, auth) — not for search results. */
export function privatePageMetadata(title: string, path: string): Metadata {
  return { title, alternates: { canonical: path }, robots: { index: false, follow: true } };
}

/** BreadcrumbList JSON-LD from [name, path] pairs (must mirror the visible breadcrumb). */
export function breadcrumbJsonLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

/** Serialize JSON-LD safely for a <script> tag (escapes "<" so user text can't close the tag). */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
