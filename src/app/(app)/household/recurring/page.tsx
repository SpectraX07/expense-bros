import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAppContext } from "@/lib/app-context";
import { listRecurringExpenses } from "@/lib/recurring";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { RecurringRowActions } from "@/components/recurring/recurring-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function RecurringPage() {
  const { user, household, isAdmin } = await getAppContext();
  const templates = await listRecurringExpenses(household.householdId);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Recurring"
        description="Rent and bills. Confirm due ones from the dashboard when the date arrives."
      >
        <Link href="/household/recurring/new" className={cn(buttonVariants())}>
          Add template
        </Link>
      </PageHeader>

      {templates.length === 0 ? (
        <EmptyState
          title="No recurring expenses yet"
          description="Add rent, Wi-Fi, or any bill that repeats so you are not retyping it every month."
        >
          <Link href="/household/recurring/new" className={cn(buttonVariants())}>
            Add template
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {templates.map((item) => {
            const canEdit = isAdmin || item.createdBy === user.id;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(item.amount, household.currency)} · {item.frequency} · next{" "}
                    {format(parseISO(item.nextRunDate), "d MMM yyyy")}
                    {item.category ? ` · ${item.category.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.active ? "secondary" : "outline"}>
                    {item.active ? "Active" : "Paused"}
                  </Badge>
                  {canEdit ? (
                    <Link
                      href={`/household/recurring/${item.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                  ) : null}
                  <RecurringRowActions
                    id={item.id}
                    itemName={item.itemName}
                    active={item.active}
                    canEdit={canEdit}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
