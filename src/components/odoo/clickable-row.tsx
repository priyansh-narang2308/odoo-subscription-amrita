"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** List row that opens the record, Odoo style. */
export function ClickableRow({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input,label")) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
      onMouseEnter={() => router.prefetch(href)}
      className={cn("cursor-pointer border-b transition-colors hover:bg-[#f5f0f4]", className)}
    >
      {children}
    </tr>
  );
}
