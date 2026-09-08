import { centsToMoney, moneyToCents } from "@/lib/money";

export type NetBalance = {
  userId: string;
  net: number;
};

export type SettlementTransfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

type LedgerEntry = {
  userId: string;
  cents: number;
};

function byMaxDebtor(a: LedgerEntry, b: LedgerEntry) {
  if (a.cents !== b.cents) {
    return a.cents - b.cents;
  }
  return a.userId.localeCompare(b.userId);
}

function byMaxCreditor(a: LedgerEntry, b: LedgerEntry) {
  if (a.cents !== b.cents) {
    return b.cents - a.cents;
  }
  return a.userId.localeCompare(b.userId);
}

/**
 * Greedy min-cash-flow: each round pair the largest debtor with the largest
 * creditor. Ties break on userId so results are stable.
 */
export function simplifyDebts(balances: NetBalance[]): SettlementTransfer[] {
  const debtors: LedgerEntry[] = [];
  const creditors: LedgerEntry[] = [];

  for (const row of balances) {
    const cents = moneyToCents(row.net);
    if (cents < 0) {
      debtors.push({ userId: row.userId, cents });
    } else if (cents > 0) {
      creditors.push({ userId: row.userId, cents });
    }
  }

  const transfers: SettlementTransfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byMaxDebtor);
    creditors.sort(byMaxCreditor);

    const debtor = debtors[0];
    const creditor = creditors[0];
    const pay = Math.min(-debtor.cents, creditor.cents);

    if (pay <= 0) {
      break;
    }

    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount: centsToMoney(pay),
    });

    debtor.cents += pay;
    creditor.cents -= pay;

    if (debtor.cents === 0) {
      debtors.shift();
    }
    if (creditor.cents === 0) {
      creditors.shift();
    }
  }

  return transfers;
}

export function subtractPendingTransfers(
  suggested: SettlementTransfer[],
  pending: SettlementTransfer[],
): SettlementTransfer[] {
  const leftover = new Map<string, number>();

  for (const row of pending) {
    const key = `${row.fromUserId}:${row.toUserId}`;
    leftover.set(key, (leftover.get(key) ?? 0) + moneyToCents(row.amount));
  }

  const remaining: SettlementTransfer[] = [];

  for (const row of suggested) {
    const key = `${row.fromUserId}:${row.toUserId}`;
    const blocked = leftover.get(key) ?? 0;
    const next = moneyToCents(row.amount) - blocked;

    if (next > 0) {
      remaining.push({
        fromUserId: row.fromUserId,
        toUserId: row.toUserId,
        amount: centsToMoney(next),
      });
      leftover.set(key, 0);
    } else {
      leftover.set(key, -next);
    }
  }

  return remaining;
}
