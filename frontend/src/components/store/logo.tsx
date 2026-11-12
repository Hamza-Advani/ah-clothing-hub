import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ logoUrl, className, inverted }: { logoUrl?: string | null; className?: string; inverted?: boolean }) {
  return (
    <Link href="/" aria-label="AH Clothing Hub — home" className={cn("group inline-flex items-center gap-2.5", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt="AH Clothing Hub" width={140} height={40} className="h-9 w-auto object-contain" priority />
      ) : (
        <>
          <span
            className={cn(
              "grid size-9 place-items-center rounded-full border font-display text-[17px] font-semibold leading-none transition-colors duration-500 md:size-10 md:text-lg",
              inverted ? "border-accent/70 text-background" : "border-accent text-foreground group-hover:bg-foreground group-hover:text-background",
            )}
          >
            AH
          </span>
          <span className="flex flex-col leading-none">
            <span className={cn("font-display text-[19px] font-semibold tracking-wide md:text-[21px]", inverted && "text-background")}>AH Clothing</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.42em] text-accent">Hub · Pakistan</span>
          </span>
        </>
      )}
    </Link>
  );
}
