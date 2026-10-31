import { cn } from "@/lib/utils";

/** White list container under the control panel. */
export function ListView({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-card", className)}>{children}</div>;
}
