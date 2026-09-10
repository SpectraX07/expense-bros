import Link from "next/link";
import { format, parseISO } from "date-fns";
import { currentPeriod, getAppContext, parsePeriod } from "@/lib/app-context";
import { getSettlementSnapshot } from "@/lib/settlements";
import { formatMoney, moneyToCents } from "@/lib/money";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { SuggestedTransferCard } from "@/components/settlement/suggested-transfer-card";
import {
  CancelSettlementButton,
  ConfirmSettlementButton,
} from "@/components/settlement/settlement-review-buttons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils";

function personLabel(name: string, userId: string, currentUserId: string) {
  return userId === currentUserId ? `${name} (you)` : name;
}

function ScopeToggle({
  allTime,
  year,
  month,
}: {
  allTime: boolean;
  year: number;
  month: number;
}) {
  const monthHref = `?year=${year}&month=${month}`;
  const allHref = `?scope=all&year=${year}&month=${month}`;

  return (
    <div className="inline-flex rounded-lg bg-muted p-[3px]">
      <Link
        href={monthHref}
        className={cn(buttonVariants({ variant: allTime ? "ghost" : "default", size: "sm" }))}
      >
        This month
      </Link>
      <Link
        href={allHref}
        className={cn(buttonVariants({ variant: allTime ? "default" : "ghost", size: "sm" }))}
      >
        All time
      </Link>
    </div>
  );
}

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const { user, household, isAdmin } = await getAppContext();
  const { year, month } = parsePeriod(params.year, params.month);
  const allTime = params.scope === "all";
  const period = allTime ? null : { year, month };
  const stamp = allTime ? currentPeriod() : { year, month };
  const { balances, pending, confirmed, suggested } = await getSettlementSnapshot(
    household.householdId,
    period,
  );

  const mine = balances.find((row) => row.userId === user.id);
  const netCents = moneyToCents(mine?.net ?? 0);
  const settled = netCents === 0;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Settlement"
        description={`Fewest transfers to square up ${allTime ? "across all months" : "this month"}.`}
      >
        <ScopeToggle allTime={allTime} year={year} month={month} />
        {allTime ? null : <MonthSwitcher year={year} month={month} />}
        {allTime ? null : (
          <Link
            href={`/api/export?year=${year}&month=${month}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </Link>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardDescription>Your position</CardDescription>
          <CardTitle
            className={cn(
              "font-heading text-2xl text-balance tabular-nums sm:text-3xl",
              netCents < 0 ? "text-destructive" : null,
              netCents > 0 ? "text-emerald-600 dark:text-emerald-400" : null,
            )}
          >
            {netCents === 0
              ? "You are settled up"
              : netCents < 0
                ? `You owe ${formatMoney(Math.abs(mine?.net ?? 0), household.currency)}`
                : `You are owed ${formatMoney(mine?.net ?? 0, household.currency)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {settled
              ? pending.some((row) => row.fromUserId === user.id || row.toUserId === user.id)
                ? "A payment is still waiting on confirmation."
                : "No remaining transfers for this period."
              : "Confirmed repayments already come off these totals. Pending ones stay off until the other person confirms."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested transfers</CardTitle>
          <CardDescription>
            Greedy matching of who owes the most to who is owed the most.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggested.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {pending.length > 0
                ? "Nothing else to settle until pending payments are confirmed or cancelled."
                : "Everyone is square."}
            </p>
          ) : (
            <ul className="space-y-2">
              {suggested.map((row) => (
                <SuggestedTransferCard
                  key={`${row.fromUserId}-${row.toUserId}-${row.amount}`}
                  row={row}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  householdId={household.householdId}
                  householdName={household.name}
                  currency={household.currency}
                  year={stamp.year}
                  month={stamp.month}
                  allTime={allTime}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Household balances</CardTitle>
          <CardDescription>
            Paid vs fair share, after confirmed settlements.
            {allTime
              ? " Payments you mark here count toward this running balance and are recorded against this calendar month."
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:hidden">
            {balances.map((row) => (
              <div key={row.userId} className="rounded-xl border border-border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-medium">
                    <span className="block truncate">
                      {personLabel(row.fullName, row.userId, user.id)}
                    </span>
                    {row.isActive ? null : (
                      <Badge variant="secondary" className="mt-1">
                        Former
                      </Badge>
                    )}
                  </p>
                  <p
                    className={cn(
                      "shrink-0 text-right font-semibold tabular-nums",
                      moneyToCents(row.net) > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : moneyToCents(row.net) < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {moneyToCents(row.net) > 0 ? "+" : ""}
                    {formatMoney(row.net, household.currency)}
                  </p>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex gap-1.5">
                    <dt>Paid</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatMoney(row.paid, household.currency)}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>Share</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatMoney(row.fairShare, household.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-2 pr-3 font-medium">Roommate</th>
                  <th className="pb-2 pr-3 text-right font-medium">Paid</th>
                  <th className="pb-2 pr-3 text-right font-medium">Share</th>
                  <th className="pb-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((row) => (
                  <tr key={row.userId} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">
                        {personLabel(row.fullName, row.userId, user.id)}
                      </span>
                      {row.isActive ? null : (
                        <Badge variant="secondary" className="ml-2">
                          Former
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {formatMoney(row.paid, household.currency)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {formatMoney(row.fairShare, household.currency)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right font-medium tabular-nums",
                        moneyToCents(row.net) > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : moneyToCents(row.net) < 0
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {moneyToCents(row.net) > 0 ? "+" : ""}
                      {formatMoney(row.net, household.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waiting on confirmation</CardTitle>
          <CardDescription>Debtor marked paid; creditor still needs to confirm.</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending payments.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((row) => {
                const canConfirm = isAdmin || row.toUserId === user.id;
                const canCancel = isAdmin || row.fromUserId === user.id;
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {personLabel(row.fromName, row.fromUserId, user.id)} →{" "}
                        {personLabel(row.toName, row.toUserId, user.id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(row.amount, household.currency)}
                        {row.note ? ` · ${row.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pending</Badge>
                      {canConfirm ? (
                        <ConfirmSettlementButton
                          settlementId={row.id}
                          fromName={row.fromName}
                          amount={row.amount}
                          currency={household.currency}
                        />
                      ) : null}
                      {canCancel ? (
                        <CancelSettlementButton
                          settlementId={row.id}
                          toName={row.toName}
                          amount={row.amount}
                          currency={household.currency}
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settlement history</CardTitle>
          <CardDescription>Confirmed repayments for this period.</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No confirmed settlements yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {confirmed.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {personLabel(row.fromName, row.fromUserId, user.id)} paid{" "}
                      {personLabel(row.toName, row.toUserId, user.id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.settledAt
                        ? format(parseISO(row.settledAt), "d MMM yyyy")
                        : format(parseISO(row.createdAt), "d MMM yyyy")}
                      {allTime
                        ? ` · ${format(new Date(row.year, row.month - 1, 1), "MMM yyyy")}`
                        : null}
                      {row.note ? ` · ${row.note}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(row.amount, household.currency)}
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
