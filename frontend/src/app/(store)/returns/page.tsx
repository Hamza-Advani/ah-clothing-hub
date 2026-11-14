import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader, Prose } from "@/components/ui/misc";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Returns & Exchange Policy",
  description: "Read the AH Clothing Hub returns and exchange policy — how to request an exchange or return for your order.",
  path: "/returns",
});

export default async function Page() {
  const pages = await getPages();
  return (
    <>
      <PageHeader eyebrow="Customer care" title="Returns & Exchange" />
      <div className="container-x max-w-3xl py-14 md:py-20">
        <Prose html={pages.returns} />
      </div>
    </>
  );
}
