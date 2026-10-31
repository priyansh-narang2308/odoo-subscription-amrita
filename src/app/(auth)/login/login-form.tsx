"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { initialState } from "@/lib/action";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";

const DEMO = [
  { label: "Admin", email: "admin@brightloop.test", password: "Admin@1234" },
  { label: "Internal", email: "staff@brightloop.test", password: "Staff@1234" },
  { label: "Portal", email: "customer@brightloop.test", password: "Customer@123" },
];

export function LoginForm({ next, reset }: { next?: string; reset?: boolean }) {
  const [state, action] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="space-y-4">
      {reset && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          Your password was changed. Sign in with your new password.
        </div>
      )}
      <FormError message={state.error} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
        Log in
      </SubmitButton>
      <div className="flex justify-between text-[13px]">
        <Link href="/signup" className="text-primary hover:underline">
          Don&apos;t have an account?
        </Link>
        <Link href="/forgot-password" className="text-primary hover:underline">
          Reset Password
        </Link>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-sm border border-dashed bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Demo accounts</p>
          {DEMO.map((d) => (
            <p key={d.email} className="tabular-nums">
              <span className="inline-block w-14 font-medium">{d.label}</span> {d.email} / {d.password}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
