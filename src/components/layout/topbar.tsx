"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, Globe } from "lucide-react";
import { activeNavItem, navFor } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { SidebarTrigger } from "@/components/layout/sidebar";

export function Topbar({ role }: { role: Role }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const groups = useMemo(() => navFor(role), [role]);
  const hit = activeNavItem(groups, pathname, search);

  return (
    <header className="no-print sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white/90 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
      <nav
        aria-label="Location"
        className="flex min-w-0 items-center gap-1.5 text-[13px]"
      >
        {hit ? (
          <>
            <span className="hidden text-gray-500 sm:inline">
              {hit.group.label}
            </span>
            <ChevronRight className="hidden size-3.5 text-gray-400 sm:inline" />
            <span className="truncate font-medium text-gray-900">
              {hit.item.label}
            </span>
          </>
        ) : (
          <span className="font-medium text-gray-900">
            {pathname === "/profile" ? "My profile" : "Brightloop"}
          </span>
        )}
      </nav>
      <Link
        href="/"
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">Website</span>
      </Link>
    </header>
  );
}
