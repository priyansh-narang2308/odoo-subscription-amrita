"use client";

import * as React from "react";
import { Tabs as P } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = P.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof P.List>) {
  return <P.List className={cn("flex gap-0 border-b", className)} {...props} />;
}

/** Odoo "notebook" tab look */
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "-mb-px border border-transparent px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground data-[state=active]:rounded-t-sm data-[state=active]:border-border data-[state=active]:border-b-card data-[state=active]:bg-card data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof P.Content>) {
  return <P.Content className={cn("pt-4 focus:outline-none", className)} {...props} />;
}
