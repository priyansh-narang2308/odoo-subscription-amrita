import "server-only";
import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html?: string };

/**
 * Sends mail through SMTP when configured; otherwise prints it to the server
 * console so flows like password reset still work in local development.
 */
export async function sendMail(mail: Mail) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(`\n──── ✉  Email to ${mail.to} ────\nSubject: ${mail.subject}\n\n${mail.text}\n────────────────────────────\n`);
    return { delivered: false as const };
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM ?? "no-reply@brightloop.test", ...mail });
  return { delivered: true as const };
}
