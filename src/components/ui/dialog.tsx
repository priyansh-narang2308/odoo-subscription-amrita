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
      <P.Overlay className="fade-in fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-[2px]" />
      <P.Content
        className={cn(
          "dialog-in fixed left-1/2 top-[6vh] z-50 flex max-h-[88vh] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-2xl focus:outline-none sm:top-[10vh]",
          className,
        )}
        {...props}
      >
        {children}
        <P.Close className="absolute right-3.5 top-3.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </P.Close>
      </P.Content>
    </P.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 border-b px-5 py-4 pr-12", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof P.Title>) {
  return <P.Title className={cn("text-base font-semibold tracking-tight", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof P.Description>) {
  return <P.Description className={cn("mt-0.5 text-[13px] text-muted-foreground", className)} {...props} />;
}
export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex shrink-0 justify-end gap-2 border-t bg-muted/50 px-5 py-3", className)} {...props} />;
}
