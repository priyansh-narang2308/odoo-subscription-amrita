import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/** Odoo control panel: breadcrumbs + primary actions on the left, search/pager on the right. */
export function ControlPanel({
  breadcrumbs,
  actions,
  right,
  className,
}: {
  breadcrumbs: Crumb[];
  actions?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("no-print border-b bg-card px-4 py-2.5", className)}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          <nav className="flex min-w-0 items-center gap-1 text-[17px]">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {c.href && !last ? (
                    <Link href={c.href} className="truncate text-primary hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cn("truncate", last && "font-medium")}>{c.label}</span>
                  )}
                  {!last && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                </span>
              );
            })}
          </nav>
        </div>
        {right && <div className="flex flex-wrap items-center gap-2 lg:justify-end">{right}</div>}
      </div>
    </div>
  );
}
