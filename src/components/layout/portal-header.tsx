"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { BrandLogo, BrandMark } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/my", label: "Overview" },
  { href: "/my/subscriptions", label: "Subscriptions" },
  { href: "/my/invoices", label: "Invoices" },
];

export function PortalHeader({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/my" aria-label="Portal home">
          <BrandMark className="sm:hidden" />
          <BrandLogo className="hidden sm:flex" />
        </Link>
        <nav className="flex h-full items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/my" ? pathname === "/my" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn("flex h-full items-center border-b-2 px-2 text-[13px] sm:px-3 font-medium", active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-sm px-2 py-1 outline-none hover:bg-muted">
            <Avatar name={name} className="size-7" />
            <span className="hidden text-[13px] font-medium sm:block">{name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-[13px] font-semibold text-foreground">{name}</p>
              <p className="truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/my/profile"><UserRound /> My Account</Link></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => logoutAction()}><LogOut /> Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
