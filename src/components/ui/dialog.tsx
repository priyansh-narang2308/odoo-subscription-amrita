"use client";

import * as React from "react";
import { Dialog as P } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = P.Root;
export const DialogTrigger = P.Trigger;
export const DialogClose = P.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <P.Content
        className={cn(
          "fixed left-1/2 top-[12%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-md border bg-card shadow-2xl focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <P.Close className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </P.Close>
      </P.Content>
    </P.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b px-5 py-3.5", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof P.Title>) {
  return <P.Title className={cn("text-base font-semibold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof P.Description>) {
  return <P.Description className={cn("text-[13px] text-muted-foreground", className)} {...props} />;
}
export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex justify-start gap-2 border-t px-5 py-3", className)} {...props} />;
}
