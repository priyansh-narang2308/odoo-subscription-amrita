"use client";

import { UserPlus } from "lucide-react";
import { saveCustomer } from "@/actions/customers";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

export function NewCustomerDialog() {
  return (
    <CreateDialog
      action={saveCustomer.bind(null, null)}
      stay
      size="lg"
      icon={UserPlus}
      title="New customer"
      description="You can invite them to the customer portal from their record later."
      submitLabel="Create customer"
    >
      {(e) => (
        <FieldGrid>
          <Field label="Name" htmlFor="c-name" error={e.name} required>
            <Input
              id="c-name"
              name="name"
              placeholder="e.g. Corner Bakery"
              required
              autoFocus
            />
          </Field>
          <Field label="Email" htmlFor="c-email" error={e.email} required>
            <Input
              id="c-email"
              name="email"
              type="email"
              placeholder="billing@company.com"
              required
            />
          </Field>
          <Field label="Phone" htmlFor="c-phone" error={e.phone}>
            <Input
              id="c-phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Company" htmlFor="c-company" error={e.company}>
            <Input id="c-company" name="company" />
          </Field>
          <Field
            label="Street"
            htmlFor="c-street"
            error={e.street}
            className="sm:col-span-2"
          >
            <Input id="c-street" name="street" />
          </Field>
          <Field label="City" htmlFor="c-city" error={e.city}>
            <Input id="c-city" name="city" />
          </Field>
          <Field label="Country" htmlFor="c-country" error={e.country}>
            <Input id="c-country" name="country" defaultValue="India" />
          </Field>
          <Field
            label="GSTIN / Tax ID"
            htmlFor="c-tax"
            error={e.taxId}
            className="sm:col-span-2"
          >
            <Input id="c-tax" name="taxId" placeholder="Optional" />
          </Field>
        </FieldGrid>
      )}
    </CreateDialog>
  );
}
