"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { adminDemoMode } from "@/lib/admin/live";
import { AButton } from "./ui";

function Splash({ label }: { label: string }) {
  return (
    <div className="admin-skin grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-emerald font-display text-2xl font-semibold text-[#f2efea]">AH</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-accent" /> {label}
        </span>
      </div>
    </div>
  );
}

/** Client-side gate for /admin. The real protection is server-side (custom claims in API + Firestore rules). */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff, refreshClaims, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [phase, setPhase] = useState<"idle" | "checking" | "done">("idle");

  useEffect(() => {
    if (adminDemoMode || loading) return;
    if (!user) {
      router.replace(`/admin/login?next=${encodeURIComponent(path)}`);
      return;
    }
    if (!isStaff && phase === "idle") {
      // role may have been granted after this token was issued → refresh once
      Promise.resolve()
        .then(() => setPhase("checking"))
        .then(() => refreshClaims())
        .catch(() => undefined)
        .finally(() => setPhase("done"));
    }
  }, [user, loading, isStaff, path, router, refreshClaims, phase]);

  if (adminDemoMode) return <>{children}</>;
  if (loading || !user) return <Splash label="Checking your access…" />;
  if (!isStaff && phase !== "done") return <Splash label="Verifying admin access…" />;
  if (!isStaff)
    return (
      <div className="admin-skin grid min-h-dvh place-items-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sale/10 text-sale">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-5 text-xl font-bold">No admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as <b className="text-foreground">{user.email}</b>, but this account is not an admin or staff member yet.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <AButton
              variant="primary"
              onClick={async () => {
                await signOut();
                router.replace("/admin/login");
              }}
            >
              Sign in with another account
            </AButton>
            <AButton variant="subtle" asChild>
              <Link href="/">Back to store</Link>
            </AButton>
          </div>
        </div>
      </div>
    );
  return <>{children}</>;
}
