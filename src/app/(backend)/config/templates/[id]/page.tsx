import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { deleteTemplate, saveTemplate } from "@/actions/templates";
import { TemplateForm } from "./template-form";

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const [template, plans, catalog] = await Promise.all([
    id === "new" ? null : prisma.quotationTemplate.findUnique({
      where: { id },
      include: { lines: { orderBy: { sequence: "asc" }, include: { taxes: { select: { id: true } } } } },
    }),
    prisma.recurringPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    loadCatalog(),
  ]);
  if (id !== "new" && !template) notFound();
  return (
    <TemplateForm
      template={template}
      plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      catalog={catalog}
      readOnly={user.role !== "ADMIN"}
      save={saveTemplate.bind(null, template?.id ?? null)}
      remove={template ? deleteTemplate.bind(null, template.id) : undefined}
    />
  );
}
