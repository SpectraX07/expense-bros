"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
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
  cancelSettlementAction,
  confirmSettlementAction,
} from "@/app/actions/settlements";
import { formatMoney } from "@/lib/money";

export function ConfirmSettlementButton({
  settlementId,
  fromName,
  amount,
  currency,
}: {
  settlementId: string;
  fromName: string;
  amount: number;
  currency: string;
}) {
  const [pending, setPending] = useState(false);

  async function onConfirm() {
    setPending(true);
    try {
      const result = await confirmSettlementAction({ id: settlementId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Confirmed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" />}>Confirm</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm you received this?</AlertDialogTitle>
          <AlertDialogDescription>
            {fromName} marked {formatMoney(amount, currency)} as paid. Confirming will update balances.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => void onConfirm()}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CancelSettlementButton({
  settlementId,
  toName,
  amount,
  currency,
}: {
  settlementId: string;
  toName: string;
  amount: number;
  currency: string;
}) {
  const [pending, setPending] = useState(false);

  async function onCancel() {
    setPending(true);
    try {
      const result = await cancelSettlementAction({ id: settlementId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Cancelled.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        Cancel
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this payment?</AlertDialogTitle>
          <AlertDialogDescription>
            {formatMoney(amount, currency)} to {toName} will go back to suggested settlements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => void onCancel()}
          >
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Cancel payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
