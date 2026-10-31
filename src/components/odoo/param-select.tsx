"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";

/** A select bound to one URL search param. */
export function ParamSelect({ param, options, placeholder }: { param: string; options: { value: string; label: string }[]; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <NativeSelect
      className="h-8 w-48"
      value={params.get(param) ?? ""}
      aria-label={placeholder}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        if (e.target.value) sp.set(param, e.target.value);
        else sp.delete(param);
        router.push(`${pathname}?${sp.toString()}`);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </NativeSelect>
  );
}
