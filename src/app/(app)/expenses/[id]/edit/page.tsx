import { notFound, redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { getExpense, listCategories } from "@/lib/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, household, members, isAdmin } = await getAppContext();
  const [expense, categories] = await Promise.all([
    getExpense(household.householdId, id),
    listCategories(household.householdId),
  ]);

  if (!expense) {
    notFound();
  }

  const canEdit = isAdmin || expense.createdBy === user.id;
  if (!canEdit) {
    redirect("/history");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit expense</h1>
          <p className="text-muted-foreground">{expense.itemName}</p>
        </div>
        <DeleteExpenseButton expenseId={expense.id} itemName={expense.itemName} />
      </div>
      <ExpenseForm
        householdId={household.householdId}
        currency={household.currency}
        members={members}
        categories={categories.picker}
        currentUserId={user.id}
        expense={expense}
      />
    </div>
  );
}
