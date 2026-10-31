"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, type LucideIcon } from "lucide-react";
import { initialState, type ActionState } from "@/lib/action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/forms/field";
import { cn } from "@/lib/utils";

type CreateAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * "New" button that opens a create form in a dialog.
 * `stay` keeps the user on the list (toast + close); otherwise the action
 * redirects to the new record so it can be completed there.
 */
export function CreateDialog({
  action,
  title,
  description,
  icon: Icon,
  submitLabel = "Create",
  triggerLabel = "New",
  stay = false,
  size = "md",
  triggerClassName,
  children,
}: {
  action: CreateAction;
  title: string;
  description?: string;
  icon?: LucideIcon;
  submitLabel?: string;
  triggerLabel?: string;
  stay?: boolean;
  size?: "md" | "lg";
  triggerClassName?: string;
  children: (errors: Record<string, string>) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Remount the form on every open so errors and inputs start fresh
  const [instance, setInstance] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setInstance((i) => i + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className={triggerClassName}>
          <Plus /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(size === "lg" ? "max-w-2xl" : "max-w-lg")}>
        <DialogHeader className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Icon className="size-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
          </div>
        </DialogHeader>
        <CreateForm
          key={instance}
          action={action}
          stay={stay}
          submitLabel={submitLabel}
          onDone={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          {children}
        </CreateForm>
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({
  action,
  stay,
  submitLabel,
  onDone,
  onCancel,
  children,
}: {
  action: CreateAction;
  stay: boolean;
  submitLabel: string;
  onDone: () => void;
  onCancel: () => void;
  children: (errors: Record<string, string>) => React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [pending, startTransition] = useTransition();

  // Runs once per server response; onDone closes (and unmounts) the dialog
  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      // Submit manually: a form `action` resets every field, wiping input when validation fails
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {stay && <input type="hidden" name="_stay" value="1" />}
      <DialogBody className="space-y-4">
        <FormError message={state.error} />
        {children(state.fieldErrors ?? {})}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Creating…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Two-column grid for dialog fields that collapses on phones. */
export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
