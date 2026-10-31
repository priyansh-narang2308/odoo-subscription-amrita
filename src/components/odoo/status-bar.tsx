import { cn } from "@/lib/utils";

/** Odoo-style chevron status pipeline shown at the top-right of a form. */
export function StatusBar({
  steps,
  current,
  labels,
}: {
  steps: readonly string[];
  current: string;
  labels: Record<string, string>;
}) {
  const list = steps.includes(current) ? steps : [...steps, current];
  return (
    <div className="flex overflow-hidden rounded-sm border bg-card">
      {list.map((s, i) => {
        const active = s === current;
        return (
          <div
            key={s}
            className={cn(
              "relative flex h-8 items-center whitespace-nowrap pl-5 pr-3 text-[12px] font-medium",
              i === 0 && "pl-3",
              active ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            {labels[s] ?? s}
            {i < list.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute -right-[9px] top-1/2 z-10 size-[22px] -translate-y-1/2 rotate-45 border-r border-t border-border",
                  active ? "bg-accent" : "bg-card",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
