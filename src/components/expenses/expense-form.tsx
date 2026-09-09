"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { currencySymbol, formatMoney, roundMoney, toMoneyNumber } from "@/lib/money";
import {
  computeSplits,
  splitRemainder,
  splitsAreValid,
  type SplitType,
} from "@/lib/splits";
import { cn } from "@/lib/utils";
import type { HouseholdMember } from "@/lib/households";
import type { ExpenseCategory, ExpenseRecord } from "@/lib/expenses";
import type { RecurringRecord } from "@/lib/recurring";
import type { Enums } from "@/lib/supabase/database.types";

const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Split equally" },
  { value: "percentage", label: "By percentage" },
  { value: "shares", label: "By shares" },
  { value: "custom_amount", label: "Custom amounts" },
];

function prefsKey(householdId: string) {
  return `eb-last-expense:${householdId}`;
}

function readPrefs(householdId: string) {
  try {
    const raw = localStorage.getItem(prefsKey(householdId));
    if (!raw) {
      return { categoryId: null as string | null, paidBy: null as string | null };
    }
    const parsed = JSON.parse(raw) as { categoryId?: string | null; paidBy?: string | null };
    return {
      categoryId: parsed.categoryId ?? null,
      paidBy: parsed.paidBy ?? null,
    };
  } catch {
    return { categoryId: null as string | null, paidBy: null as string | null };
  }
}

