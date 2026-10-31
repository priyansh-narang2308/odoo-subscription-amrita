"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { initialState } from "@/lib/action";
import { Field, FormError } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action] = useActionState(resetPasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Choose a new password</h1>
      </div>
      <FormError message={state.error} />
      <input type="hidden" name="token" value={token} />
      <Field label="New Password" htmlFor="password" error={state.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required showRules autoFocus />
      </Field>
      <Field label="Confirm Password" htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Reset password
      </SubmitButton>
      <p className="text-center text-[13px]">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Request a new link
        </Link>
      </p>
    </form>
  );
}
