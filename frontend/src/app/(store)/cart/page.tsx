"use client";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CartLine } from "@/components/store/cart-line";
import { CouponInput, TotalsRows } from "@/components/store/order-summary";
import { TrustBadges } from "@/components/store/home-sections";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useMounted } from "@/hooks/use-mounted";
import { previewTotals } from "@/lib/pricing";
import { useStoreData } from "@/components/providers/store-data";

export default function CartPage() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const coupon = useCart((s) => s.coupon);
  const applyCoupon = useCart((s) => s.setCoupon);
  const { settings: s } = useStoreData();


  if (!mounted) return <div className="container-x min-h-[60vh] py-16"><div className="skeleton h-10 w-48" /></div>;
  if (items.length === 0)
    return <EmptyState className="min-h-[60vh]" icon={ShoppingBag} title="Your bag is empty" description="Discover new arrivals and best sellers picked for you." action={<Button asChild size="lg"><Link href="/shop">Continue shopping</Link></Button>} />;

  const totals = previewTotals(cartSubtotal(items), { deliveryCharge: s.deliveryCharge, freeDeliveryThreshold: s.freeDeliveryThreshold, coupon });

  return (
    <div className="container-x py-10 md:py-16">
      <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Continue shopping</Link>
      <h1 className="text-[42px] font-medium leading-none md:text-[56px]">Your bag <span className="font-sans text-lg text-muted-foreground">({cartCount(items)})</span></h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((i) => <CartLine key={i.key} item={i} />)}
        </ul>
        <aside className="h-fit space-y-6 rounded-[6px] border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>
          <CouponInput subtotal={totals.subtotal} coupon={coupon} onApply={applyCoupon} />
          <TotalsRows {...totals} freeDeliveryThreshold={s.freeDeliveryThreshold} />
          <Button asChild size="lg" className="w-full"><Link href="/checkout">Proceed to checkout</Link></Button>
          <TrustBadges freeDeliveryThreshold={s.freeDeliveryThreshold} compact />
        </aside>
      </div>
    </div>
  );
}
