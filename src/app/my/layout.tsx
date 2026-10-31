import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { AppSidebar, SIDEBAR_COOKIE, SidebarProvider } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortal();
  const [jar, myQuotations, myUnpaid] = await Promise.all([
    cookies(),
    prisma.subscription.count({ where: { customerId: user.customerId, status: "QUOTATION" } }),
    prisma.invoice.count({ where: { customerId: user.customerId, status: "CONFIRMED" } }),
  ]);

  return (
    <SidebarProvider defaultExpanded={jar.get(SIDEBAR_COOKIE)?.value !== "false"}>
      <div className="flex min-h-screen bg-[#f6f7f9]">
        <AppSidebar
          user={{ name: user.name, email: user.email, role: user.role }}
          counts={{ myQuotations, myUnpaid }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar role={user.role} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
          <footer className="no-print py-6 text-center text-xs text-muted-foreground">
            Brightloop Software · Need help? billing@brightloop.test
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
