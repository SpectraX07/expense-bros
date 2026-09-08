"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteRecurringAction,
  setRecurringActiveAction,
} from "@/app/actions/recurring";

export function RecurringRowActions({
  id,
  itemName,
  active,
  canEdit,
}: {
  id: string;
  itemName: string;
  active: boolean;
  canEdit: boolean;
}) {
  const [pending, setPending] = useState(false);

  if (!canEdit) {
    return null;
  }

  async function onToggle() {
    setPending(true);
    try {
      const result = await setRecurringActiveAction({ id, active: !active });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    setPending(true);
    try {
      const result = await deleteRecurringAction({ id });
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => void onToggle()}>
        {active ? "Pause" : "Resume"}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemName} will stop generating new expenses. Past expenses stay in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void onDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
