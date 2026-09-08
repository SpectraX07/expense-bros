import { createClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/money";
import type { Enums } from "@/lib/supabase/database.types";
import type { ExpenseCategory } from "@/lib/expenses";

export type RecurringRecord = {
  id: string;
  itemName: string;
  amount: number;
  paidById: string;
  paidByName: string;
  category: ExpenseCategory | null;
  splitType: Enums<"split_type">;
  note: string | null;
  frequency: Enums<"recurrence_frequency">;
  nextRunDate: string;
  active: boolean;
  createdBy: string;
  splits: {
    userId: string;
    shareAmount: number;
    isIncluded: boolean;
  }[];
};

type RecurringQueryRow = {
  id: string;
  item_name: string;
  amount: number | string;
  paid_by: string;
  split_type: Enums<"split_type">;
  note: string | null;
  frequency: Enums<"recurrence_frequency">;
  next_run_date: string;
  active: boolean;
  created_by: string;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    household_id: string | null;
    is_archived: boolean;
  } | null;
  payer: { id: string; full_name: string } | null;
  recurring_expense_splits?: {
    user_id: string;
    share_amount: number | string;
    is_included: boolean;
  }[];
};

function mapRecurring(row: RecurringQueryRow): RecurringRecord {
  return {
    id: row.id,
    itemName: row.item_name,
    amount: toMoneyNumber(row.amount),
    paidById: row.paid_by,
    paidByName: row.payer?.full_name || "Roommate",
    category: row.categories,
    splitType: row.split_type,
    note: row.note,
    frequency: row.frequency,
    nextRunDate: row.next_run_date,
    active: row.active,
    createdBy: row.created_by,
    splits: (row.recurring_expense_splits ?? []).map((split) => ({
      userId: split.user_id,
      shareAmount: toMoneyNumber(split.share_amount),
      isIncluded: split.is_included,
    })),
  };
}

const RECURRING_SELECT =
  "id, item_name, amount, paid_by, split_type, note, frequency, next_run_date, active, created_by, categories(id, name, icon, color, household_id, is_archived), payer:profiles!recurring_expenses_paid_by_fkey(id, full_name), recurring_expense_splits(user_id, share_amount, is_included)";

export async function listRecurringExpenses(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(RECURRING_SELECT)
    .eq("household_id", householdId)
    .order("next_run_date", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RecurringQueryRow[]).map(mapRecurring);
}

export async function listDueRecurringExpenses(householdId: string, onOrBefore: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(RECURRING_SELECT)
    .eq("household_id", householdId)
    .eq("active", true)
    .lte("next_run_date", onOrBefore)
    .order("next_run_date", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RecurringQueryRow[]).map(mapRecurring);
}

export async function getRecurringExpense(householdId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(RECURRING_SELECT)
    .eq("household_id", householdId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return mapRecurring(data as RecurringQueryRow);
}
