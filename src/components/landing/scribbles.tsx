import { cn } from "@/lib/utils";

/** Hand-drawn accents for the landing page (marker highlight, circle, underline, arrow). */

export function Highlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <svg
        viewBox="0 0 200 30"
        preserveAspectRatio="none"
        aria-hidden
        className={cn("absolute -inset-x-1.5 bottom-[0.02em] -z-10 h-[0.55em] w-[calc(100%+0.75rem)] text-[#fbd165]", className)}
      >
        <path d="M3 13C42 6 118 3 197 9l-1 13c-66-4-130-2-192 5z" fill="currentColor" />
      </svg>
      {children}
    </span>
  );
}

export function Circled({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className="relative mx-1 inline-block whitespace-nowrap px-3">
      <svg
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        aria-hidden
        className={cn("pointer-events-none absolute -top-1.5 left-0 h-[calc(100%+0.75rem)] w-full text-current", className)}
      >
        <path
          d="M14 34C10 13 70 5 120 6c46 1 76 10 74 26-2 18-58 24-104 23C40 54 6 47 8 30 10 17 48 9 92 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
      {children}
    </span>
  );
}

export function Underline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        aria-hidden
        className={cn("absolute -bottom-2 left-0 h-[0.32em] w-full text-[#017e84]", className)}
      >
        <path d="M2 8c40-6 90-7 130-4 22 2 44 3 66-1" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Arrow({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 100 60" aria-hidden className={cn("h-10 w-16 text-[#017e84]", flip && "-scale-x-100", className)}>
      <path d="M6 6c10 26 34 42 82 40" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M76 36l13 10-14 8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Caveat note in teal, Odoo-style margin annotation. */
export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-hand text-2xl leading-tight text-[#017e84]", className)}>{children}</p>;
}
