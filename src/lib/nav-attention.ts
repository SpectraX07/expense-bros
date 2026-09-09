import { format } from "date-fns";
import { currentPeriod } from "@/lib/app-context";
import { listDueRecurringExpenses } from "@/lib/recurring";
import { getSettlementSnapshot } from "@/lib/settlements";

export async function getNavAttention(householdId: string, userId: string) {
  const period = currentPeriod();
  const [dueRecurring, snapshot] = await Promise.all([
    listDueRecurringExpenses(householdId, format(new Date(), "yyyy-MM-dd")),
    getSettlementSnapshot(householdId, period),
  ]);

  const pendingToConfirm = snapshot.pending.filter((row) => row.toUserId === userId);
  const youShouldPay = snapshot.suggested.filter((row) => row.fromUserId === userId);

  return {
    dueRecurringCount: dueRecurring.length,
    settlementCount: pendingToConfirm.length + youShouldPay.length,
    pendingToConfirm,
  };
}
