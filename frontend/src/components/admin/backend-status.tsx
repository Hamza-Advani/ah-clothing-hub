"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Info, ServerOff } from "lucide-react";
import { adminDemoMode } from "@/lib/admin/live";
import { cn } from "@/lib/utils";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
type Health = { state: "checking" } | { state: "down" } | { state: "up"; firebase: boolean; cloudinary: boolean; resend: boolean };

/** Shows what is missing on the backend so admin saves don't fail silently. Re-checks every 20s. */
export function BackendStatus() {
  const [h, setH] = useState<Health>({ state: "checking" });
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (adminDemoMode || !BASE) return;
    let alive = true;
    const check = () =>
      fetch(`${BASE}/api/health`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => alive && setH({ state: "up", firebase: !!j.configured?.firebase, cloudinary: !!j.configured?.cloudinary, resend: !!j.configured?.resend }))
        .catch(() => alive && setH({ state: "down" }));
    check();
    const t = setInterval(check, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (adminDemoMode) return null;

  const problems: { title: string; steps: string[]; severe: boolean }[] = [];
  if (!BASE) problems.push({ severe: true, title: "Backend URL missing", steps: ["Add NEXT_PUBLIC_API_URL=http://localhost:4000 to frontend/.env.local", "Restart the frontend (npm run dev)"] });
  else if (h.state === "down")
    problems.push({ severe: true, title: `Backend is not running (${BASE})`, steps: ["Open a terminal in the project folder", "Run: npm run dev   (starts backend + frontend together)", "Or only the backend: cd backend → npm run dev"] });
  else if (h.state === "up") {
    if (!h.firebase)
      problems.push({
        severe: true,
        title: "Backend can't save yet — Firebase Admin key is missing",
        steps: [
          "Firebase Console → ⚙ Project settings → Service accounts",
          "Click “Generate new private key” → a .json file downloads",
          "Put that .json file inside the backend/ folder (it is never uploaded to GitHub)",
          "Restart the backend — this banner disappears when it's connected",
        ],
      });
    if (!h.cloudinary) problems.push({ severe: false, title: "Image uploads are off — Cloudinary not configured", steps: ["Add CLOUDINARY_CLOUD_NAME (and key/secret) to backend/.env", "Also add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to frontend/.env.local", "Restart both servers"] });
    if (!h.resend) problems.push({ severe: false, title: "Emails are off — RESEND_API_KEY not set", steps: ["Create a key at resend.com → add RESEND_API_KEY to backend/.env → restart backend"] });
  }
  if (!problems.length) return null;
  const severe = problems.some((p) => p.severe);

  return (
    <div className={cn("mb-6 rounded-xl border px-4 py-3 text-sm", severe ? "border-sale/40 bg-sale/8" : "border-warning/40 bg-warning/10")} role="status">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left font-semibold">
        {h.state === "down" ? <ServerOff className="size-4 shrink-0 text-sale" /> : severe ? <AlertTriangle className="size-4 shrink-0 text-sale" /> : <Info className="size-4 shrink-0 text-warning" />}
        <span className="flex-1">{problems[0].title}{problems.length > 1 ? ` (+${problems.length - 1} more)` : ""}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 pl-6">
          {problems.map((p) => (
            <div key={p.title}>
              {problems.length > 1 && <p className="font-semibold">{p.title}</p>}
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[13px] text-foreground/80">
                {p.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
