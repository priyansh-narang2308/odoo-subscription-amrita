import {
  BadgePercent,
  BarChart3,
  Boxes,
  CalendarClock,
  CircleAlert,
  CreditCard,
  FileSignature,
  FileText,
  Home,
  Landmark,
  LayoutTemplate,
  Receipt,
  RefreshCcw,
  Shapes,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/constants";

/** Live counters shown as badges next to sidebar items. */
export type NavBadge = "quotations" | "overdue" | "draftInvoices" | "myQuotations" | "myUnpaid";

/** Badges that signal money or action that is late, shown in red. */
export const ALERT_BADGES: NavBadge[] = ["overdue", "myUnpaid"];

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra path prefixes that keep this item highlighted (e.g. record pages). */
  match?: string[];
  /** Query string that must be present for this item to be the active one. */
  query?: string;
  badge?: NavBadge;
  /** Internal users can open these pages but not change them. */
  adminWrite?: boolean;
  roles?: Role[];
};

export type NavGroup = { label: string; items: NavItem[]; roles?: Role[] };

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Home", href: "/home", icon: Home },
      { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Subscriptions", href: "/subscriptions", icon: RefreshCcw },
      { label: "Quotations", href: "/subscriptions", query: "filter=quotations", icon: FileSignature, badge: "quotations" },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Invoices", href: "/invoices", icon: FileText, badge: "draftInvoices" },
      { label: "Overdue", href: "/invoices", query: "filter=overdue", icon: CircleAlert, badge: "overdue" },
      { label: "Payments", href: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Boxes, adminWrite: true },
      { label: "Attributes", href: "/config/attributes", icon: Shapes, adminWrite: true },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Recurring Plans", href: "/config/plans", icon: CalendarClock, adminWrite: true },
      { label: "Quotation Templates", href: "/config/templates", icon: LayoutTemplate, adminWrite: true },
      { label: "Taxes", href: "/config/taxes", icon: Landmark, adminWrite: true },
      { label: "Payment Terms", href: "/config/payment-terms", icon: Receipt, adminWrite: true },
      { label: "Discounts", href: "/config/discounts", icon: BadgePercent, adminWrite: true },
    ],
  },
  {
    label: "Administration",
    roles: ["ADMIN"],
    items: [{ label: "Users", href: "/users", icon: UserCog }],
  },
];

/** The customer portal has its own, much smaller menu. */
export const PORTAL_NAV: NavGroup[] = [
  {
    label: "My account",
    items: [
      { label: "Overview", href: "/my", icon: Home },
      { label: "Subscriptions", href: "/my/subscriptions", icon: RefreshCcw, badge: "myQuotations" },
      { label: "Invoices", href: "/my/invoices", icon: FileText, badge: "myUnpaid" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Profile", href: "/my/profile", icon: UserRound }],
  },
];

export function navFor(role: Role) {
  if (role === "PORTAL") return PORTAL_NAV;
  return NAV.filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((g) => g.items.length);
}

/** The single item that should be highlighted for the current URL. */
export function activeNavItem(groups: NavGroup[], pathname: string, search: string) {
  const params = new URLSearchParams(search);
  let best: { item: NavItem; group: NavGroup; score: number } | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      const prefixes = [item.href, ...(item.match ?? [])];
      if (!prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) continue;
      let score = item.href.length;
      if (item.query) {
        const [k, v] = item.query.split("=") as [string, string];
        if (params.get(k) !== v) continue;
        score += 100;
      }
      if (!best || score > best.score) best = { item, group, score };
    }
  }
  return best;
}
