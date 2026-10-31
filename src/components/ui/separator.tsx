import { cn } from "@/lib/utils";

export function Separator({ className, label }: { className?: string; label?: string }) {
  if (!label) return <hr className={cn("my-4 border-border", className)} />;
  return (
    <div className={cn("mb-2 mt-6 border-b pb-1 text-[13px] font-bold uppercase tracking-wide text-foreground/80", className)}>
      {label}
    </div>
  );
}
