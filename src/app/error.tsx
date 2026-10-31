"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-[13px] text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
