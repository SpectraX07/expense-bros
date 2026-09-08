import { format } from "date-fns";
import { listExpenses } from "@/lib/expenses";
import { getSettlementSnapshot } from "@/lib/settlements";
import { monthExportCsv } from "@/lib/csv";

export async function buildMonthExportCsv(
  householdId: string,
  currency: string,
  year: number,
  month: number,
) {
  const [expenses, snapshot] = await Promise.all([
    listExpenses({ householdId, year, month }),
    getSettlementSnapshot(householdId, { year, month }),
  ]);

  return monthExportCsv(
    expenses.map((row) => ({
      date: row.expenseDate,
      item: row.itemName,
      amount: row.amount,
      currency,
      category: row.category?.name ?? "",
      paidBy: row.paidByName,
      splitType: row.splitType,
      note: row.note ?? "",
    })),
    [...snapshot.pending, ...snapshot.confirmed].map((row) => ({
      date: row.settledAt
        ? format(new Date(row.settledAt), "yyyy-MM-dd")
        : format(new Date(row.createdAt), "yyyy-MM-dd"),
      from: row.fromName,
      to: row.toName,
      amount: row.amount,
      currency,
      status: row.status,
      note: row.note ?? "",
    })),
  );
}
