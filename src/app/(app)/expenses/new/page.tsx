import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  const { user, household, members } = await getAppContext();
  const { picker } = await listCategories(household.householdId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add expense</h1>
        <p className="text-muted-foreground">
          Split equally by default, or switch to percentages, shares, or custom amounts.
        </p>
      </div>
      <ExpenseForm
        householdId={household.householdId}
        currency={household.currency}
        members={members}
        categories={picker}
        currentUserId={user.id}
      />
      <p className="text-sm text-muted-foreground">
        Need a household-only category later?{" "}
        <Link href="/household/categories" className="underline-offset-4 hover:underline">
          Manage categories
        </Link>
      </p>
    </div>
  );
}
