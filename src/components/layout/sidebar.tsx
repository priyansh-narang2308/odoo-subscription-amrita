"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog as Sheet } from "radix-ui";
import {
  ChevronsUpDown,
  Globe,
  Lock,
  LogOut,
  PanelLeft,
  UserRound,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import {
  activeNavItem,
  navFor,
  type NavBadge,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { BrandMark } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const SIDEBAR_COOKIE = "sidebar_state";

type SidebarCtx = {
  expanded: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
}

export function SidebarProvider({
  defaultExpanded,
  children,
}: {
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    // Below md the trigger opens the drawer; above it collapses the rail
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen((o) => !o);
      return;
    }
    setExpanded((e) => {
      document.cookie = `${SIDEBAR_COOKIE}=${!e}; path=/; max-age=31536000; samesite=lax`;
      return !e;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo(
    () => ({ expanded, toggle, mobileOpen, setMobileOpen }),
    [expanded, toggle, mobileOpen],
  );
  return (
    <Ctx.Provider value={value}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </Ctx.Provider>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle, expanded } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle sidebar"
          aria-expanded={expanded}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900",
            className,
          )}
        >
          <PanelLeft className="size-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Toggle sidebar{" "}
        <kbd className="ml-1 rounded bg-white/15 px-1 font-sans">⌘B</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

type User = { name: string; email: string; role: Role };
type Counts = Partial<Record<NavBadge, number>>;

export function AppSidebar({ user, counts }: { user: User; counts: Counts }) {
  const { expanded, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Close the drawer after navigating on phones
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  return (
    <>
      <aside
        data-state={expanded ? "expanded" : "collapsed"}
        className={cn(
          "no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-gray-200 bg-[#fbfafb] transition-[width] duration-200 ease-out md:flex",
          expanded ? "w-64" : "w-[60px]",
        )}
      >
        <SidebarBody user={user} counts={counts} collapsed={!expanded} />
      </aside>

      <Sheet.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Sheet.Portal>
          <Sheet.Overlay className="fade-in fixed inset-0 z-50 bg-black/40 md:hidden" />
          <Sheet.Content className="slide-in-left fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#fbfafb] shadow-2xl focus:outline-none md:hidden">
            <Sheet.Title className="sr-only">Navigation</Sheet.Title>
            <Sheet.Description className="sr-only">Main menu</Sheet.Description>
            <Sheet.Close
              className="absolute right-3 top-4 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Sheet.Close>
            <SidebarBody user={user} counts={counts} collapsed={false} />
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}

function SidebarBody({
  user,
  counts,
  collapsed,
}: {
  user: User;
  counts: Counts;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const groups = useMemo(() => navFor(user.role), [user.role]);
  const active = activeNavItem(groups, pathname, search)?.item;
  const readOnly = user.role !== "ADMIN";

  return (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-200/70",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Link
          href="/home"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Home"
        >
          <BrandMark className="size-8 shrink-0" />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold tracking-tight text-[#714b67]">
                bright<span className="text-[#017e84]">loop</span>
              </span>
              <span className="block truncate text-[11px] text-gray-500">
                Subscription Management
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-3",
          collapsed ? "px-2" : "px-3",
        )}
        aria-label="Main"
      >
        {groups.map((g: NavGroup, gi) => (
          <div key={g.label} className={cn(gi > 0 && "mt-4")}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 mb-3 border-t border-gray-200" />
            ) : (
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {g.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <li key={`${item.href}?${item.query ?? ""}`}>
                  <SidebarLink
                    item={item}
                    active={active === item}
                    collapsed={collapsed}
                    count={item.badge ? counts[item.badge] : undefined}
                    locked={readOnly && !!item.adminWrite}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-gray-200/70",
          collapsed ? "p-2" : "p-3",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md text-left outline-none transition-colors hover:bg-gray-100 data-[state=open]:bg-gray-100",
              collapsed ? "justify-center p-1" : "p-2",
            )}
          >
            <Avatar name={user.name} className="size-8 rounded-md" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold text-gray-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-[11px] text-gray-500">
                    {ROLE_LABEL[user.role]}
                  </span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-gray-400" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align={collapsed ? "end" : "start"}
            className="w-60"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="text-[13px] font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound /> My profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">
                <Globe /> View website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logoutAction()}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  count,
  locked,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count?: number;
  locked: boolean;
}) {
  const Icon = item.icon;
  const href = item.query ? `${item.href}?${item.query}` : item.href;
  const alert = item.badge === "overdue";
  const showCount = !!count && count > 0;

  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md text-[13px] transition-colors",
        collapsed ? "justify-center" : "px-2",
        active
          ? "bg-[#f1eaf0] font-semibold text-[#714b67]"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {active && !collapsed && (
        <span
          className="absolute -left-3 top-1.5 h-5 w-[3px] rounded-r bg-[#714b67]"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-[#714b67]" : "text-gray-500 group-hover:text-gray-700",
        )}
      />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && locked && (
        <Lock
          className="size-3 shrink-0 text-gray-400"
          aria-label="Read-only"
        />
      )}
      {!collapsed && showCount && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-[10px] font-semibold leading-[18px] tabular-nums",
            alert ? "bg-red-100 text-red-700" : "bg-gray-200/80 text-gray-700",
          )}
        >
          {count}
        </span>
      )}
      {collapsed && showCount && (
        <span
          className={cn(
            "absolute right-1.5 top-1.5 size-1.5 rounded-full",
            alert ? "bg-red-500" : "bg-[#714b67]",
          )}
          aria-hidden
        />
      )}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {showCount && ` · ${count}`}
        {locked && " · read-only"}
      </TooltipContent>
    </Tooltip>
  );
}
