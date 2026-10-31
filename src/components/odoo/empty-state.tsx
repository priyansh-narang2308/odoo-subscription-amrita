import { Inbox } from "lucide-react";

export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Inbox className="size-10 text-muted-foreground/60" strokeWidth={1.25} />
      <p className="text-[15px] font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
