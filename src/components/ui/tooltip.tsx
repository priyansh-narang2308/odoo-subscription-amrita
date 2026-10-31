"use client";

import * as React from "react";
import { Tooltip as P } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = P.Provider;
export const Tooltip = P.Root;
export const TooltipTrigger = P.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn("z-50 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md", className)}
        {...props}
      />
    </P.Portal>
  );
}
