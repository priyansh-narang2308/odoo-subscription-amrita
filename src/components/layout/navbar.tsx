"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Grip, LogOut, Menu, UserRound } from "lucide-react";
import { appForPath } from "@/lib/apps";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { logoutAction } from "@/actions/auth";
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

export function Navbar({ user }: { user: { name: string; email: string; role: Role } }) {
  const pathname = usePathname();
  const app = appForPath(pathname);
  const isAdmin = user.role === "ADMIN";

  const linkCls = (href: string) => {
    const base = href.split("?")[0]!;
    const active = pathname === base || pathname.startsWith(`${base}/`);
    return cn(
      "flex h-full items-center px-3 text-[13px] text-white/90 hover:bg-black/10 hover:text-white",
      active && !href.includes("?") && "bg-black/15 text-white",
    );
  };

  return (
    <header className="no-print sticky top-0 z-40 h-[46px] bg-[#714b67] text-white shadow-sm">
      <div className="flex h-full items-center">
        <Link href="/home" className="flex h-full items-center px-3.5 hover:bg-black/10" aria-label="Home menu">
          <Grip className="size-5" />
        </Link>
        {app ? (
          <>
            <Link href={app.href} className="flex h-full items-center pl-1 pr-3 text-[15px] font-semibold hover:bg-black/10">
              {app.name}
            </Link>
            {/* Small screens: the app menus collapse into one dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-full items-center px-2.5 outline-none hover:bg-black/10 data-[state=open]:bg-black/15 md:hidden"
                aria-label={`${app.name} menu`}
              >
                <Menu className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {app.menus.map((m) =>
                  "items" in m ? (
                    <div key={m.label}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{m.label}</DropdownMenuLabel>
                      {m.items
                        .filter((i) => !i.adminOnly || isAdmin)
                        .map((i) => (
                          <DropdownMenuItem key={i.href} asChild>
                            <Link href={i.href}>{i.label}</Link>
                          </DropdownMenuItem>
                        ))}
                    </div>
                  ) : (
                    (!m.adminOnly || isAdmin) && (
                      <DropdownMenuItem key={m.href} asChild>
                        <Link href={m.href}>{m.label}</Link>
                      </DropdownMenuItem>
                    )
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <nav className="hidden h-full items-center md:flex">
              {app.menus.map((m) =>
                "items" in m ? (
                  <DropdownMenu key={m.label}>
                    <DropdownMenuTrigger className="flex h-full items-center gap-1 px-3 text-[13px] text-white/90 outline-none hover:bg-black/10 hover:text-white data-[state=open]:bg-black/15">
                      {m.label} <ChevronDown className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {m.items
                        .filter((i) => !i.adminOnly || isAdmin)
                        .map((i) => (
                          <DropdownMenuItem key={i.href} asChild>
                            <Link href={i.href}>{i.label}</Link>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  (!m.adminOnly || isAdmin) && (
                    <Link key={m.href} href={m.href} className={linkCls(m.href)}>
                      {m.label}
                    </Link>
                  )
                ),
              )}
            </nav>
          </>
        ) : (
          <span className="pl-1 text-[15px] font-semibold">Brightloop</span>
        )}

        <div className="ml-auto flex h-full items-center">
          <span className="mr-2 hidden text-xs text-white/70 sm:block">Brightloop Software</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-full items-center gap-2 px-3 outline-none hover:bg-black/10 data-[state=open]:bg-black/15">
              <Avatar name={user.name} className="size-6 bg-white/20" />
              <span className="hidden text-[13px] sm:block">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-[13px] font-semibold text-foreground">{user.name}</p>
                <p className="truncate">{user.email}</p>
                <p className="mt-0.5 text-[11px] text-primary">{ROLE_LABEL[user.role]}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserRound /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => logoutAction()}>
                <LogOut /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
