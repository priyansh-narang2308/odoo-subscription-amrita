import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { DISCOUNT_SCOPE_LABEL } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ListView } from "@/components/odoo/list-view";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NewDiscountDialog } from "./new-discount-dialog";

export const metadata = { title: "Discounts" };

function discountState(d: { active: boolean; startDate: Date | null; endDate: Date | null; usageLimit: number | null; usedCount: number }) {
  const now = new Date();
  if (!d.active) return <Badge variant="gray">Archived</Badge>;
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return <Badge variant="red">Used up</Badge>;
  if (d.endDate && d.endDate < now) return <Badge variant="red">Expired</Badge>;
  if (d.startDate && d.startDate > now) return <Badge variant="blue">Scheduled</Badge>;
  return <Badge variant="green">Running</Badge>;
}

export default async function DiscountsPage() {
  const user = await requireStaff();
  const [discounts, products] = await Promise.all([
    prisma.discount.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Discounts" }]}
        actions={user.role === "ADMIN" && (
          <NewDiscountDialog products={products} />
        )}
      />
      <ListView>
        <Table>
          <THead>
            <TR>
              <TH>Discount</TH><TH className="text-right">Value</TH><TH>Applies To</TH><TH>Conditions</TH>
              <TH>Validity</TH><TH className="text-right">Used</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {discounts.map((d) => (
              <ClickableRow key={d.id} href={`/config/discounts/${d.id}`}>
                <TD className="font-medium">{d.name}</TD>
                <TD className="text-right tabular-nums">{d.type === "PERCENT" ? `${d.value}%` : money(d.value)}</TD>
                <TD>{DISCOUNT_SCOPE_LABEL[d.appliesTo]}</TD>
                <TD className="text-muted-foreground">
                  {[d.minPurchase > 0 && `Min. ${money(d.minPurchase)}`, d.minQuantity > 0 && `Min. qty ${d.minQuantity}`].filter(Boolean).join(" · ") || "None"}
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">{d.startDate || d.endDate ? `${fmtDate(d.startDate)} → ${fmtDate(d.endDate)}` : "Always"}</TD>
                <TD className="text-right tabular-nums">{d.usedCount}{d.usageLimit !== null && ` / ${d.usageLimit}`}</TD>
                <TD>{discountState(d)}</TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
