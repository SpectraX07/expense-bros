import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { PageHeader } from "@/components/app/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  const { user, household, members } = await getAppContext();
  const { picker } = await listCategories(household.householdId);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Add expense"
        description="Amount first. Name it, tap a category, and save. Extra details are optional."
      />
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
