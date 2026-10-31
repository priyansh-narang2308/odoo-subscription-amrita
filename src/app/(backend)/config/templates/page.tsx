import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { billingLabel } from "@/lib/constants";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NewTemplateDialog } from "./new-template-dialog";

export const metadata = { title: "Quotation Templates" };

export default async function TemplatesPage() {
  const user = await requireStaff();
  const [templates, plans] = await Promise.all([
    prisma.quotationTemplate.findMany({
      orderBy: { name: "asc" },
      include: { plan: true, _count: { select: { lines: true, subscriptions: true } } },
    }),
    prisma.recurringPlan.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Quotation Templates" }]}
        actions={user.role === "ADMIN" && (
          <NewTemplateDialog plans={plans} />
        )}
      />
      <ListView>
        {templates.length === 0 ? (
          <EmptyState title="No quotation templates" hint="Templates pre-fill the plan and product lines of new quotations." />
        ) : (
          <Table>
            <THead><TR><TH>Template</TH><TH>Recurring Plan</TH><TH className="text-right">Validity</TH><TH className="text-right">Lines</TH><TH className="text-right">Used</TH></TR></THead>
            <TBody>
              {templates.map((t) => (
                <ClickableRow key={t.id} href={`/config/templates/${t.id}`}>
                  <TD className="font-medium">{t.name}</TD>
                  <TD>{t.plan ? `${t.plan.name} · ${billingLabel(t.plan.billingPeriod, t.plan.billingInterval)}` : "—"}</TD>
                  <TD className="text-right tabular-nums">{t.validityDays} days</TD>
                  <TD className="text-right tabular-nums">{t._count.lines}</TD>
                  <TD className="text-right tabular-nums">{t._count.subscriptions}</TD>
                </ClickableRow>
              ))}
            </TBody>
          </Table>
        )}
      </ListView>
    </>
  );
}
