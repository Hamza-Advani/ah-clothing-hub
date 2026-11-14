import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Only the admin panel and API are blocked from crawling.
 * Cart, checkout, account, login etc. stay crawlable on purpose: they carry a `noindex` meta tag,
 * and Google can only see (and obey) that tag if it is allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
