"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/actions/auth";
import { initialState } from "@/lib/action";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signupAction, initialState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Create your account</h1>
        <p className="text-[13px] text-muted-foreground">Manage your subscriptions and invoices online.</p>
      </div>
      <FormError message={state.error} />
      <Field label="Your Name" htmlFor="name" error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Company (optional)" htmlFor="company" error={fe.company}>
        <Input id="company" name="company" autoComplete="organization" />
      </Field>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required showRules />
      </Field>
      <Field label="Confirm Password" htmlFor="confirm" error={fe.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
        Sign up
      </SubmitButton>
      <p className="text-center text-[13px]">
        <Link href="/login" className="text-primary hover:underline">
          Already have an account? Log in
        </Link>
      </p>
    </form>
  );
}
