import { cn } from "@/lib/utils";

/** Content area below the control panel. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-4 py-4", className)}>{children}</div>;
}
