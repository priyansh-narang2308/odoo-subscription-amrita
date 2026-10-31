import {
  BarChart3,
  Boxes,
  FileText,
  RefreshCcw,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/constants";

export type MenuItem = { label: string; href: string; adminOnly?: boolean };
export type MenuGroup = { label: string; items: MenuItem[] };
export type AppDef = {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  color: string; // gradient for the home tile
  description: string;
  match: string[]; // path prefixes owned by the app
  menus: (MenuItem | MenuGroup)[];
  roles: Role[];
};

const STAFF: Role[] = ["ADMIN", "INTERNAL"];

export const APPS: AppDef[] = [
  {
    id: "subscriptions",
    name: "Subscriptions",
    href: "/subscriptions",
    icon: RefreshCcw,
    color: "from-[#8f5a86] to-[#5e3a56]",
    description: "Quotations, recurring orders and renewals",
    match: ["/subscriptions", "/config/plans", "/config/templates"],
    roles: STAFF,
    menus: [
      { label: "Subscriptions", href: "/subscriptions" },
      { label: "Quotations", href: "/subscriptions?filter=quotations" },
      { label: "Customers", href: "/customers" },
      {
        label: "Configuration",
        items: [
          { label: "Recurring Plans", href: "/config/plans" },
          { label: "Quotation Templates", href: "/config/templates" },
          { label: "Products", href: "/products" },
        ],
      },
    ],
  },
  {
    id: "invoicing",
    name: "Invoicing",
    href: "/invoices",
    icon: FileText,
    color: "from-[#16a3a9] to-[#016a70]",
    description: "Invoices, payments, taxes and discounts",
    match: ["/invoices", "/payments", "/config/taxes", "/config/payment-terms", "/config/discounts"],
    roles: STAFF,
    menus: [
      { label: "Invoices", href: "/invoices" },
      { label: "Payments", href: "/payments" },
      { label: "Overdue", href: "/invoices?filter=overdue" },
      {
        label: "Configuration",
        items: [
          { label: "Taxes", href: "/config/taxes" },
          { label: "Payment Terms", href: "/config/payment-terms" },
          { label: "Discounts", href: "/config/discounts" },
        ],
      },
    ],
  },
  {
    id: "products",
    name: "Products",
    href: "/products",
    icon: Boxes,
    color: "from-[#f0a63a] to-[#d27d0b]",
    description: "Catalog, prices and variants",
    match: ["/products", "/config/attributes"],
    roles: STAFF,
    menus: [
      { label: "Products", href: "/products" },
      { label: "Attributes", href: "/config/attributes" },
    ],
  },
  {
    id: "contacts",
    name: "Customers",
    href: "/customers",
    icon: Users,
    color: "from-[#5b8fd6] to-[#3a66a8]",
    description: "Customer directory and portal access",
    match: ["/customers"],
    roles: STAFF,
    menus: [{ label: "Customers", href: "/customers" }],
  },
  {
    id: "reporting",
    name: "Reporting",
    href: "/dashboard",
    icon: BarChart3,
    color: "from-[#e46a6a] to-[#b83f3f]",
    description: "MRR, revenue, payments and overdue invoices",
    match: ["/dashboard"],
    roles: STAFF,
    menus: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Overdue Invoices", href: "/invoices?filter=overdue" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    href: "/users",
    icon: Settings,
    color: "from-[#7b7f8a] to-[#4d5059]",
    description: "Users, roles and access",
    match: ["/users"],
    roles: ["ADMIN"],
    menus: [{ label: "Users", href: "/users" }],
  },
];

export function appForPath(pathname: string) {
  return APPS.find((a) => a.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)));
}

export function appsFor(role: Role) {
  return APPS.filter((a) => a.roles.includes(role));
}
