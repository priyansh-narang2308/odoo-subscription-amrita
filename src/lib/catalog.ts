import "server-only";
import { prisma } from "@/lib/prisma";

export type CatalogProduct = {
  id: string;
  name: string;
  salesPrice: number;
  taxIds: string[];
  variants: { id: string; label: string; extraPrice: number }[];
};
export type CatalogTax = { id: string; name: string; type: string; amount: number };

/** Products and taxes in the shape the order-lines editor needs. */
export async function loadCatalog() {
  const [products, taxes] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        taxes: { select: { id: true } },
        variants: { include: { attributeValue: { include: { attribute: true } } } },
      },
    }),
    prisma.tax.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    products: products.map<CatalogProduct>((p) => ({
      id: p.id,
      name: p.name,
      salesPrice: p.salesPrice,
      taxIds: p.taxes.map((t) => t.id),
      variants: p.variants.map((v) => ({
        id: v.id,
        label: `${v.attributeValue.attribute.name}: ${v.attributeValue.name}`,
        extraPrice: v.extraPrice,
      })),
    })),
    taxes: taxes.map<CatalogTax>((t) => ({ id: t.id, name: t.name, type: t.type, amount: t.amount })),
  };
}
