import { requirePortal } from "@/lib/auth";
import { PortalHeader } from "@/components/layout/portal-header";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortal();
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <PortalHeader name={user.name} email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="no-print py-8 text-center text-xs text-muted-foreground">Brightloop Software · Need help? billing@brightloop.test</footer>
    </div>
  );
}
