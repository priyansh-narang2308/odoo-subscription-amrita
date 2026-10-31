"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PASSWORD_RULES } from "@/lib/auth/password-rules";
import { cn } from "@/lib/utils";

export function PasswordInput({ showRules, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { showRules?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showRules && value.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.label} className={cn("flex items-center gap-1", ok ? "text-emerald-700" : "text-muted-foreground")}>
                {ok ? <Check className="size-3" /> : <X className="size-3" />}
                {r.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
