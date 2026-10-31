"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#apps", label: "Apps" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Roles" },
];

export function LandingHeader({ appHref }: { appHref: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow", (scrolled || open) && "shadow-[0_1px_0_rgba(0,0,0,0.08)]")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" aria-label="Brightloop home">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-[15px] text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {appHref ? (
            <Link href={appHref} className="rounded-md bg-[#714b67] px-4 py-2 text-[15px] font-medium text-white hover:bg-[#5f3d56]">
              Open the app
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-[15px] text-gray-700 hover:bg-gray-100">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-md bg-[#714b67] px-4 py-2 text-[15px] font-medium text-white hover:bg-[#5f3d56]">
                Try it free
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-white px-4 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b py-3 text-base text-gray-800">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {appHref ? (
              <Link href={appHref} className="col-span-2 rounded-md bg-[#714b67] py-2.5 text-center font-medium text-white">
                Open the app
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md bg-[#e7e9ed] py-2.5 text-center font-medium text-gray-800">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-md bg-[#714b67] py-2.5 text-center font-medium text-white">
                  Try it free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
