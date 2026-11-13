"use client";
import { useMemo, useState } from "react";
import { getRange, RANGE_LABELS, type RangeKey } from "@/lib/admin/analytics";
import { AInput, ASelect, Segmented } from "./ui";
import { useNow } from "@/lib/admin/hooks";

export function useRangeState(initial: RangeKey = "7d") {
  const [key, setKey] = useState<RangeKey>(initial);
  const [custom, setCustom] = useState(() => {
    const to = new Date();
    const from = new Date(Date.now() - 29 * 86_400_000);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { from: iso(from), to: iso(to) };
  });
  // minute-level "now" so ranges stay stable while rendering
  const minute = Math.floor(useNow() / 60_000);
  const range = useMemo(() => getRange(key, custom, new Date(minute * 60_000)), [key, custom, minute]);
  return { key, setKey, custom, setCustom, range };
}

const KEYS: RangeKey[] = ["today", "yesterday", "7d", "30d", "month", "year", "custom"];

export function RangePicker({ state }: { state: ReturnType<typeof useRangeState> }) {
  const { key, setKey, custom, setCustom } = state;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented className="hidden xl:inline-flex" value={key} onChange={setKey} options={KEYS.map((k) => ({ value: k, label: RANGE_LABELS[k] }))} />
      <ASelect className="w-40 xl:hidden" value={key} onChange={(e) => setKey(e.target.value as RangeKey)} aria-label="Date range">
        {KEYS.map((k) => (
          <option key={k} value={k}>
            {RANGE_LABELS[k]}
          </option>
        ))}
      </ASelect>
      {key === "custom" && (
        <div className="flex items-center gap-1.5">
          <AInput type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="w-[150px]" aria-label="From date" />
          <span className="text-xs text-muted-foreground">to</span>
          <AInput type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="w-[150px]" aria-label="To date" />
        </div>
      )}
    </div>
  );
}
