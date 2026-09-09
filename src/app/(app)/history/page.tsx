import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { listCategories, listExpenses } from "@/lib/expenses";
import { formatMoney } from "@/lib/money";
import { splitSummary } from "@/lib/split-summary";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryFilters } from "@/components/expenses/history-filters";
import { ExpenseDetailSheet } from "@/components/expenses/expense-detail-sheet";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { cn } from "@/lib/utils";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    category?: string;
    payer?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const { user, household, members, isAdmin } = await getAppContext();
  const { year, month } = parsePeriod(params.year, params.month);
  const [{ picker }, expenses] = await Promise.all([
    listCategories(household.householdId),
    listExpenses({
      householdId: household.householdId,
      year,
      month,
      categoryId: params.category,
      paidBy: params.payer,
      query: params.q?.trim(),
    }),
  ]);

  const extra = {
    category: params.category,
    payer: params.payer,
    q: params.q,
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="History" description="Filter by month, category, or who paid.">
        <Link
          href={`/api/export?year=${year}&month=${month}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Export CSV
        </Link>
        <Link href="/expenses/new" className={cn(buttonVariants())}>
          Add expense
        </Link>
      </PageHeader>

      <MonthSwitcher year={year} month={month} extra={extra} />

      <HistoryFilters
        year={year}
        month={month}
        query={params.q ?? ""}
        categoryId={params.category ?? ""}
        payerId={params.payer ?? ""}
        categories={picker.map((category) => ({ id: category.id, name: category.name }))}
        members={members.map((member) => ({
          userId: member.userId,
          fullName: member.fullName,
        }))}
      />

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses this month"
          description="Add one and it will show up here with who paid and how it was split."
        >
          <Link href="/expenses/new" className={cn(buttonVariants())}>
            Add expense
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => {
            const canEdit = isAdmin || expense.createdBy === user.id;
            const names = new Map(members.map((member) => [member.userId, member.fullName]));
            const edited = Boolean(expense.editedByName);
            return (
              <li key={expense.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {expense.itemName}
                      {edited ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">edited</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(expense.expenseDate), "d MMM")} · paid by{" "}
                      {expense.paidByName}
                      {" · "}
                      {splitSummary(expense, user.id, household.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {expense.category ? (
                      <Badge variant="secondary">{expense.category.name}</Badge>
                    ) : null}
                    <p className="text-sm font-medium tabular-nums">
                      {formatMoney(expense.amount, household.currency)}
                    </p>
                    <ExpenseDetailSheet
                      expense={expense}
                      currency={household.currency}
                      currentUserId={user.id}
                      names={Object.fromEntries(names)}
                      canEdit={canEdit}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
