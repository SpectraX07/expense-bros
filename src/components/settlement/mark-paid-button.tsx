"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createSettlementAction } from "@/app/actions/settlements";
import { formatMoney, toMoneyNumber } from "@/lib/money";

export function MarkPaidButton({
  householdId,
  fromUserId,
  toUserId,
  toName,
  amount,
  year,
  month,
  currency,
}: {
  householdId: string;
  fromUserId: string;
  toUserId: string;
  toName: string;
  amount: number;
  year: number;
  month: number;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(String(amount));
  const [note, setNote] = useState("");

  async function onConfirm() {
    const parsed = toMoneyNumber(value);
    if (parsed <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }

    setPending(true);
    try {
      const result = await createSettlementAction({
        householdId,
        fromUserId,
        toUserId,
        amount: parsed,
        year,
        month,
        note: note.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Marked as paid.");
      setOpen(false);
      setNote("");
      setValue(String(amount));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(String(amount));
        }
      }}
    >
      <AlertDialogTrigger render={<Button size="sm" />}>Mark paid</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as paid</AlertDialogTitle>
          <AlertDialogDescription>
            {toName} will need to confirm they received {formatMoney(toMoneyNumber(value) || amount, currency)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="settlement-amount">Amount</Label>
            <Input
              id="settlement-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settlement-note">Note</Label>
            <Textarea
              id="settlement-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="UPI reference, cash, etc."
              rows={2}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => void onConfirm()}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Mark paid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
