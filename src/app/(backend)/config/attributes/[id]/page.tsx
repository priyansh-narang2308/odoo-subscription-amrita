import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { deleteAttribute, saveAttribute } from "@/actions/attributes";
import { AttributeForm } from "./attribute-form";

export default async function AttributePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const attr = id === "new" ? null : await prisma.productAttribute.findUnique({
    where: { id },
    include: { values: { orderBy: { name: "asc" } } },
  });
  if (id !== "new" && !attr) notFound();
  return (
    <AttributeForm
      attribute={attr}
      readOnly={user.role !== "ADMIN"}
      save={saveAttribute.bind(null, attr?.id ?? null)}
      remove={attr ? deleteAttribute.bind(null, attr.id) : undefined}
    />
  );
}
