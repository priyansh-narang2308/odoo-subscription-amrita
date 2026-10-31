"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { initialState } from "@/lib/action";
import { inputDate } from "@/lib/format";
import type { FormAction } from "@/components/odoo/record-form";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function RegisterPayment({ action, amountDue, number }: { action: FormAction; amountDue: number; number: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Banknote /> Register Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader><DialogTitle>Register Payment</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={state.error} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Method" htmlFor="method" error={state.fieldErrors?.method}>
                <NativeSelect id="method" name="method" defaultValue="BANK_TRANSFER">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Amount" htmlFor="amount" error={state.fieldErrors?.amount}>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" max={amountDue.toFixed(2)} defaultValue={amountDue.toFixed(2)} required />
              </Field>
              <Field label="Payment Date" htmlFor="date" error={state.fieldErrors?.date}>
                <Input id="date" name="date" type="date" defaultValue={inputDate(new Date())} required />
              </Field>
              <Field label="Memo" htmlFor="ref">
                <Input id="ref" value={number} readOnly className="bg-muted" />
              </Field>
            </div>
            <Field label="Note" htmlFor="note">
              <Textarea id="note" name="note" placeholder="Bank reference, cheque number…" className="min-h-16" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Discard</Button>
            <SubmitButton pendingText="Saving…">Create Payment</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
