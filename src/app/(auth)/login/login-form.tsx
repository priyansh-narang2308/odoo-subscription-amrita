"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { ShieldCheck, Users, Store } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { initialState } from "@/lib/action";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";

const DEMO = [
  { label: "Admin", hint: "Full access", icon: ShieldCheck, email: "admin@brightloop.test", password: "Admin@1234" },
  { label: "Internal", hint: "Staff user", icon: Users, email: "staff@brightloop.test", password: "Staff@1234" },
  { label: "Portal", hint: "Customer", icon: Store, email: "customer@brightloop.test", password: "Customer@123" },
];

export function LoginForm({ next, reset }: { next?: string; reset?: boolean }) {
  const [state, action] = useActionState(loginAction, initialState);
  const form = useRef<HTMLFormElement>(null);

  // Fills the form with a demo account and signs in, so judges can try each role in one click.
  function signInAs(d: (typeof DEMO)[number]) {
    const f = form.current;
    if (!f) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = d.email;
    (f.elements.namedItem("password") as HTMLInputElement).value = d.password;
    f.requestSubmit();
  }

  return (
    <form ref={form} action={action} className="space-y-4">
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
      <div className="rounded-sm border border-dashed bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Try a demo account</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => signInAs(d)}
              title={`${d.email} / ${d.password}`}
              className="flex flex-col items-center gap-1 rounded-sm border bg-background px-2 py-2 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <d.icon className="size-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground">{d.label}</span>
              <span className="text-[11px] text-muted-foreground">{d.hint}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {DEMO.map((d) => (
            <p key={d.email} className="truncate tabular-nums">
              <span className="inline-block w-14 font-medium text-foreground">{d.label}</span> {d.email} / {d.password}
            </p>
          ))}
        </div>
      </div>
    </form>
  );
}
