// Client-safe password rules (no bcrypt import), mirrored by passwordSchema on the server.
export const PASSWORD_RULES = [
  { test: (p: string) => p.length > 8, label: "More than 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];
