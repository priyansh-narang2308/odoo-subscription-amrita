"use client";

import { KeyRound, UserCheck, UserX } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { FormRow } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type U = { id: string; name: string; email: string; role: string; active: boolean };

export function UserForm({
  user,
  isSelf,
  invited,
  save,
  toggle,
  reset,
}: {
  user: U | null;
  isSelf: boolean;
  invited: boolean;
  save: FormAction;
  toggle?: () => Promise<ActionState>;
  reset?: () => Promise<ActionState>;
}) {
  return (
    <RecordForm
      action={save}
      backHref="/users"
      breadcrumbs={[{ label: "Users", href: "/users" }, { label: user?.name ?? "New" }]}
      header={user && (
        <>
          <div className="flex gap-1.5">
            {reset && <ActionButton variant="secondary" action={reset}><KeyRound /> Send Password Reset</ActionButton>}
            {toggle && !isSelf && (
              <ActionButton variant="secondary" action={toggle} confirm={user.active ? "Deactivate this user? They will no longer be able to sign in." : undefined}>
                {user.active ? <><UserX /> Deactivate</> : <><UserCheck /> Reactivate</>}
              </ActionButton>
            )}
          </div>
          {user.active ? <Badge variant="green">Active</Badge> : <Badge variant="gray">Inactive</Badge>}
        </>
      )}
    >
      {(e) => (
        <div className="max-w-xl">
          {invited && (
            <div className="mb-4 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              User created. An invitation to set their password was sent to {user?.email}.
            </div>
          )}
          <FormRow label="Name" htmlFor="name" error={e.name} required>
            <Input id="name" name="name" defaultValue={user?.name} required />
          </FormRow>
          <FormRow label="Email Address" htmlFor="email" error={e.email} required>
            <Input id="email" name="email" type="email" defaultValue={user?.email} required />
          </FormRow>
          <FormRow label="Access Rights" htmlFor="role" error={e.role}>
            <NativeSelect id="role" name="role" defaultValue={user?.role ?? "INTERNAL"} disabled={isSelf}>
              <option value="INTERNAL">Internal User — day-to-day work</option>
              <option value="ADMIN">Administrator — full access</option>
            </NativeSelect>
            {isSelf && <input type="hidden" name="role" value="ADMIN" />}
          </FormRow>
          <div className="mt-6 rounded-sm bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">What each role can do</p>
            <p><b>Administrator</b> — everything, including products, plans, taxes, discounts and users.</p>
            <p><b>Internal User</b> — customers, quotations, subscriptions, invoices and payments; configuration is read-only.</p>
            <p><b>Portal Customer</b> — only their own subscriptions and invoices (created from the customer record or by signing up).</p>
          </div>
        </div>
      )}
    </RecordForm>
  );
}
