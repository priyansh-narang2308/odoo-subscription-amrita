import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getActivities } from "@/lib/activity";
import { saveProduct, toggleProduct } from "@/actions/products";
import { Chatter } from "@/components/odoo/chatter";
import { ProductForm } from "./product-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return { title: "New Product" };
  const rec = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: rec?.name ?? "Not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const [product, taxes, attributes] = await Promise.all([
    id === "new" ? null : prisma.product.findUnique({
      where: { id },
      include: {
        taxes: { select: { id: true } },
        variants: { include: { attributeValue: true } },
        _count: { select: { subscriptionLines: { where: { subscription: { status: { in: ["ACTIVE", "PAUSED"] } } } } } },
      },
    }),
    prisma.tax.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.productAttribute.findMany({ orderBy: { name: "asc" }, include: { values: { orderBy: { name: "asc" } } } }),
  ]);
  if (id !== "new" && !product) notFound();
  const activities = product ? await getActivities("product", product.id) : [];

  return (
    <ProductForm
      product={product}
      taxes={taxes}
      attributes={attributes}
      readOnly={user.role !== "ADMIN"}
      save={saveProduct.bind(null, product?.id ?? null)}
      toggle={product ? toggleProduct.bind(null, product.id) : undefined}
      aside={product && <Chatter entries={activities} />}
    />
  );
}
