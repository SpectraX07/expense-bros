import { createClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/money";
import {
  simplifyDebts,
  subtractPendingTransfers,
  type SettlementTransfer,
} from "@/lib/simplify-debts";
import type { Enums } from "@/lib/supabase/database.types";

export type MemberBalance = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  paid: number;
  fairShare: number;
  settledOut: number;
  settledIn: number;
  net: number;
};

export type SettlementRecord = {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  year: number;
  month: number;
  status: Enums<"settlement_status">;
  note: string | null;
  createdAt: string;
  settledAt: string | null;
};

export type SuggestedTransfer = SettlementTransfer & {
  fromName: string;
  toName: string;
  fromPaymentHandle: string | null;
  toPaymentHandle: string | null;
};

type BalanceRow = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  paid: number | string;
  fair_share: number | string;
  settled_out: number | string;
  settled_in: number | string;
  net: number | string;
};

type SettlementRow = {
  id: string;
  from_user: string;
  to_user: string;
  amount: number | string;
  year: number;
  month: number;
  status: Enums<"settlement_status">;
  note: string | null;
  created_at: string;
  settled_at: string | null;
};

export async function getSettlementSnapshot(
  householdId: string,
  period: { year: number; month: number } | null,
) {
  const supabase = await createClient();
  const { data: balanceData, error: balanceError } = await supabase.rpc(
    "settlement_balances",
    {
      p_household_id: householdId,
      p_year: period?.year ?? null,
      p_month: period?.month ?? null,
    },
  );

  if (balanceError) {
    throw balanceError;
  }

  const balances: MemberBalance[] = ((balanceData ?? []) as BalanceRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.full_name || "Roommate",
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    paid: toMoneyNumber(row.paid),
    fairShare: toMoneyNumber(row.fair_share),
    settledOut: toMoneyNumber(row.settled_out),
    settledIn: toMoneyNumber(row.settled_in),
    net: toMoneyNumber(row.net),
  }));

  const names = new Map(balances.map((row) => [row.userId, row.fullName]));
  const handles = new Map<string, string | null>();
  const userIds = balances.map((row) => row.userId);
  if (userIds.length > 0) {
    const { data: handleRows } = await supabase
      .from("profiles")
      .select("id, payment_handle")
      .in("id", userIds);
    for (const row of handleRows ?? []) {
      handles.set(row.id, row.payment_handle);
    }
  }

  let settlementQuery = supabase
    .from("settlements")
    .select(
      "id, from_user, to_user, amount, year, month, status, note, created_at, settled_at",
    )
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (period) {
    settlementQuery = settlementQuery.eq("year", period.year).eq("month", period.month);
  }

  const { data: settlementData, error: settlementError } = await settlementQuery;
  if (settlementError) {
    throw settlementError;
  }

  const settlements: SettlementRecord[] = ((settlementData ?? []) as SettlementRow[]).map(
    (row) => ({
      id: row.id,
      fromUserId: row.from_user,
      fromName: names.get(row.from_user) ?? "Roommate",
      toUserId: row.to_user,
      toName: names.get(row.to_user) ?? "Roommate",
      amount: toMoneyNumber(row.amount),
      year: row.year,
      month: row.month,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
      settledAt: row.settled_at,
    }),
  );

  const pending = settlements.filter((row) => row.status === "pending");
  const confirmed = settlements.filter((row) => row.status === "confirmed");
  const suggested = subtractPendingTransfers(
    simplifyDebts(balances.map((row) => ({ userId: row.userId, net: row.net }))),
    pending.map((row) => ({
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      amount: row.amount,
    })),
  ).map((row) => ({
    ...row,
    fromName: names.get(row.fromUserId) ?? "Roommate",
    toName: names.get(row.toUserId) ?? "Roommate",
    fromPaymentHandle: handles.get(row.fromUserId) ?? null,
    toPaymentHandle: handles.get(row.toUserId) ?? null,
  })) satisfies SuggestedTransfer[];

  return { balances, pending, confirmed, suggested };
}
