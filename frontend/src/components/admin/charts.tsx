"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactPKR } from "@/lib/admin/analytics";
import { formatPKR } from "@/lib/utils";

export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type Fmt = "pkr" | "num";
const fmt = (v: number, f: Fmt) => (f === "pkr" ? formatPKR(v) : Math.round(v).toLocaleString("en-PK"));
const axisFmt = (f: Fmt) => (v: number) => (f === "pkr" ? compactPKR(v) : compactPKR(v));

const axisProps = { tick: { fill: "var(--muted-foreground)", fontSize: 11 }, tickLine: false, axisLine: false } as const;

type TipProps = { active?: boolean; label?: string | number; payload?: { name?: string; value?: number; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }[]; format: Fmt; names?: Record<string, string> };

function ChartTooltip({ active, payload, label, format, names }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lift">
      {label !== undefined && <p className="mb-1.5 font-semibold text-foreground">{String(payload[0]?.payload?.label ?? payload[0]?.payload?.name ?? label)}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {names?.[String(p.dataKey)] ?? p.name}
          </span>
          <span className="font-semibold tabular-nums text-foreground">{fmt(Number(p.value ?? 0), format)}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

type XY = Record<string, string | number>;

export function TrendArea({ data, dataKey, name, format = "pkr", color = SERIES[0], height = 260 }: { data: XY[]; dataKey: string; name: string; format?: Fmt; color?: string; height?: number }) {
  const id = `g-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} tickFormatter={axisFmt(format)} width={48} />
        <Tooltip content={<ChartTooltip format={format} names={{ [dataKey]: name }} />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#${id})`} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, lines, format = "pkr", height = 260 }: { data: XY[]; lines: { key: string; name: string; color: string }[]; format?: Fmt; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} tickFormatter={axisFmt(format)} width={48} allowDecimals={false} />
        <Tooltip content={<ChartTooltip format={format} names={Object.fromEntries(lines.map((l) => [l.key, l.name]))} />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GroupedBars({ data, bars, format = "pkr", height = 260 }: { data: XY[]; bars: { key: string; name: string; color: string }[]; format?: Fmt; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={2} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={16} />
        <YAxis {...axisProps} tickFormatter={axisFmt(format)} width={48} allowDecimals={false} />
        <Tooltip content={<ChartTooltip format={format} names={Object.fromEntries(bars.map((b) => [b.key, b.name]))} />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({ data, dataKey, labelKey, name, format = "pkr", color = SERIES[0], height }: { data: XY[]; dataKey: string; labelKey: string; name: string; format?: Fmt; color?: string; height?: number }) {
  const h = height ?? Math.max(160, data.length * 36 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data.map((d) => ({ ...d, label: d[labelKey] }))} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" {...axisProps} tickFormatter={axisFmt(format)} />
        <YAxis type="category" dataKey="label" {...axisProps} width={130} tick={{ fill: "var(--foreground)", fontSize: 11.5 }} tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + "…" : v)} />
        <Tooltip content={<ChartTooltip format={format} names={{ [dataKey]: name }} />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, format = "num", height = 220, center }: { data: { name: string; value: number }[]; format?: Fmt; height?: number; center?: { label: string; value: string } }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip content={<ChartTooltip format={format} />} />
            <Pie data={total ? data : [{ name: "No data", value: 1 }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={total ? 2 : 0} stroke="var(--surface)" strokeWidth={2} isAnimationActive>
              {(total ? data : [{ name: "No data", value: 1 }]).map((d, i) => (
                <Cell key={d.name} fill={total ? SERIES[i % SERIES.length] : "var(--muted)"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[22px] font-bold tabular-nums leading-none">{center.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{center.label}</p>
            </div>
          </div>
        )}
      </div>
      <ul className="space-y-2 text-[13px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: SERIES[i % SERIES.length] }} />
              <span className="truncate text-muted-foreground">{d.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {fmt(d.value, format)}
              <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
