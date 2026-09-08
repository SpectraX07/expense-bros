"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { saveExpenseAction } from "@/app/actions/expenses";
import { saveRecurringAction } from "@/app/actions/recurring";
import { formatMoney, roundMoney, toMoneyNumber } from "@/lib/money";
import {
  computeSplits,
  splitRemainder,
  splitsAreValid,
  type SplitType,
} from "@/lib/splits";
import type { HouseholdMember } from "@/lib/households";
import type { ExpenseCategory, ExpenseRecord } from "@/lib/expenses";
import type { RecurringRecord } from "@/lib/recurring";
import type { Enums } from "@/lib/supabase/database.types";

const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "Percentage" },
  { value: "shares", label: "Shares" },
  { value: "custom_amount", label: "Custom amounts" },
];

export function ExpenseForm({
  householdId,
  currency,
  members,
  categories,
  currentUserId,
  expense,
  next,
  mode = "expense",
  recurring,
}: {
  householdId: string;
  currency: string;
  members: HouseholdMember[];
  categories: ExpenseCategory[];
  currentUserId: string;
  expense?: ExpenseRecord;
  next?: string;
  mode?: "expense" | "recurring";
  recurring?: RecurringRecord;
}) {
  const people = useMemo(() => {
    const existingSplits = expense?.splits ?? recurring?.splits ?? [];
    const map = new Map(members.map((member) => [member.userId, member]));
    for (const split of existingSplits) {
      if (!map.has(split.userId)) {
        map.set(split.userId, {
          userId: split.userId,
          fullName: "Former member",
          avatarUrl: null,
          role: "member",
          joinedAt: expense?.expenseDate ?? recurring?.nextRunDate ?? new Date().toISOString(),
        });
      }
    }
    return [...map.values()];
  }, [members, expense, recurring]);
  const existingSplits = expense?.splits ?? recurring?.splits ?? [];

  const [itemName, setItemName] = useState(expense?.itemName ?? recurring?.itemName ?? "");
  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : recurring ? String(recurring.amount) : "",
  );
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? recurring?.nextRunDate ?? format(new Date(), "yyyy-MM-dd"),
  );
  const [frequency, setFrequency] = useState<Enums<"recurrence_frequency">>(
    recurring?.frequency ?? "monthly",
  );
  const [paidBy, setPaidBy] = useState(expense?.paidById ?? recurring?.paidById ?? currentUserId);
  const [categoryId, setCategoryId] = useState<string | null>(
    expense?.category?.id ?? recurring?.category?.id ?? null,
  );
  const [categoryList, setCategoryList] = useState(categories);
  const [splitType, setSplitType] = useState<SplitType>(
    expense?.splitType ?? recurring?.splitType ?? "equal",
  );
  const [note, setNote] = useState(expense?.note ?? recurring?.note ?? "");
  const [included, setIncluded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const person of people) {
      const existing = existingSplits.find((split) => split.userId === person.userId);
      initial[person.userId] = existing ? existing.isIncluded : true;
    }
    return initial;
  });
  const [percents, setPercents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const total = expense?.amount ?? recurring?.amount ?? 0;
    for (const person of people) {
      const existing = existingSplits.find((split) => split.userId === person.userId);
      const percent =
        total > 0 && existing?.isIncluded
          ? roundMoney((existing.shareAmount / total) * 100)
          : roundMoney(100 / Math.max(people.length, 1));
      initial[person.userId] = String(percent);
    }
    return initial;
  });
  const [shares, setShares] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const person of people) {
      const existing = existingSplits.find((split) => split.userId === person.userId);
      initial[person.userId] = existing?.isIncluded
        ? String(Math.max(1, Math.round(existing.shareAmount * 100)))
        : "1";
    }
    return initial;
  });
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const person of people) {
      const existing = existingSplits.find((split) => split.userId === person.userId);
      initial[person.userId] = existing ? String(existing.shareAmount) : "";
    }
    return initial;
  });
  const [pending, setPending] = useState(false);

  const total = toMoneyNumber(amount);
  const computed = computeSplits(
    total,
    splitType,
    people.map((person) => ({
      userId: person.userId,
      included: included[person.userId] ?? true,
      percent: toMoneyNumber(percents[person.userId]),
      shares: Math.max(0, toMoneyNumber(shares[person.userId])),
      customAmount: toMoneyNumber(customAmounts[person.userId]),
    })),
  );
  const remainder = splitRemainder(total, computed);
  const valid = splitsAreValid(total, computed) && itemName.trim().length > 0;

  async function onSubmit() {
    if (!valid) {
      toast.error("Check the amount, item name, and that splits add up.");
      return;
    }

    setPending(true);
    try {
      const payload = {
        householdId,
        paidBy,
        categoryId,
        itemName,
        amount: total,
        splitType,
        note: note.trim() || null,
        splits: computed.map((split) => ({
          userId: split.userId,
          shareAmount: split.shareAmount,
          isIncluded: split.included,
        })),
      };
      const result =
        mode === "recurring"
          ? await saveRecurringAction({
              ...payload,
              id: recurring?.id,
              frequency,
              nextRunDate: expenseDate,
              active: recurring?.active ?? true,
            })
          : await saveExpenseAction({
              ...payload,
              id: expense?.id,
              expenseDate,
              next,
            });
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="itemName">Item</Label>
          <Input
            id="itemName"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Groceries, electricity, rent..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">{mode === "recurring" ? "Next run" : "Date"}</Label>
          <Input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            required
          />
        </div>
        {mode === "recurring" ? (
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => {
                if (value === "monthly" || value === "weekly") {
                  setFrequency(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Paid by</Label>
          <Select value={paidBy} onValueChange={(value) => {
            if (typeof value === "string") {
              setPaidBy(value);
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person.userId} value={person.userId}>
                  {person.fullName}
                  {person.userId === currentUserId ? " (you)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Split type</Label>
          <Select value={splitType} onValueChange={(value) => {
            if (typeof value === "string") {
              setSplitType(value as SplitType);
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPLIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Category</Label>
          <CategoryPicker
            householdId={householdId}
            categories={categoryList}
            value={categoryId}
            onChange={setCategoryId}
            onCreated={(category) => {
              setCategoryList((current) => [category, ...current]);
            }}
          />
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Split</h2>
            <p className="text-xs text-muted-foreground">
              Default is equal among everyone. Toggle people off to exclude them.
            </p>
          </div>
          <p className={`text-xs font-medium ${remainder === 0 ? "text-muted-foreground" : "text-destructive"}`}>
            {remainder === 0
              ? "Splits add up"
              : remainder > 0
                ? `${formatMoney(remainder, currency)} left`
                : `${formatMoney(Math.abs(remainder), currency)} over`}
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-border p-2">
          {people.map((person) => {
            const split = computed.find((row) => row.userId === person.userId);
            const isIncluded = included[person.userId] ?? true;
            return (
              <div
                key={person.userId}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg px-2 py-2 sm:grid-cols-[auto_1fr_7rem_6.5rem]"
              >
                <Checkbox
                  checked={isIncluded}
                  onCheckedChange={(checked) => {
                    setIncluded((current) => ({
                      ...current,
                      [person.userId]: checked === true,
                    }));
                  }}
                  aria-label={`Include ${person.fullName}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {person.fullName}
                    {person.userId === currentUserId ? " (you)" : ""}
                  </p>
                </div>
                {splitType === "percentage" ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isIncluded}
                    value={percents[person.userId] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setPercents((current) => ({ ...current, [person.userId]: next }));
                    }}
                    aria-label={`${person.fullName} percent`}
                    className="sm:col-auto col-span-3 sm:col-span-1"
                  />
                ) : null}
                {splitType === "shares" ? (
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!isIncluded}
                    value={shares[person.userId] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setShares((current) => ({ ...current, [person.userId]: next }));
                    }}
                    aria-label={`${person.fullName} shares`}
                    className="sm:col-auto col-span-3 sm:col-span-1"
                  />
                ) : null}
                {splitType === "custom_amount" ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isIncluded}
                    value={customAmounts[person.userId] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setCustomAmounts((current) => ({ ...current, [person.userId]: next }));
                    }}
                    aria-label={`${person.fullName} amount`}
                    className="sm:col-auto col-span-3 sm:col-span-1"
                  />
                ) : null}
                <p className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatMoney(split?.shareAmount ?? 0, currency)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional"
          rows={3}
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || !valid}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        {mode === "recurring"
          ? recurring
            ? "Save template"
            : "Add template"
          : expense
            ? "Save expense"
            : "Add expense"}
      </Button>
    </form>
  );
}
