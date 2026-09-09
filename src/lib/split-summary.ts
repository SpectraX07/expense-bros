import { formatMoney } from "@/lib/money";

export function splitSummary(
  expense: {
    splits: { userId: string; shareAmount: number; isIncluded: boolean }[];
  },
  currentUserId: string,
  currency: string,
) {
  const included = expense.splits.filter((split) => split.isIncluded);
  const mine = included.find((split) => split.userId === currentUserId);
  const count = included.length;
  const share = mine
    ? `you ${formatMoney(mine.shareAmount, currency)}`
    : "you weren't included";
  if (count <= 1) {
    return share;
  }
  return `Split ${count} ways · ${share}`;
}
