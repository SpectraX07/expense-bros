"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyRecurringAction,
  skipRecurringAction,
} from "@/app/actions/recurring";
import { formatMoney } from "@/lib/money";
import type { RecurringRecord } from "@/lib/recurring";

export function RecurringDueActions({
  items,
  currency,
}: {
  items: RecurringRecord[];
  currency: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function run(
    id: string,
    action: typeof applyRecurringAction | typeof skipRecurringAction,
  ) {
    setPendingId(id);
    try {
      const result = await action({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Done.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium">{item.itemName}</p>
            <p className="text-sm text-muted-foreground">
              {formatMoney(item.amount, currency)} · {item.frequency} · due {item.nextRunDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={pendingId === item.id}
              onClick={() => void run(item.id, applyRecurringAction)}
            >
              {pendingId === item.id ? <Loader2Icon className="animate-spin" /> : null}
              Add this run
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pendingId === item.id}
              onClick={() => void run(item.id, skipRecurringAction)}
            >
              Skip
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
