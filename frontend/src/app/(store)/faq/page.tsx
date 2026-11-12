import Link from "next/link";
import type { Metadata } from "next";
import { Accordion, AccordionItem } from "@/components/ui/radix";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { getPages } from "@/lib/catalog";

export const metadata: Metadata = { title: "FAQ", description: "Answers to common questions about delivery, payments, exchanges and orders at AH Clothing Hub." };

export default async function FaqPage() {
  const { faq } = await getPages();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Help centre" title="Frequently asked" description="Everything you need to know about shopping with us." />
      <div className="container-x max-w-3xl py-14 md:py-20">
        <Accordion type="single" collapsible defaultValue="q0" className="border-t border-border">
          {faq.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`} title={f.q}>{f.a}</AccordionItem>
          ))}
        </Accordion>
        <div className="mt-14 rounded-[6px] bg-muted p-8 text-center">
          <h2 className="text-3xl">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Our team replies within minutes on WhatsApp, 10am – 10pm.</p>
          <Button asChild className="mt-6"><Link href="/contact">Contact us</Link></Button>
        </div>
      </div>
    </>
  );
}
