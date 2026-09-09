import Link from "next/link";
import { formatMoney, moneyToCents } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SettlementRecord, SuggestedTransfer } from "@/lib/settlements";

export function YouCard({
  net,
  currency,
  currentUserId,
  suggested,
  pendingToConfirm,
  year,
  month,
}: {
  net: number;
  currency: string;
  currentUserId: string;
  suggested: SuggestedTransfer[];
  pendingToConfirm: SettlementRecord[];
  year: number;
  month: number;
}) {
  const netCents = moneyToCents(net);
  const payees = suggested.filter((row) => row.fromUserId === currentUserId).slice(0, 2);
  const owedBy = suggested.filter((row) => row.toUserId === currentUserId).slice(0, 2);
  const settleHref = `/settlement?year=${year}&month=${month}`;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card">
      <CardHeader>
        <CardDescription>You this month</CardDescription>
        <CardTitle
          className={cn(
            "font-heading text-3xl tabular-nums",
            netCents < 0 && "text-destructive",
            netCents > 0 && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {netCents === 0
            ? "You're square"
            : netCents < 0
              ? `You owe ${formatMoney(Math.abs(net), currency)}`
              : `You're owed ${formatMoney(net, currency)}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payees.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {payees.map((row) => (
              <li key={`${row.toUserId}-${row.amount}`}>
                Pay {row.toName} {formatMoney(row.amount, currency)}
              </li>
            ))}
          </ul>
        ) : null}
        {owedBy.length > 0 && payees.length === 0 ? (
          <ul className="space-y-1 text-sm">
            {owedBy.map((row) => (
              <li key={`${row.fromUserId}-${row.amount}`}>
                {row.fromName} owes you {formatMoney(row.amount, currency)}
              </li>
            ))}
          </ul>
        ) : null}
        {pendingToConfirm.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {pendingToConfirm.length === 1
              ? `${pendingToConfirm[0].fromName} marked ${formatMoney(pendingToConfirm[0].amount, currency)} paid — confirm it.`
              : `${pendingToConfirm.length} payments waiting on your confirmation.`}
          </p>
        ) : null}
        {netCents === 0 && payees.length === 0 && pendingToConfirm.length === 0 ? (
          <p className="text-sm text-muted-foreground">No remaining transfers for this month.</p>
        ) : null}
        <Link href={settleHref} className={cn(buttonVariants({ size: "sm" }))}>
          Open settlement
        </Link>
      </CardContent>
    </Card>
  );
}
