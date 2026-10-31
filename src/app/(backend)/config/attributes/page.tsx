import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { ListView } from "@/components/odoo/list-view";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NewAttributeDialog } from "./new-attribute-dialog";

export const metadata = { title: "Attributes" };

export default async function AttributesPage() {
  const user = await requireStaff();
  const attrs = await prisma.productAttribute.findMany({
    orderBy: { name: "asc" },
    include: { values: { orderBy: { name: "asc" } } },
  });
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Attributes" }]}
        actions={user.role === "ADMIN" && <NewAttributeDialog />}
      />
      <ListView>
        <Table>
          <THead>
            <TR>
              <TH>Attribute</TH>
              <TH>Values</TH>
            </TR>
          </THead>
          <TBody>
            {attrs.map((a) => (
              <ClickableRow key={a.id} href={`/config/attributes/${a.id}`}>
                <TD className="w-56 font-medium">{a.name}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {a.values.map((v) => (
                      <Badge key={v.id} variant="gray">
                        {v.name}
                        {v.defaultExtra > 0 && ` (+${money(v.defaultExtra)})`}
                      </Badge>
                    ))}
                  </div>
                </TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
