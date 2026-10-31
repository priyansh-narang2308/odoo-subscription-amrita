import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { saveTax, toggleTax } from "@/actions/taxes";
import { TaxForm } from "./tax-form";

export default async function TaxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const tax = id === "new" ? null : await prisma.tax.findUnique({ where: { id } });
  if (id !== "new" && !tax) notFound();
  return (
    <TaxForm
      tax={tax}
      readOnly={user.role !== "ADMIN"}
      save={saveTax.bind(null, tax?.id ?? null)}
      toggle={tax ? toggleTax.bind(null, tax.id) : undefined}
    />
  );
}
