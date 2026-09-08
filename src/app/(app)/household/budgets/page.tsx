import Link from "next/link";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { getDashboardStats } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/money";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { BudgetRow } from "@/components/budgets/budget-row";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const { household, isAdmin } = await getAppContext();
  const { year, month } = parsePeriod(params.year, params.month);
  const [{ picker }, stats] = await Promise.all([
    listCategories(household.householdId),
    getDashboardStats(household.householdId, year, month),
  ]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("category_id, planned_amount")
    .eq("household_id", household.householdId)
    .eq("year", year)
    .eq("month", month);

  if (error) {
    throw error;
  }

  const planned = new Map<string | null, number>();
  for (const row of data ?? []) {
    planned.set(row.category_id, toMoneyNumber(row.planned_amount));
  }

  const spentByCategory = new Map(stats.byCategory.map((row) => [row.id, row.amount]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-muted-foreground">
          Set an overall cap and optional per-category limits for this month.
        </p>
        <Link
          href={`/dashboard?year=${year}&month=${month}`}
          className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          View dashboard
        </Link>
      </div>

      <MonthSwitcher year={year} month={month} />

      <BudgetRow
        key={`overall-${year}-${month}`}
        householdId={household.householdId}
        year={year}
        month={month}
        categoryId={null}
        label="Overall"
        currentAmount={planned.get(null) ?? stats.overallBudget}
        spent={stats.totalSpent}
        currency={household.currency}
        isAdmin={isAdmin}
      />

      <div className="space-y-2">
        {picker.map((category) => (
          <BudgetRow
            key={`${category.id}-${year}-${month}`}
            householdId={household.householdId}
            year={year}
            month={month}
            categoryId={category.id}
            label={category.name}
            currentAmount={planned.get(category.id) ?? null}
            spent={spentByCategory.get(category.id) ?? 0}
            currency={household.currency}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}
