import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { billingLabel } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { ListView } from "@/components/odoo/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Recurring Plans" };

export default async function PlansPage() {
  const user = await requireStaff();
  const plans = await prisma.recurringPlan.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { subscriptions: { where: { status: { in: ["ACTIVE", "PAUSED"] } } } } } },
  });
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Recurring Plans" }]}
        actions={user.role === "ADMIN" && (
          <Button size="sm" asChild><Link href="/config/plans/new"><Plus /> New</Link></Button>
        )}
      />
      <ListView>
        <Table>
          <THead>
            <TR>
              <TH>Plan</TH><TH>Billing</TH><TH className="text-right">Price</TH><TH className="text-right">Min. Qty</TH>
              <TH>Available</TH><TH>Options</TH><TH className="text-right">Running</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {plans.map((p) => (
              <ClickableRow key={p.id} href={`/config/plans/${p.id}`}>
                <TD className="font-medium">{p.name}</TD>
                <TD>{billingLabel(p.billingPeriod, p.billingInterval)}</TD>
                <TD className="text-right tabular-nums">{money(p.price)}</TD>
                <TD className="text-right tabular-nums">{p.minQuantity}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">
                  {p.startDate || p.endDate ? `${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}` : "Always"}
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {p.autoClose && <Badge variant="gray">Auto-close</Badge>}
                    {p.closable && <Badge variant="gray">Closable</Badge>}
                    {p.pausable && <Badge variant="gray">Pausable</Badge>}
                    {p.renewable && <Badge variant="gray">Renewable</Badge>}
                  </div>
                </TD>
                <TD className="text-right tabular-nums">{p._count.subscriptions}</TD>
                <TD><ActiveBadge active={p.active} /></TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
