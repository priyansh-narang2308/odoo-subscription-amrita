"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { BillingError, registerPayment } from "@/lib/billing";
import { stayOnList, type ActionState, zodFieldErrors } from "@/lib/action";
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
  // Refreshes every staff page, including the sidebar's overdue count
  revalidatePath("/", "layout");
  return { message: "Payment registered" };
}

/** Payment form not opened from an invoice: the invoice is picked in the form. */
export async function recordPayment(_: ActionState, fd: FormData): Promise<ActionState> {
  const invoiceId = str(fd, "invoiceId");
  if (!invoiceId) return { fieldErrors: { invoiceId: "Choose the invoice being paid" } };
  const res = await registerPaymentAction(invoiceId, _, fd);
  if (res.message && !stayOnList(fd)) redirect(`/invoices/${invoiceId}`);
  return res;
}
