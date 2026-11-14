import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader, Prose } from "@/components/ui/misc";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How AH Clothing Hub collects, uses and protects your personal information when you shop with us.",
  path: "/privacy",
});

export default async function Page() {
  const pages = await getPages();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <div className="container-x max-w-3xl py-14 md:py-20">
        <Prose html={pages.privacy} />
      </div>
    </>
  );
}
