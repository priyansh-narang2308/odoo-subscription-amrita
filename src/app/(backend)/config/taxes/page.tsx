import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { ListView } from "@/components/odoo/list-view";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Taxes" };

export default async function TaxesPage() {
  const user = await requireStaff();
  const taxes = await prisma.tax.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Taxes" }]}
        actions={user.role === "ADMIN" && (
          <Button size="sm" asChild><Link href="/config/taxes/new"><Plus /> New</Link></Button>
        )}
      />
      <ListView>
        <Table>
          <THead><TR><TH>Tax Name</TH><TH>Computation</TH><TH className="text-right">Amount</TH><TH>Status</TH></TR></THead>
          <TBody>
            {taxes.map((t) => (
              <ClickableRow key={t.id} href={`/config/taxes/${t.id}`}>
                <TD className="font-medium">{t.name}</TD>
                <TD>{t.type === "PERCENT" ? "Percentage of price" : "Fixed amount per unit"}</TD>
                <TD className="text-right tabular-nums">{t.type === "PERCENT" ? `${t.amount}%` : `₹${t.amount.toFixed(2)}`}</TD>
                <TD><ActiveBadge active={t.active} /></TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
