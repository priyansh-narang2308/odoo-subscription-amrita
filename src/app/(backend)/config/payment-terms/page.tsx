import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ListView } from "@/components/odoo/list-view";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Payment Terms" };

export default async function PaymentTermsPage() {
  const user = await requireStaff();
  const terms = await prisma.paymentTerm.findMany({
    orderBy: { dueDays: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Payment Terms" }]}
        actions={user.role === "ADMIN" && (
          <Button size="sm" asChild><Link href="/config/payment-terms/new"><Plus /> New</Link></Button>
        )}
      />
      <ListView>
        <Table>
          <THead><TR><TH>Payment Term</TH><TH className="text-right">Due After</TH><TH>Note</TH><TH className="text-right">Subscriptions</TH></TR></THead>
          <TBody>
            {terms.map((t) => (
              <ClickableRow key={t.id} href={`/config/payment-terms/${t.id}`}>
                <TD className="font-medium">{t.name}</TD>
                <TD className="text-right tabular-nums">{t.dueDays === 0 ? "Immediately" : `${t.dueDays} days`}</TD>
                <TD className="max-w-md truncate text-muted-foreground">{t.note}</TD>
                <TD className="text-right tabular-nums">{t._count.subscriptions}</TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
