"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertBudgetAction } from "@/app/actions/recurring";
import { budgetStatus } from "@/lib/budget-status";
import { formatMoney, toMoneyNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BudgetRow({
  householdId,
  year,
  month,
  categoryId,
  label,
  currentAmount,
  spent,
  currency,
  isAdmin,
}: {
  householdId: string;
  year: number;
  month: number;
  categoryId: string | null;
  label: string;
  currentAmount: number | null;
  spent: number;
  currency: string;
  isAdmin: boolean;
}) {
  const [amount, setAmount] = useState(currentAmount === null ? "" : String(currentAmount));
  const [pending, setPending] = useState(false);
  const parsed = amount.trim() === "" ? null : toMoneyNumber(amount);
  const status = budgetStatus(spent, currentAmount);

  async function save(nextAmount: number | null) {
    setPending(true);
    try {
      const result = await upsertBudgetAction({
        householdId,
        year,
        month,
        categoryId,
        amount: nextAmount,
      });
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
    <div className="grid gap-3 rounded-xl border border-border px-4 py-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {formatMoney(spent, currency)} spent
          {currentAmount !== null && currentAmount > 0
            ? ` · ${status.label} (${status.percent}%)`
            : " · no budget"}
        </p>
        {currentAmount !== null && currentAmount > 0 ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                status.tone === "danger"
                  ? "bg-destructive"
                  : status.tone === "warn"
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${Math.min(Math.max(status.percent, 0), 100)}%` }}
            />
          </div>
        ) : null}
      </div>
      {isAdmin ? (
        <>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            aria-label={`${label} budget`}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending || parsed === null || parsed < 0}
              onClick={() => void save(parsed)}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Save
            </Button>
            {currentAmount !== null ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setAmount("");
                  void save(null);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-sm tabular-nums sm:col-span-2 sm:text-right">
          {currentAmount === null ? "—" : formatMoney(currentAmount, currency)}
        </p>
      )}
    </div>
  );
}
