"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/users";
import { initialState } from "@/lib/action";
import { Field, FormError } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function ProfileForm({ name, email, role }: { name: string; email: string; role: string }) {
  const [state, action] = useActionState(updateProfile, initialState);
  useEffect(() => {
    if (state.message) toast.success(state.message);
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-md space-y-4">
      <FormError message={state.error} />
      <Field label="Name" htmlFor="name" error={fe.name}>
        <Input id="name" name="name" defaultValue={name} required />
      </Field>
      <Field label="Email" htmlFor="email" hint={`Signed in as ${role}`}>
        <Input id="email" value={email} readOnly className="bg-muted" />
      </Field>
      <Separator label="Change Password" />
      <Field label="Current Password" htmlFor="current" error={fe.current}>
        <PasswordInput id="current" name="current" autoComplete="current-password" />
      </Field>
      <Field label="New Password" htmlFor="password" error={fe.password} hint="Leave empty to keep your current password">
        <PasswordInput id="password" name="password" autoComplete="new-password" showRules />
      </Field>
      <Field label="Confirm New Password" htmlFor="confirm" error={fe.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </Field>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
