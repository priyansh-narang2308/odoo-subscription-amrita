import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
      <BrandMark className="size-12" />
      <h1 className="text-xl font-semibold">This record doesn&apos;t exist</h1>
      <p className="max-w-sm text-[13px] text-muted-foreground">It may have been deleted, or you may not have access to it.</p>
      <Button asChild size="sm"><Link href="/">Back to home</Link></Button>
    </div>
  );
}
