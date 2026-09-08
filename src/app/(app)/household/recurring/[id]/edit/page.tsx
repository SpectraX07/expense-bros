import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { getRecurringExpense } from "@/lib/recurring";
import { PageHeader } from "@/components/app/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, household, members, isAdmin } = await getAppContext();
  const [recurring, { picker }] = await Promise.all([
    getRecurringExpense(household.householdId, id),
    listCategories(household.householdId),
  ]);

  if (!recurring) {
    notFound();
  }
  if (!isAdmin && recurring.createdBy !== user.id) {
    notFound();
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Edit recurring expense"
        description="Changes apply to future runs, not expenses already logged."
      />
      <ExpenseForm
        mode="recurring"
        householdId={household.householdId}
        currency={household.currency}
        members={members}
        categories={picker}
        currentUserId={user.id}
        recurring={recurring}
      />
      <p className="text-sm text-muted-foreground">
        <Link href="/household/recurring" className="underline-offset-4 hover:underline">
          Back to templates
        </Link>
      </p>
    </div>
  );
}
