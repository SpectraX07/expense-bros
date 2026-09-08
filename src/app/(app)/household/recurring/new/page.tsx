import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewRecurringPage() {
  const { user, household, members } = await getAppContext();
  const { picker } = await listCategories(household.householdId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New recurring expense</h1>
        <p className="text-muted-foreground">
          Saved as a template. The dashboard will ask you to confirm it when the next run date arrives.
        </p>
      </div>
      <ExpenseForm
        mode="recurring"
        householdId={household.householdId}
        currency={household.currency}
        members={members}
        categories={picker}
        currentUserId={user.id}
      />
      <p className="text-sm text-muted-foreground">
        <Link href="/household/recurring" className="underline-offset-4 hover:underline">
          Back to templates
        </Link>
      </p>
    </div>
  );
}
