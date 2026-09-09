import { formatMoney } from "@/lib/money";
import {
  CancelSettlementButton,
  ConfirmSettlementButton,
} from "@/components/settlement/settlement-review-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SettlementRecord } from "@/lib/settlements";

export function PendingConfirmCard({
  items,
  currency,
  currentUserId,
  isAdmin,
}: {
  items: SettlementRecord[];
  currency: string;
  currentUserId: string;
  isAdmin: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm a payment</CardTitle>
        <CardDescription>Someone marked money as paid. Check it landed, then confirm.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {row.fromName} marked {formatMoney(row.amount, currency)} as paid
                </p>
                {row.note ? (
                  <p className="text-sm text-muted-foreground">{row.note}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin || row.toUserId === currentUserId ? (
                  <ConfirmSettlementButton
                    settlementId={row.id}
                    fromName={row.fromName}
                    amount={row.amount}
                    currency={currency}
                  />
                ) : null}
                {isAdmin || row.fromUserId === currentUserId ? (
                  <CancelSettlementButton
                    settlementId={row.id}
                    toName={row.toName}
                    amount={row.amount}
                    currency={currency}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
