"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Runs a bound server action (optionally after confirmation) and toasts the result. */
export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: () => Promise<ActionState | void>;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const run = () =>
    start(async () => {
      const res = await action();
      setOpen(false);
      if (res?.error) toast.error(res.error);
      else if (res?.message) toast.success(res.message);
    });

  return (
    <>
      <Button type="button" size="sm" disabled={pending} onClick={() => (confirm ? setOpen(true) : run())} {...props}>
        {pending && <Loader2 className="animate-spin" />}
        {children}
      </Button>
      {confirm && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-[13px]">{confirm}</p>
            </DialogBody>
            <DialogFooter>
              <Button type="button" onClick={run} disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} Ok
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
