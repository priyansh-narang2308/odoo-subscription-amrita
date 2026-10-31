"use client";

import { useState } from "react";
import { money, moneyCompact } from "@/lib/format";

type Point = { label: string; year: number; collected: number; invoiced: number };

const SERIES = [
  { key: "invoiced", label: "Invoiced", color: "#c7b3c2" },
  { key: "collected", label: "Collected", color: "#714b67" },
] as const;

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / 2) * 2 * p;
}

/** Monthly invoiced vs collected, grouped bars on one axis, with hover tooltip. */
export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 240, L = 52, R = 8, T = 12, B = 26;
  const max = niceMax(Math.max(...data.flatMap((d) => [d.collected, d.invoiced])));
  const slot = (W - L - R) / data.length;
  const bw = Math.min(14, (slot - 10) / 2);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div className="relative">
      <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Invoiced and collected revenue by month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeDasharray={t === 0 ? undefined : "3 3"} />
            <text x={L - 6} y={y(t) + 3} textAnchor="end" className="fill-gray-500 text-[10px]">{moneyCompact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = L + i * slot + slot / 2 - bw - 1;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={L + i * slot} y={T} width={slot} height={H - T - B} fill={hover === i ? "#f5f0f4" : "transparent"} />
              {SERIES.map((s, k) => {
                const v = d[s.key];
                const top = y(v);
                const h = Math.max(0, H - B - top);
                return h > 0 ? (
                  <path
                    key={s.key}
                    d={`M${x0 + k * (bw + 2)},${H - B} V${top + Math.min(4, h)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${H - B} Z`}
                    fill={s.color}
                  />
                ) : null;
              })}
              <text x={L + i * slot + slot / 2} y={H - 8} textAnchor="middle" className="fill-gray-500 text-[10px]">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 rounded-sm border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `clamp(0px, calc(${((L + hover * slot + slot / 2) / W) * 100}% - 70px), calc(100% - 150px))` }}
        >
          <p className="mb-0.5 font-semibold">{data[hover]!.label} {data[hover]!.year}</p>
          {SERIES.slice().reverse().map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-sm" style={{ background: s.color }} />{s.label}</span>
              <span className="tabular-nums">{money(data[hover]![s.key])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
