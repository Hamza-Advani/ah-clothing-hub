import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/ui/misc";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms and conditions for shopping at AH Clothing Hub." };

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
