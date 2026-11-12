import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/ui/misc";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = { title: "Returns & Exchange", description: "Easy 7-day exchange and returns policy at AH Clothing Hub." };

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
