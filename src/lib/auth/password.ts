import bcrypt from "bcryptjs";
import { z } from "zod";

/**
 * Policy: more than eight characters, at least one uppercase,
 * one lowercase and one special character.
 */
export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password needs a special character");

export { PASSWORD_RULES } from "./password-rules";

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
