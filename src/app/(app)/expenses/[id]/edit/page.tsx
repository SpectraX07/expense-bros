import { notFound, redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { getExpense, listCategories } from "@/lib/expenses";
import { PageHeader } from "@/components/app/page-header";
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
    <div className="w-full space-y-6">
      <PageHeader title="Edit expense" description={expense.itemName}>
        <DeleteExpenseButton expenseId={expense.id} itemName={expense.itemName} />
      </PageHeader>
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
