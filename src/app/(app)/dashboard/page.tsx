import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { getDashboardStats } from "@/lib/dashboard";
import { budgetStatus } from "@/lib/budget-status";
import { listDueRecurringExpenses } from "@/lib/recurring";
import { formatMoney } from "@/lib/money";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { OverallBudgetForm } from "@/components/dashboard/overall-budget-form";
import { QuickAddExpense } from "@/components/dashboard/quick-add-expense";
import { RecurringDueActions } from "@/components/recurring/recurring-due-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<
  ReturnType<typeof budgetStatus>["tone"],
  "secondary" | "outline" | "destructive"
> = {
  muted: "secondary",
  ok: "outline",
  warn: "outline",
  danger: "destructive",
};

const STATUS_BAR: Record<ReturnType<typeof budgetStatus>["tone"], string> = {
  muted: "bg-muted-foreground/40",
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-destructive",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const { user, household, members, isAdmin } = await getAppContext();
  const { year, month } = parsePeriod(params.year, params.month);
  const [{ picker }, stats, dueRecurring] = await Promise.all([
    listCategories(household.householdId),
    getDashboardStats(household.householdId, year, month),
    listDueRecurringExpenses(household.householdId, format(new Date(), "yyyy-MM-dd")),
  ]);

  const status = budgetStatus(stats.totalSpent, stats.overallBudget);
  const remaining =
    stats.overallBudget !== null && stats.overallBudget > 0
      ? stats.overallBudget - stats.totalSpent
      : null;
  const next = `/dashboard?year=${year}&month=${month}`;
  const barWidth = Math.min(Math.max(status.percent, 0), 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {household.name} · {household.currency}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSwitcher year={year} month={month} />
          <QuickAddExpense
            householdId={household.householdId}
            currency={household.currency}
            members={members}
            categories={picker}
            currentUserId={user.id}
            next={next}
          />
        </div>
      </div>

      {dueRecurring.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Due recurring expenses</CardTitle>
            <CardDescription>
              Confirm rent and other templates to add them for the due date, or skip this run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecurringDueActions items={dueRecurring} currency={household.currency} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total spent</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatMoney(stats.totalSpent, household.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.expenseCount === 0
                ? "No expenses logged this month."
                : `${stats.expenseCount} expense${stats.expenseCount === 1 ? "" : "s"} this month.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>Budget vs actual</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {stats.overallBudget === null
                    ? "—"
                    : formatMoney(stats.overallBudget, household.currency)}
                </CardTitle>
              </div>
              <Badge variant={STATUS_BADGE[status.tone]}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.overallBudget !== null && stats.overallBudget > 0 ? (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", STATUS_BAR[status.tone])}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(stats.totalSpent, household.currency)} spent
                  {remaining === null
                    ? null
                    : remaining >= 0
                      ? ` · ${formatMoney(remaining, household.currency)} left`
                      : ` · ${formatMoney(Math.abs(remaining), household.currency)} over`}
                  {" · "}
                  {status.percent}%
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Set a monthly budget to track progress."
                  : "Ask an admin to set a monthly budget."}
              </p>
            )}
            {isAdmin ? (
              <OverallBudgetForm
                key={`${year}-${month}-${String(stats.overallBudget)}`}
                householdId={household.householdId}
                year={year}
                month={month}
                currentAmount={stats.overallBudget}
              />
            ) : null}
            <Link
              href={`/household/budgets?year=${year}&month=${month}`}
              className="inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Budget settings
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats.expenseCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Nothing spent this month yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use Add expense above to log the first one without leaving this page.
          </p>
          <Link href="/expenses/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Open full form
          </Link>
        </div>
      ) : null}

      <DashboardCharts stats={stats} currency={household.currency} />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Recent</CardTitle>
              <CardDescription>Latest expenses this month.</CardDescription>
            </div>
            <Link
              href={`/history?year=${year}&month=${month}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View history
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses to list yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(expense.expenseDate), "d MMM")} · {expense.paidByName}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(expense.amount, household.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
