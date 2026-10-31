"use client";

import { useState } from "react";
import { Shapes } from "lucide-react";
import { saveAttribute } from "@/actions/attributes";
import { CreateDialog } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

export function NewAttributeDialog() {
  return (
    <CreateDialog
      action={saveAttribute.bind(null, null)}
      icon={Shapes}
      title="New attribute"
      description="Attributes such as Brand or Edition let products have priced variants."
      submitLabel="Create & open"
    >
      {(e) => <AttributeFields e={e} />}
    </CreateDialog>
  );
}

function AttributeFields({ e }: { e: Record<string, string> }) {
  const [raw, setRaw] = useState("");
  const values = [
    ...new Set(
      raw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <>
      <Field label="Attribute name" htmlFor="a-name" error={e.name} required>
        <Input
          id="a-name"
          name="name"
          placeholder="e.g. Brand"
          required
          autoFocus
        />
      </Field>
      <Field
        label="Values"
        htmlFor="a-values"
        hint="Separate with commas. Price extras are set on the next screen."
      >
        <Input
          id="a-values"
          value={raw}
          onChange={(ev) => setRaw(ev.target.value)}
          placeholder="e.g. Odoo, Brightloop"
        />
      </Field>
      <input
        type="hidden"
        name="values"
        value={JSON.stringify(
          values.map((name) => ({ name, defaultExtra: 0 })),
        )}
      />
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
