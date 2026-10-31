import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { startOfDay } from "@/lib/format";
import { AppSidebar, SIDEBAR_COOKIE, SidebarProvider } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function BackendLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const [jar, quotations, overdue, draftInvoices] = await Promise.all([
    cookies(),
    prisma.subscription.count({ where: { status: { in: ["DRAFT", "QUOTATION"] } } }),
    prisma.invoice.count({ where: { status: "CONFIRMED", dueDate: { lt: startOfDay(new Date()) } } }),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
  ]);

  return (
    <SidebarProvider defaultExpanded={jar.get(SIDEBAR_COOKIE)?.value !== "false"}>
      <div className="flex min-h-screen">
        <AppSidebar
          user={{ name: user.name, email: user.email, role: user.role }}
          counts={{ quotations, overdue, draftInvoices }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar role={user.role} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
