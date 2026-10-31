"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";
import { initialState } from "@/lib/action";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="text-[13px] text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      </div>
      <FormError message={state.error} />
      {state.message ? (
        <div className="space-y-2 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          <p>{state.message}</p>
          {state.devLink && (
            <p className="break-all text-xs">
              <span className="font-semibold">Dev mode (no SMTP configured):</span>{" "}
              <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="underline">
                open reset link
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
          </Field>
          <SubmitButton className="w-full" size="lg" pendingText="Sending…">
            Send reset link
          </SubmitButton>
        </>
      )}
      <p className="text-center text-[13px]">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
