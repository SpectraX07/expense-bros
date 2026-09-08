import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { listCategories, listExpenses } from "@/lib/expenses";
import { formatMoney } from "@/lib/money";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-muted-foreground">Filter by month, category, or who paid.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/api/export?year=${year}&month=${month}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Export CSV
          </Link>
          <Link href="/expenses/new" className={cn(buttonVariants())}>
            Add expense
          </Link>
        </div>
      </div>

      <MonthSwitcher year={year} month={month} extra={extra} />

      <form className="grid gap-2 sm:grid-cols-4" method="get">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <Input name="q" defaultValue={params.q ?? ""} placeholder="Search items" />
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All categories</option>
          {picker.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="payer"
          defaultValue={params.payer ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Anyone paid</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName}
            </option>
          ))}
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
          Apply
        </button>
      </form>

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No expenses this month</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one and it will show up here with who paid and how it was split.
          </p>
          <Link href="/expenses/new" className={cn(buttonVariants(), "mt-4")}>
            Add expense
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => {
            const canEdit = isAdmin || expense.createdBy === user.id;
            return (
              <li key={expense.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(expense.expenseDate), "d MMM")} · paid by{" "}
                      {expense.paidByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {expense.category ? (
                      <Badge variant="secondary">{expense.category.name}</Badge>
                    ) : null}
                    <p className="text-sm font-medium tabular-nums">
                      {formatMoney(expense.amount, household.currency)}
                    </p>
                    {canEdit ? (
                      <Link
                        href={`/expenses/${expense.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                    ) : null}
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
