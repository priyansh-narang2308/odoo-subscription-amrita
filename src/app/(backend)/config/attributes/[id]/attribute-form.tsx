"use client";

import { useState } from "react";
import type { AttributeValue, ProductAttribute } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type Row = { key: string; id?: string; name: string; defaultExtra: number };

export function AttributeForm({
  attribute,
  readOnly,
  save,
  remove,
}: {
  attribute: (ProductAttribute & { values: AttributeValue[] }) | null;
  readOnly: boolean;
  save: FormAction;
  remove?: () => Promise<ActionState>;
}) {
  const [rows, setRows] = useState<Row[]>(
    attribute?.values.map((v) => ({
      key: v.id,
      id: v.id,
      name: v.name,
      defaultExtra: v.defaultExtra,
    })) ?? [],
  );
  const update = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/attributes"
      breadcrumbs={[
        { label: "Attributes", href: "/config/attributes" },
        { label: attribute?.name ?? "New" },
      ]}
      header={
        remove &&
        !readOnly && (
          <ActionButton
            variant="secondary"
            action={remove}
            confirm="Delete this attribute? Product variants using its values will be removed."
          >
            <Trash2 /> Delete
          </ActionButton>
        )
      }
    >
      {(e) => (
        <>
          <input
            type="hidden"
            name="values"
            value={JSON.stringify(
              rows.map(({ id, name, defaultExtra }) => ({
                id,
                name,
                defaultExtra,
              })),
            )}
          />
          <div className="max-w-xl">
            <FormRow
              label="Attribute Name"
              htmlFor="name"
              error={e.name}
              required
            >
              <Input
                id="name"
                name="name"
                defaultValue={attribute?.name}
                placeholder="e.g. Brand"
                required
              />
            </FormRow>
          </div>
          <div className="mt-6">
            <Table>
              <THead>
                <TR>
                  <TH>Value</TH>
                  <TH className="w-48 text-right">Default Extra Price</TH>
                  <TH className="w-10" />
                </TR>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.key}>
                    <TD>
                      <Input
                        value={r.name}
                        onChange={(ev) =>
                          update(r.key, { name: ev.target.value })
                        }
                        placeholder="e.g. Odoo"
                      />
                    </TD>
                    <TD>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right"
                        value={r.defaultExtra}
                        onChange={(ev) =>
                          update(r.key, {
                            defaultExtra: Number(ev.target.value),
                          })
                        }
                      />
                    </TD>
                    <TD>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            setRows((x) => x.filter((y) => y.key !== r.key))
                          }
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove value"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {!readOnly && (
              <button
                type="button"
                onClick={() =>
                  setRows((x) => [
                    ...x,
                    { key: crypto.randomUUID(), name: "", defaultExtra: 0 },
                  ])
                }
                className="mt-2 flex items-center gap-1 px-3 text-[13px] text-primary hover:underline"
              >
                <Plus className="size-4" /> Add a value
              </button>
            )}
          </div>
        </>
      )}
    </RecordForm>
  );
}
