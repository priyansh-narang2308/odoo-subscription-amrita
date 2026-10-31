import Link from "next/link";
import { BrandLogo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f2f2f4] px-4 py-10">
      <div className="w-full max-w-[400px] rounded-md border bg-card p-8 shadow-sm">
        <Link href="/" aria-label="Back to the Brightloop home page" className="mb-6 flex justify-center">
          <BrandLogo />
        </Link>
        {children}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Brightloop Software · Subscription Management</p>
    </main>
  );
}
