"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { CloudUpload, Undo2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { initialState } from "@/lib/action";
import { ControlPanel, type Crumb } from "@/components/odoo/control-panel";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

export type FormAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Form view shell: control panel with Save / Discard, a status/action header
 * and the Odoo "sheet". Field errors are exposed to children through `errors`.
 */
export function RecordForm({
  action,
  breadcrumbs,
  backHref,
  readOnly,
  header,
  toolbar,
  aside,
  children,
}: {
  action: FormAction;
  breadcrumbs: Crumb[];
  backHref: string;
  readOnly?: boolean;
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  aside?: React.ReactNode;
  children: (errors: Record<string, string>) => React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} noValidate={false}>
      <ControlPanel
        breadcrumbs={breadcrumbs}
        actions={
          !readOnly && (
            <>
              <SubmitButton size="sm" pendingText="Saving…">
                <CloudUpload /> Save
              </SubmitButton>
              <Button variant="secondary" size="sm" asChild>
                <Link href={backHref}>
                  <Undo2 /> Discard
                </Link>
              </Button>
            </>
          )
        }
        right={toolbar}
      />
      {header && (
        <div className="no-print flex flex-col gap-2 border-b bg-card px-4 py-2 md:flex-row md:items-center md:justify-between">
          {header}
        </div>
      )}
      <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="o-sheet">
            <FormError message={state.error} />
            <fieldset disabled={readOnly} className="min-w-0 disabled:[&_input]:bg-transparent disabled:[&_select]:bg-transparent disabled:[&_textarea]:bg-transparent">
              {children(state.fieldErrors ?? {})}
            </fieldset>
          </div>
        </div>
        {aside && <aside className="no-print w-full shrink-0 xl:w-[340px]">{aside}</aside>}
      </div>
    </form>
  );
}
