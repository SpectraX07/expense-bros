"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { HouseholdMember } from "@/lib/households";
import type { ExpenseCategory } from "@/lib/expenses";

export function QuickAddExpense({
  householdId,
  currency,
  members,
  categories,
  currentUserId,
  next,
}: {
  householdId: string;
  currency: string;
  members: HouseholdMember[];
  categories: ExpenseCategory[];
  currentUserId: string;
  next: string;
}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button />}>
        <PlusIcon />
        Add expense
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Add expense</SheetTitle>
          <SheetDescription>
            Amount, a short name, a category, then save. Extra details stay optional.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ExpenseForm
            householdId={householdId}
            currency={currency}
            members={members}
            categories={categories}
            currentUserId={currentUserId}
            next={next}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
