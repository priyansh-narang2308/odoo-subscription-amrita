"use client";

import Link from "next/link";
import type { Customer } from "@prisma/client";
import { FileText, KeyRound, RefreshCcw, Trash2, Wallet } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { money } from "@/lib/format";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { FormRow } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

function SmartButton({ href, icon: Icon, value, label }: { href: string; icon: typeof FileText; value: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex min-w-36 items-center gap-2 rounded-sm border px-3 py-1.5 text-[13px] hover:bg-muted">
      <Icon className="size-5 text-primary" />
      <span className="leading-tight"><b className="block tabular-nums">{value}</b><span className="text-xs text-muted-foreground">{label}</span></span>
    </Link>
  );
}

export function CustomerForm({
  customer,
  stats,
  save,
  grant,
  revoke,
  remove,
  aside,
}: {
  customer: (Customer & { user: { active: boolean; email: string } | null }) | null;
  stats: { subscriptions: number; invoices: number; due: number };
  save: FormAction;
  grant?: () => Promise<ActionState>;
  revoke?: () => Promise<ActionState>;
  remove?: () => Promise<ActionState>;
  aside?: React.ReactNode;
}) {
  return (
    <RecordForm
      action={save}
      backHref="/customers"
      breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: customer?.name ?? "New" }]}
      aside={aside}
      header={customer && (
        <>
          <div className="flex gap-1.5">
            {!customer.user && grant && <ActionButton action={grant}><KeyRound /> Grant Portal Access</ActionButton>}
            {customer.user && revoke && (
              <ActionButton variant="secondary" action={revoke}>
                <KeyRound /> {customer.user.active ? "Revoke Portal Access" : "Restore Portal Access"}
              </ActionButton>
            )}
            {remove && stats.subscriptions === 0 && stats.invoices === 0 && (
              <ActionButton variant="secondary" action={remove} confirm="Delete this customer?"><Trash2 /> Delete</ActionButton>
            )}
          </div>
          {customer.user && <Badge variant={customer.user.active ? "teal" : "gray"}>Portal {customer.user.active ? "enabled" : "revoked"}</Badge>}
        </>
      )}
    >
      {(e) => (
        <>
          {customer && (
            <div className="-mt-2 mb-4 flex flex-wrap justify-end gap-2">
              <SmartButton href={`/subscriptions?customer=${customer.id}`} icon={RefreshCcw} value={stats.subscriptions} label="Subscriptions" />
              <SmartButton href={`/invoices?customer=${customer.id}`} icon={FileText} value={stats.invoices} label="Invoices" />
              <SmartButton href={`/invoices?customer=${customer.id}&filter=unpaid`} icon={Wallet} value={money(stats.due)} label="Amount Due" />
            </div>
          )}
          <Input
            name="name"
            defaultValue={customer?.name}
            placeholder="e.g. Corner Bakery"
            required
            aria-label="Customer name"
            className="mb-1 h-11 border-0 border-b px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          <div className="mt-4 grid gap-x-10 md:grid-cols-2">
            <div>
              <FormRow label="Company" htmlFor="company"><Input id="company" name="company" defaultValue={customer?.company ?? ""} /></FormRow>
              <FormRow label="Street" htmlFor="street"><Input id="street" name="street" defaultValue={customer?.street ?? ""} /></FormRow>
              <FormRow label="City" htmlFor="city"><Input id="city" name="city" defaultValue={customer?.city ?? ""} /></FormRow>
              <FormRow label="Country" htmlFor="country"><Input id="country" name="country" defaultValue={customer?.country ?? "India"} /></FormRow>
            </div>
            <div>
              <FormRow label="Email" htmlFor="email" error={e.email} required>
                <Input id="email" name="email" type="email" defaultValue={customer?.email} required />
              </FormRow>
              <FormRow label="Phone" htmlFor="phone"><Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} /></FormRow>
              <FormRow label="Tax ID (GSTIN)" htmlFor="taxId"><Input id="taxId" name="taxId" defaultValue={customer?.taxId ?? ""} /></FormRow>
            </div>
          </div>
          <Separator label="Internal Notes" />
          <Textarea name="notes" defaultValue={customer?.notes ?? ""} />
        </>
      )}
    </RecordForm>
  );
}
