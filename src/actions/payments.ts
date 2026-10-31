"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { BillingError, registerPayment } from "@/lib/billing";
import { type ActionState, zodFieldErrors } from "@/lib/action";
import { PAYMENT_METHODS } from "@/lib/constants";
import { date, str } from "@/lib/utils";

const schema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export async function registerPaymentAction(invoiceId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const paidOn = date(fd, "date");
  if (!paidOn) return { fieldErrors: { date: "Payment date is required" } };
  try {
    await prisma.$transaction((tx) =>
      registerPayment(tx, { invoiceId, ...parsed.data, date: paidOn, note: str(fd, "note"), userId: user.id }),
    );
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { message: "Payment registered" };
}
