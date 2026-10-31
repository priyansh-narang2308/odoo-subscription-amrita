import * as React from "react";
import { cn } from "@/lib/utils";

/** Native checkbox styled to match — submits "on" with forms. */
export function Checkbox({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 cursor-pointer rounded-sm border-input accent-primary disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}
