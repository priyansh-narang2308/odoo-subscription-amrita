import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#714b67" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="23" cy="9" r="2.6" fill="#f5b041" />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="text-xl font-bold tracking-tight text-[#714b67]">
        bright<span className="text-[#017e84]">loop</span>
      </span>
    </div>
  );
}
