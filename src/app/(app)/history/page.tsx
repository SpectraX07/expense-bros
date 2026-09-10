import Link from "next/link";
import { format, parseISO } from "date-fns";
import { SearchXIcon } from "lucide-react";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { EXPENSE_LIST_LIMIT, listCategories, listExpenses } from "@/lib/expenses";
import { describeRange, parseHistoryRange } from "@/lib/history-range";
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
    range?: string;
    from?: string;
    to?: string;
    category?: string;
    payer?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const { user, household, members, isAdmin } = await getAppContext();
  const { year, month } = parsePeriod(params.year, params.month);
  const range = parseHistoryRange(params, { year, month });
  const uncategorised = params.category === "none";
  const categoryId = uncategorised ? undefined : params.category;

  const [{ picker }, expenses] = await Promise.all([
    listCategories(household.householdId),
    listExpenses({
      householdId: household.householdId,
      year,
      month,
      from: range.from,
      to: range.to,
      categoryId,
      uncategorised,
      paidBy: params.payer,
      query: params.q?.trim(),
    }),
  ]);

  const extra = {
    category: params.category,
    payer: params.payer,
    q: params.q,
  };

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const yourShare = expenses.reduce((sum, expense) => {
    const mine = expense.splits.find(
      (split) => split.userId === user.id && split.isIncluded,
    );
    return sum + (mine?.shareAmount ?? 0);
  }, 0);
  const spansMonths = range.key !== "month";
  const hasFilters =
    Boolean(params.q?.trim()) ||
    Boolean(params.category) ||
    Boolean(params.payer) ||
    range.key !== "month";

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="History"
        description="Search across items and notes, then narrow by date, category, or who paid."
      >
        {range.key === "month" ? (
          <Link
            href={`/api/export?year=${year}&month=${month}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Export CSV
          </Link>
        ) : null}
        <Link href="/expenses/new" className={cn(buttonVariants())}>
          Add expense
        </Link>
      </PageHeader>

      {range.key === "month" ? <MonthSwitcher year={year} month={month} extra={extra} /> : null}

      <HistoryFilters
        year={year}
        month={month}
        query={params.q ?? ""}
        range={range.key}
        from={range.from ?? ""}
        to={range.to ?? ""}
        categoryId={categoryId ?? ""}
        payerId={params.payer ?? ""}
        uncategorised={uncategorised}
        currentUserId={user.id}
        categories={picker.map((category) => ({ id: category.id, name: category.name }))}
        members={members.map((member) => ({
          userId: member.userId,
          fullName: member.fullName,
        }))}
      />

      {expenses.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-muted/45 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{expenses.length}</span>{" "}
            {expenses.length === 1 ? "expense" : "expenses"} · {describeRange(range, { year, month })}
            {expenses.length >= EXPENSE_LIST_LIMIT ? " · showing newest 500" : ""}
          </p>
          <p className="text-muted-foreground">
            Total{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(total, household.currency)}
            </span>{" "}
            · your share{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(yourShare, household.currency)}
            </span>
          </p>
        </div>
      ) : null}

      {expenses.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title={hasFilters ? "Nothing matches those filters" : "No expenses in this period"}
          description={
            hasFilters
              ? `Nothing found in ${describeRange(range, { year, month })}. Try a wider date range or clear the filters.`
              : "Add one and it will show up here with who paid and how it was split."
          }
        >
          <Link href="/expenses/new" className={cn(buttonVariants())}>
            Add expense
          </Link>
          {hasFilters ? (
            <Link
              href={`/history?year=${year}&month=${month}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Clear filters
            </Link>
          ) : null}
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => {
            const canEdit = isAdmin || expense.createdBy === user.id;
            const names = new Map(members.map((member) => [member.userId, member.fullName]));
            const edited = Boolean(expense.editedByName);
            return (
              <li key={expense.id}>
                <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-sm transition-colors hover:border-border sm:flex sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex items-start justify-between gap-3 sm:min-w-0 sm:flex-1">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {expense.itemName}
                        {edited ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            edited
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground sm:truncate">
                        {format(parseISO(expense.expenseDate), spansMonths ? "d MMM yyyy" : "d MMM")}{" "}
                        · paid by {expense.paidByName}
                        {" · "}
                        {splitSummary(expense, user.id, household.currency)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums sm:hidden">
                      {formatMoney(expense.amount, household.currency)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 sm:mt-0 sm:shrink-0 sm:justify-end">
                    {expense.category ? (
                      <Badge variant="secondary" className="max-w-[9rem] truncate">
                        {expense.category.name}
                      </Badge>
                    ) : (
                      <span className="sm:hidden" />
                    )}
                    <p className="hidden text-sm font-medium tabular-nums sm:block">
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
