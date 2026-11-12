import Link from "next/link";
import { Logo } from "@/components/store/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-16 font-display text-[120px] leading-none text-accent md:text-[180px]">404</p>
      <h1 className="mt-2 text-4xl">This page has wandered off</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to something beautiful.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link href="/">Back to home</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/shop">Shop all</Link></Button>
      </div>
    </div>
  );
}
