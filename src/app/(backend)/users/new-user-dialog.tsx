"use client";

import { UserCog } from "lucide-react";
import { saveStaff } from "@/actions/users";
import { ROLE_LABEL } from "@/lib/constants";
import { CreateDialog } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

const ROLES = [
  { value: "INTERNAL", hint: "Customers, subscriptions, invoices and payments. Configuration is read-only." },
  { value: "ADMIN", hint: "Full access, including configuration and staff accounts." },
] as const;

export function NewUserDialog() {
  return (
    <CreateDialog
      action={saveStaff.bind(null, null)}
      icon={UserCog}
      title="Invite a staff member"
      description="They'll get an email with a link to set their own password."
      submitLabel="Send invitation"
      triggerLabel="Invite"
    >
      {(e) => (
        <>
          <Field label="Full name" htmlFor="u-name" error={e.name} required>
            <Input id="u-name" name="name" required autoFocus />
          </Field>
          <Field label="Work email" htmlFor="u-email" error={e.email} required>
            <Input id="u-email" name="email" type="email" required />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold">Role</legend>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60 has-[:checked]:border-primary/50 has-[:checked]:bg-accent/60"
                >
                  <input type="radio" name="role" value={r.value} defaultChecked={r.value === "INTERNAL"} className="mt-0.5 accent-primary" />
                  <span>
                    <span className="block text-[13px] font-semibold">{ROLE_LABEL[r.value]}</span>
                    <span className="block text-xs text-muted-foreground">{r.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {e.role && <p className="mt-1 text-xs text-destructive">{e.role}</p>}
          </fieldset>
        </>
      )}
    </CreateDialog>
  );
}
