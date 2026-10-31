"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ auto = true }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[850px] justify-end">
      <Button size="sm" onClick={() => window.print()}><Printer /> Print / Save as PDF</Button>
    </div>
  );
}
