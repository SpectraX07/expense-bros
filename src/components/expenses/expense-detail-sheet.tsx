"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ExpenseRecord } from "@/lib/expenses";

export function ExpenseDetailSheet({
  expense,
  currency,
  currentUserId,
  names,
  canEdit,
}: {
  expense: ExpenseRecord;
  currency: string;
  currentUserId: string;
  names: Record<string, string>;
  canEdit: boolean;
}) {
  const nameMap = new Map(Object.entries(names));
  const edited =
    Boolean(expense.editedByName) ||
    (expense.updatedAt &&
      expense.createdAt &&
      new Date(expense.updatedAt).getTime() - new Date(expense.createdAt).getTime() > 2000);

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>Details</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:data-[side=bottom]:inset-x-auto sm:data-[side=bottom]:right-0 sm:data-[side=bottom]:left-auto md:max-w-lg">
        <SheetHeader>
          <SheetTitle>{expense.itemName}</SheetTitle>
          <SheetDescription>
            {format(parseISO(expense.expenseDate), "d MMM yyyy")} · paid by {expense.paidByName} ·{" "}
            {formatMoney(expense.amount, currency)}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {expense.note ? (
            <p className="text-sm text-muted-foreground">{expense.note}</p>
          ) : null}
          {edited ? (
            <p className="text-xs text-muted-foreground">
              Edited{expense.editedByName ? ` by ${expense.editedByName}` : ""}
            </p>
          ) : null}
          <ul className="space-y-2">
            {expense.splits.map((split) => (
              <li
                key={split.userId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className={!split.isIncluded ? "text-muted-foreground line-through" : undefined}>
                  {nameMap.get(split.userId) ?? "Roommate"}
                  {split.userId === currentUserId ? " (you)" : ""}
                  {!split.isIncluded ? " · not included" : ""}
                </span>
                <span className="tabular-nums">
                  {formatMoney(split.shareAmount, currency)}
                </span>
              </li>
            ))}
          </ul>
          {canEdit ? (
            <Link
              href={`/expenses/${expense.id}/edit`}
              className={cn(buttonVariants(), "w-full")}
            >
              Edit expense
            </Link>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
