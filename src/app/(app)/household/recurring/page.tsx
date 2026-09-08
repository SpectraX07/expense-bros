import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAppContext } from "@/lib/app-context";
import { listRecurringExpenses } from "@/lib/recurring";
import { formatMoney } from "@/lib/money";
import { RecurringRowActions } from "@/components/recurring/recurring-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function RecurringPage() {
  const { user, household, isAdmin } = await getAppContext();
  const templates = await listRecurringExpenses(household.householdId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>
          <p className="text-muted-foreground">
            Rent and bills. Confirm due ones from the dashboard when the date arrives.
          </p>
        </div>
        <Link href="/household/recurring/new" className={cn(buttonVariants())}>
          Add template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No recurring expenses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add rent, Wi-Fi, or any bill that repeats so you are not retyping it every month.
          </p>
          <Link href="/household/recurring/new" className={cn(buttonVariants(), "mt-4")}>
            Add template
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((item) => {
            const canEdit = isAdmin || item.createdBy === user.id;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
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
