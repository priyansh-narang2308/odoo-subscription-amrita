/** Shape returned by form server actions and consumed by useActionState. */
export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  devLink?: string;
};

export const initialState: ActionState = {};

export function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}

/** Create dialogs post `_stay=1` to get a toast instead of a redirect to the new record. */
export function stayOnList(fd: FormData) {
  return fd.get("_stay") === "1";
}
