import { centsToMoney, moneyToCents, roundMoney } from "@/lib/money";

export type SplitType = "equal" | "percentage" | "custom_amount" | "shares";

export type SplitInput = {
  userId: string;
  included: boolean;
  percent: number;
  shares: number;
  customAmount: number;
};

export type SplitResult = {
  userId: string;
  included: boolean;
  shareAmount: number;
};

export function allocateByWeights(
  total: number,
  weights: { id: string; weight: number }[],
) {
  const totalCents = moneyToCents(total);
  const eligible = weights.filter((item) => item.weight > 0);
  const weightSum = eligible.reduce((sum, item) => sum + item.weight, 0);
  const result: Record<string, number> = {};

  if (totalCents <= 0 || eligible.length === 0 || weightSum <= 0) {
    return result;
  }

  const rows = eligible.map((item) => {
    const exact = (totalCents * item.weight) / weightSum;
    const floored = Math.floor(exact);
    return { id: item.id, floored, remainder: exact - floored };
  });

  let leftover = totalCents - rows.reduce((sum, row) => sum + row.floored, 0);
  const ranked = [...rows].sort((a, b) => b.remainder - a.remainder);

  for (const row of ranked) {
    const extra = leftover > 0 ? 1 : 0;
    leftover -= extra;
    result[row.id] = centsToMoney(row.floored + extra);
  }

  return result;
}

export function computeSplits(total: number, splitType: SplitType, rows: SplitInput[]) {
  const included = rows.filter((row) => row.included);
  const amounts: Record<string, number> = {};

  if (splitType === "equal") {
    Object.assign(
      amounts,
      allocateByWeights(
        total,
        included.map((row) => ({ id: row.userId, weight: 1 })),
      ),
    );
  } else if (splitType === "percentage") {
    Object.assign(
      amounts,
      allocateByWeights(
        total,
        included.map((row) => ({ id: row.userId, weight: row.percent })),
      ),
    );
  } else if (splitType === "shares") {
    Object.assign(
      amounts,
      allocateByWeights(
        total,
        included.map((row) => ({ id: row.userId, weight: row.shares })),
      ),
    );
  } else {
    for (const row of included) {
      amounts[row.userId] = roundMoney(row.customAmount);
    }
  }

  return rows.map((row) => ({
    userId: row.userId,
    included: row.included,
    shareAmount: row.included ? (amounts[row.userId] ?? 0) : 0,
  })) satisfies SplitResult[];
}

export function splitRemainder(total: number, splits: SplitResult[]) {
  const includedSum = splits
    .filter((row) => row.included)
    .reduce((sum, row) => sum + moneyToCents(row.shareAmount), 0);
  return centsToMoney(moneyToCents(total) - includedSum);
}

export function splitsAreValid(total: number, splits: SplitResult[]) {
  const included = splits.filter((row) => row.included);
  if (included.length === 0 || moneyToCents(total) <= 0) {
    return false;
  }
  return moneyToCents(splitRemainder(total, splits)) === 0;
}
