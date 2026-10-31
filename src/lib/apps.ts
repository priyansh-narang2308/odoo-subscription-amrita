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

/** Tiles on the staff home page. Navigation itself lives in lib/nav.ts. */
export type AppDef = {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  color: string; // gradient for the tile icon
  description: string;
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
    roles: STAFF,
  },
  {
    id: "invoicing",
    name: "Invoicing",
    href: "/invoices",
    icon: FileText,
    color: "from-[#16a3a9] to-[#016a70]",
    description: "Invoices, payments, taxes and discounts",
    roles: STAFF,
  },
  {
    id: "products",
    name: "Products",
    href: "/products",
    icon: Boxes,
    color: "from-[#f0a63a] to-[#d27d0b]",
    description: "Catalog, prices and variants",
    roles: STAFF,
  },
  {
    id: "contacts",
    name: "Customers",
    href: "/customers",
    icon: Users,
    color: "from-[#5b8fd6] to-[#3a66a8]",
    description: "Customer directory and portal access",
    roles: STAFF,
  },
  {
    id: "reporting",
    name: "Reporting",
    href: "/dashboard",
    icon: BarChart3,
    color: "from-[#e46a6a] to-[#b83f3f]",
    description: "MRR, revenue, payments and overdue invoices",
    roles: STAFF,
  },
  {
    id: "settings",
    name: "Users",
    href: "/users",
    icon: Settings,
    color: "from-[#7b7f8a] to-[#4d5059]",
    description: "Staff accounts, roles and access",
    roles: ["ADMIN"],
  },
];

export function appsFor(role: Role) {
  return APPS.filter((a) => a.roles.includes(role));
}
