"use client";
import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/radix";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CartLine } from "./cart-line";
import { useUI } from "@/store/ui";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useMounted } from "@/hooks/use-mounted";
import { formatPKR } from "@/lib/utils";

export function CartDrawer({ freeDeliveryThreshold }: { freeDeliveryThreshold: number }) {
  const { cartOpen, setCartOpen } = useUI();
  const items = useCart((s) => s.items);
  const mounted = useMounted();
  const list = mounted ? items : [];
  const subtotal = cartSubtotal(list);
  const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const pct = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" title="Shopping bag">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <h2 className="font-display text-2xl">Your bag</h2>
          <span className="text-sm text-muted-foreground">({cartCount(list)})</span>
        </div>
        {list.length === 0 ? (
          <EmptyState
            className="flex-1"
            icon={ShoppingBag}
            title="Your bag is empty"
            description="Looks like you haven't added anything yet. Let's find something you'll love."
            action={
              <Button asChild onClick={() => setCartOpen(false)}>
                <Link href="/shop">Start shopping</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="border-b border-border bg-muted/50 px-6 py-4">
              <p className="flex items-center gap-2 text-[13px]">
                <Truck className="size-4 text-accent" />
                {remaining > 0 ? (
                  <span>
                    You&apos;re <strong>{formatPKR(remaining)}</strong> away from <strong>free delivery</strong>
                  </span>
                ) : (
                  <span className="font-semibold text-success">You&apos;ve unlocked free delivery 🎉</span>
                )}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {list.map((i) => (
                <CartLine key={i.key} item={i} compact onNavigate={() => setCartOpen(false)} />
              ))}
            </ul>
            <div className="space-y-4 border-t border-border bg-surface px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold tabular-nums">{formatPKR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Delivery & discounts calculated at checkout.</p>
              <div className="grid gap-2">
                <Button asChild size="lg" onClick={() => setCartOpen(false)}>
                  <Link href="/checkout">Checkout securely</Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setCartOpen(false)}>
                  <Link href="/cart">View bag</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
