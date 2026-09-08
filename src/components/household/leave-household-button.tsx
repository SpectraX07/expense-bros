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
import { leaveHouseholdAction } from "@/app/actions/households";

export function LeaveHouseholdButton({
  householdId,
  householdName,
  canLeave,
}: {
  householdId: string;
  householdName: string;
  canLeave: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function onLeave() {
    setPending(true);
    try {
      const result = await leaveHouseholdAction({ householdId });
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  if (!canLeave) {
    return (
      <p className="text-sm text-muted-foreground">
        You are the last admin. Promote another roommate before leaving.
      </p>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Leave household
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {householdName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will stop seeing this household. Past expenses stay in history.
            An admin can restore you later, or you can rejoin with an invite
            code.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => void onLeave()}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
