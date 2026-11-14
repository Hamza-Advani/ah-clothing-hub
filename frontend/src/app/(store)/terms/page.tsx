import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader, Prose } from "@/components/ui/misc";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping at AH Clothing Hub, including pricing in PKR, orders and cancellations.",
  path: "/terms",
});

export default async function Page() {
  const pages = await getPages();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <div className="container-x max-w-3xl py-14 md:py-20">
        <Prose html={pages.terms} />
      </div>
    </>
  );
}
