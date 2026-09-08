"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setOverallBudgetAction } from "@/app/actions/dashboard";
import { toMoneyNumber } from "@/lib/money";

export function OverallBudgetForm({
  householdId,
  year,
  month,
  currentAmount,
}: {
  householdId: string;
  year: number;
  month: number;
  currentAmount: number | null;
}) {
  const [amount, setAmount] = useState(
    currentAmount === null ? "" : String(currentAmount),
  );
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    const parsed = toMoneyNumber(amount);
    if (amount.trim() === "" || parsed < 0) {
      toast.error("Enter a budget of zero or more.");
      return;
    }

    setPending(true);
    try {
      const result = await setOverallBudgetAction({
        householdId,
        year,
        month,
        amount: parsed,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Budget saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="min-w-32 flex-1 space-y-1">
        <Label htmlFor="overallBudget" className="text-xs">
          Monthly budget
        </Label>
        <Input
          id="overallBudget"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
