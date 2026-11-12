import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { DUMMY_SETTINGS } from "@/lib/dummy-data";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const img = DUMMY_SETTINGS.heroBanners[1]?.image ?? DUMMY_SETTINGS.heroBanners[0].image;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to store</Link>
        </div>
        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</main>
        <p className="text-center text-xs text-muted-foreground">Protected by Firebase Authentication · Your data is encrypted</p>
      </div>
      <div className="relative hidden overflow-hidden bg-[#141414] lg:block">
        <Image src={img} alt="" fill priority sizes="50vw" className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="eyebrow mb-4 text-[#e6d3b0]">Members enjoy</p>
          <p className="max-w-md font-display text-[44px] leading-[1.05]">Early access to new drops, faster checkout & live order tracking.</p>
        </div>
      </div>
    </div>
  );
}
