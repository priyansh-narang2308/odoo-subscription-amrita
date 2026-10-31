import { cn } from "@/lib/utils";

/** Horizontal single-hue bar list: label, bar, value. */
export function BarList({
  items,
  format = (v) => String(v),
  color = "bg-[#714b67]",
}: {
  items: { label: string; value: number; hint?: string; color?: string }[];
  format?: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-xs text-muted-foreground">No data for this selection.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label} title={`${i.label}: ${format(i.value)}`}>
          <div className="mb-1 flex justify-between gap-2 text-[13px]">
            <span className="truncate">{i.label}{i.hint && <span className="ml-1 text-xs text-muted-foreground">{i.hint}</span>}</span>
            <span className="shrink-0 font-medium tabular-nums">{format(i.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className={cn("h-2 rounded-full", i.color ?? color)} style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
