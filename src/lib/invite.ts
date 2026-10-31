import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

/** Issues a one-hour password link (used for resets and new-account invitations). */
export async function issuePasswordLink(user: { id: string; name: string; email: string }, kind: "invite" | "reset") {
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + (kind === "invite" ? 72 : 1) * 60 * 60 * 1000),
    },
  });
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;
  const sent = await sendMail({
    to: user.email,
    subject: kind === "invite" ? "You're invited to Brightloop" : "Reset your Brightloop password",
    text:
      kind === "invite"
        ? `Hello ${user.name},\n\nAn account has been created for you on Brightloop.\nChoose your password here (valid for 72 hours):\n\n${link}\n`
        : `Hello ${user.name},\n\nUse this link within one hour to choose a new password:\n\n${link}\n`,
  });
  return { link, delivered: sent.delivered };
}
