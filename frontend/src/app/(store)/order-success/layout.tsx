import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

// Private/utility page: crawlable (so Google sees this tag) but kept out of search results.
export const metadata: Metadata = privatePageMetadata("Order placed", "/order-success");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
