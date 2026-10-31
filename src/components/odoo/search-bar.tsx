"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Filter, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

/**
 * Odoo-like search view: free-text search plus a single "filter" facet,
 * all reflected in the URL (?q=…&filter=…) so lists are shareable and server-rendered.
 */
export function SearchBar({ placeholder = "Search...", filters = [] }: { placeholder?: string; filters?: FilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const active = params.get("filter");
  const activeLabel = filters.find((f) => f.value === active)?.label;

  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  function push(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className="flex w-full items-center gap-1 lg:w-[460px]">
      <form
        className={cn(
          "flex h-8 flex-1 items-center gap-1.5 rounded-sm border border-input bg-card px-2 focus-within:border-primary",
          pending && "opacity-70",
        )}
        onSubmit={(e) => {
          e.preventDefault();
          push({ q: q.trim() || null });
        }}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        {activeLabel && (
          <span className="flex shrink-0 items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 text-[12px] text-accent-foreground">
            <Filter className="size-3" />
            {activeLabel}
            <button type="button" onClick={() => push({ filter: null })} aria-label="Remove filter">
              <X className="size-3" />
            </button>
          </span>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); push({ q: null }); }} aria-label="Clear search">
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </form>
      {filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 items-center gap-1 rounded-sm border border-input bg-card px-2.5 text-[13px] hover:bg-muted">
            <Filter className="size-3.5" /> Filters
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            {filters.map((f) => (
              <DropdownMenuItem
                key={f.value}
                onSelect={() => push({ filter: active === f.value ? null : f.value })}
                className={cn(active === f.value && "font-semibold text-primary")}
              >
                {active === f.value ? "✓ " : ""}
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
