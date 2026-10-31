import { cn, initials } from "@/lib/utils";

const COLORS = ["bg-[#714b67]", "bg-[#017e84]", "bg-[#e99d00]", "bg-[#5b8fd6]", "bg-[#c45a5a]", "bg-[#4f9d69]"];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const color = COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold text-white", color, className)}>
      {initials(name) || "?"}
    </span>
  );
}
