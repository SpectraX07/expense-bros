import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/money";

const moneyValue = z.union([z.number(), z.string()]);

const dashboardStatsSchema = z.object({
  totalSpent: moneyValue,
  expenseCount: moneyValue,
  overallBudget: moneyValue.nullable().optional(),
  byCategory: z
    .array(
      z.object({
        id: z.string().uuid().nullable().optional(),
        name: z.string(),
        color: z.string().nullable().optional(),
        amount: moneyValue,
      }),
    )
    .default([]),
  byPayer: z
    .array(
      z.object({
        userId: z.string().uuid(),
        fullName: z.string(),
        amount: moneyValue,
      }),
    )
    .default([]),
  trend: z
    .array(
      z.object({
        year: z.coerce.number(),
        month: z.coerce.number(),
        amount: moneyValue,
      }),
    )
    .default([]),
  recent: z
    .array(
      z.object({
        id: z.string().uuid(),
        itemName: z.string(),
        amount: moneyValue,
        expenseDate: z.string(),
        paidByName: z.string(),
      }),
    )
    .default([]),
});

export type DashboardStats = {
  totalSpent: number;
  expenseCount: number;
  overallBudget: number | null;
  byCategory: { id: string | null; name: string; color: string; amount: number }[];
  byPayer: { userId: string; fullName: string; amount: number }[];
  trend: { year: number; month: number; amount: number }[];
  recent: {
    id: string;
    itemName: string;
    amount: number;
    expenseDate: string;
    paidByName: string;
  }[];
};

export async function getDashboardStats(
  householdId: string,
  year: number,
  month: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_stats", {
    p_household_id: householdId,
    p_year: year,
    p_month: month,
    p_trend_months: 6,
  });

  if (error) {
    throw error;
  }

  const parsed = dashboardStatsSchema.parse(data ?? {});

  return {
    totalSpent: toMoneyNumber(parsed.totalSpent),
    expenseCount: Number(parsed.expenseCount),
    overallBudget:
      parsed.overallBudget === null || parsed.overallBudget === undefined
        ? null
        : toMoneyNumber(parsed.overallBudget),
    byCategory: parsed.byCategory.map((row) => ({
      id: row.id ?? null,
      name: row.name,
      color: row.color || "#64748b",
      amount: toMoneyNumber(row.amount),
    })),
    byPayer: parsed.byPayer.map((row) => ({
      userId: row.userId,
      fullName: row.fullName,
      amount: toMoneyNumber(row.amount),
    })),
    trend: parsed.trend.map((row) => ({
      year: row.year,
      month: row.month,
      amount: toMoneyNumber(row.amount),
    })),
    recent: parsed.recent.map((row) => ({
      id: row.id,
      itemName: row.itemName,
      amount: toMoneyNumber(row.amount),
      expenseDate: row.expenseDate,
      paidByName: row.paidByName,
    })),
  } satisfies DashboardStats;
}