function writePrefs(householdId: string, categoryId: string | null, paidBy: string) {
  try {
    localStorage.setItem(prefsKey(householdId), JSON.stringify({ categoryId, paidBy }));
  } catch {
    /* ignore quota / private mode */
  }
}

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
  defaultItemName,
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
  defaultItemName?: string;
}) {
  const isEditing = Boolean(expense || recurring);
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
          isActive: false,
          paymentHandle: null,
        });
      }
    }
    return [...map.values()];
  }, [members, expense, recurring]);
  const existingSplits = expense?.splits ?? recurring?.splits ?? [];

  const [itemName, setItemName] = useState(
    expense?.itemName ?? recurring?.itemName ?? defaultItemName ?? "",
  );
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
  const [showMore, setShowMore] = useState(isEditing);
  const [showSplit, setShowSplit] = useState(() => {
    if (!isEditing) {
      return false;
    }
    const type = expense?.splitType ?? recurring?.splitType ?? "equal";
    const someoneOut = existingSplits.some((split) => !split.isIncluded);
    return type !== "equal" || someoneOut;
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    const prefs = readPrefs(householdId);
    if (prefs.paidBy && people.some((person) => person.userId === prefs.paidBy)) {
      setPaidBy(prefs.paidBy);
    }
    if (prefs.categoryId && categories.some((category) => category.id === prefs.categoryId)) {
      setCategoryId(prefs.categoryId);
    }
  }, [categories, householdId, isEditing, people]);

  const paidByItems = useMemo(
    () =>
      Object.fromEntries(
        people.map((person) => [
          person.userId,
          `${person.fullName}${person.userId === currentUserId ? " (you)" : ""}`,
        ]),
      ),
    [people, currentUserId],
  );
  const splitItems = Object.fromEntries(
    SPLIT_OPTIONS.map((option) => [option.value, option.label]),
  );

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
  const includedPeople = people.filter((person) => included[person.userId] !== false);
  const payer = people.find((person) => person.userId === paidBy);
  const symbol = currencySymbol(currency);
  const needsSplit = people.length > 1;
  const simpleEqual = splitType === "equal" && includedPeople.length === people.length;

  const blockedReason = !itemName.trim()
    ? "Add a short name for this expense."
    : total <= 0
      ? "Enter an amount."
      : remainder !== 0
        ? "Splits must add up to the total."
        : includedPeople.length === 0
          ? "Include at least one person in the split."
          : null;

  async function onSubmit() {
    if (!valid) {
      toast.error(blockedReason ?? "Check the amount, item name, and that splits add up.");
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
      if (mode === "expense") {
        writePrefs(householdId, categoryId, paidBy);
      }
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

  const submitLabel =
    mode === "recurring"
      ? recurring
        ? "Save template"
        : "Add template"
      : expense
        ? "Save expense"
        : "Add expense";

  return (
    <form
      className="space-y-6 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm ring-1 ring-foreground/8 md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="rounded-2xl bg-muted/45 px-4 py-6 text-center sm:px-6">
        <Label htmlFor="amount" className="text-muted-foreground">
          Amount
        </Label>
        <div className="mt-2 flex w-fit max-w-full items-baseline justify-center gap-0.5 mx-auto">
          <span className="font-heading text-5xl font-semibold leading-none text-muted-foreground sm:text-6xl">
            {symbol}
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoFocus={!isEditing}
            value={amount}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/[^\d.]/g, "");
              const [whole, ...rest] = nextValue.split(".");
              setAmount(rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole);
            }}
            placeholder="0"
            required
            aria-label="Amount"
            style={{ width: `${Math.max((amount || "0").length, 1)}ch` }}
            className="min-w-[1ch] bg-transparent font-heading text-5xl font-semibold leading-none tabular-nums outline-none placeholder:text-muted-foreground/40 sm:text-6xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemName">What was it?</Label>
        <Input
          id="itemName"
          value={itemName}
          onChange={(event) => setItemName(event.target.value)}
          placeholder="Milk, electricity, rent..."
          required
          className="h-10 text-base"
        />
      </div>

      <div className="space-y-2">
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

      {mode === "recurring" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expenseDate">Next run</Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Repeats</Label>
            <Select
              value={frequency}
              items={{ monthly: "Monthly", weekly: "Weekly" }}
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
        </div>
      ) : null}

      {needsSplit ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {payer?.userId === currentUserId ? "You paid" : `${payer?.fullName ?? "Someone"} paid`}
                {simpleEqual
                  ? ` · split equally with ${people.length === 2 ? "both of you" : `everyone (${people.length})`}`
                  : ` · custom split`}
              </p>
              <p className="text-xs text-muted-foreground">
                {includedPeople.map((person) => person.fullName.split(" ")[0]).join(", ")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSplit((open) => !open)}
            >
              {showSplit ? "Done" : "Change split"}
            </Button>
          </div>

          {showSplit ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="space-y-2">
                <Label>How to split</Label>
                <Select
                  value={splitType}
                  items={splitItems}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      setSplitType(value as SplitType);
                    }
                  }}
                >
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
              <p
                className={cn(
                  "text-xs font-medium",
                  remainder === 0 ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {remainder === 0
                  ? "Splits add up"
                  : remainder > 0
                    ? `${formatMoney(remainder, currency)} left`
                    : `${formatMoney(Math.abs(remainder), currency)} over`}
              </p>
              <div className="space-y-1">
                {people.map((person) => {
                  const split = computed.find((row) => row.userId === person.userId);
                  const isIncluded = included[person.userId] ?? true;
                  return (
                    <div
                      key={person.userId}
                      className="flex flex-col gap-2 rounded-lg border border-border/70 p-2 sm:grid sm:grid-cols-[auto_auto_1fr_7rem_6.5rem] sm:items-center sm:gap-2 sm:border-0 sm:p-0 sm:py-1.5"
                    >
                      <div className="flex items-center gap-2 sm:contents">
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
                        <Avatar size="sm">
                          {person.avatarUrl ? (
                            <AvatarImage src={person.avatarUrl} alt={person.fullName} />
                          ) : null}
                          <AvatarFallback>{person.fullName.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">
                          {person.fullName}
                          {person.userId === currentUserId ? " (you)" : ""}
                        </p>
                        <p className="text-right text-sm tabular-nums text-muted-foreground sm:hidden">
                          {formatMoney(split?.shareAmount ?? 0, currency)}
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
                            const nextValue = event.target.value;
                            setPercents((current) => ({ ...current, [person.userId]: nextValue }));
                          }}
                          aria-label={`${person.fullName} percent`}
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
                            const nextValue = event.target.value;
                            setShares((current) => ({ ...current, [person.userId]: nextValue }));
                          }}
                          aria-label={`${person.fullName} shares`}
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
                            const nextValue = event.target.value;
                            setCustomAmounts((current) => ({
                              ...current,
                              [person.userId]: nextValue,
                            }));
                          }}
                          aria-label={`${person.fullName} amount`}
                        />
                      ) : null}
                      <p className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                        {formatMoney(split?.shareAmount ?? 0, currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowMore((open) => !open)}
        >
          <ChevronDownIcon className={cn("size-4 transition-transform", showMore && "rotate-180")} />
          {showMore ? "Hide extra details" : "Date, who paid, note"}
        </button>
        {showMore ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mode === "expense" ? (
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Who paid</Label>
              <Select
                value={paidBy}
                items={paidByItems}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    setPaidBy(value);
                  }
                }}
              >
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || !valid}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {submitLabel}
        </Button>
        {blockedReason && !pending ? (
          <p className="text-sm text-muted-foreground">{blockedReason}</p>
        ) : null}
      </div>
    </form>
  );
}
