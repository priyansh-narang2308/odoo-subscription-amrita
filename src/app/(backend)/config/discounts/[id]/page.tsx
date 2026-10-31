import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { saveDiscount, toggleDiscount } from "@/actions/discounts";
import { DiscountForm } from "./discount-form";

export default async function DiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireStaff();
  const [discount, products] = await Promise.all([
    id === "new"
      ? null
      : prisma.discount.findUnique({
          where: { id },
          include: { products: { select: { id: true } } },
        }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (id !== "new" && !discount) notFound();
  return (
    <DiscountForm
      discount={discount}
      products={products}
      readOnly={user.role !== "ADMIN"}
      save={saveDiscount.bind(null, discount?.id ?? null)}
      toggle={discount ? toggleDiscount.bind(null, discount.id) : undefined}
    />
  );
}
