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
import { rotateInviteCodeAction } from "@/app/actions/households";

export function RotateInviteButton({ householdId }: { householdId: string }) {
  const [pending, setPending] = useState(false);

  async function onRotate() {
    setPending(true);
    try {
      const result = await rotateInviteCodeAction({ householdId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant="outline" />}>
        Rotate
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rotate invite code?</AlertDialogTitle>
          <AlertDialogDescription>
            The current code and link will stop working. Anyone already in the
            household stays. New roommates will need the new code.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep code</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => void onRotate()}>
            Rotate code
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
