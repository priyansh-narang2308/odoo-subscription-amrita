import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground",
        gray: "bg-gray-100 text-gray-700",
        blue: "bg-sky-100 text-sky-800",
        green: "bg-emerald-100 text-emerald-800",
        yellow: "bg-amber-100 text-amber-800",
        red: "bg-red-100 text-red-700",
        purple: "bg-violet-100 text-violet-800",
        teal: "bg-teal-100 text-teal-800",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
