import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-sm border border-input bg-card px-2.5 py-2 text-[13px] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
