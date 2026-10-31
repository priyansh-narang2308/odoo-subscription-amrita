import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** "1-40 / 230" pager with prev/next, preserving other query params. */
export function Pager({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const btn = "flex size-7 items-center justify-center rounded-sm border bg-card hover:bg-muted";
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="tabular-nums">
        {from}-{to} / {total}
      </span>
      <div className="flex gap-0.5">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btn} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}><ChevronLeft className="size-4" /></span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className={btn} aria-label="Next page">
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}><ChevronRight className="size-4" /></span>
        )}
      </div>
    </div>
  );
}

export function parsePage(v: string | undefined) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
