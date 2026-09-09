import { createClient } from "@/lib/supabase/server";
import { toMoneyNumber } from "@/lib/money";
import type { Category, Enums } from "@/lib/supabase/database.types";

export type ExpenseCategory = Pick<Category, "id" | "name" | "icon" | "color" | "household_id" | "is_archived">;

export type ExpenseRecord = {
  id: string;
  itemName: string;
  amount: number;
  expenseDate: string;
  splitType: Enums<"split_type">;
  note: string | null;
  paidById: string;
  paidByName: string;
  category: ExpenseCategory | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  editedByName: string | null;
  splits: {
    userId: string;
    shareAmount: number;
    isIncluded: boolean;
  }[];
};

type ExpenseQueryRow = {
  id: string;
  item_name: string;
  amount: number | string;
  expense_date: string;
  split_type: Enums<"split_type">;
  note: string | null;
  paid_by: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  edited_by: string | null;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    household_id: string | null;
    is_archived: boolean;
  } | null;
  payer: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  editor: { full_name: string } | { full_name: string }[] | null;
  expense_splits?: {
    user_id: string;
    share_amount: number | string;
    is_included: boolean;
  }[];
};

function relationName(
  value: { full_name: string } | { full_name: string }[] | null | undefined,
) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0]?.full_name ?? null;
  }
  return value.full_name;
}

export async function listCategories(householdId: string, options?: { includeArchived?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id, name, icon, color, household_id, is_archived")
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order("name");

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ExpenseCategory[];
  const householdCats = rows.filter((row) => row.household_id === householdId);
  const householdNames = new Set(householdCats.map((row) => row.name.toLowerCase()));
  const globals = rows.filter(
    (row) =>
      row.household_id === null &&
      !householdNames.has(row.name.toLowerCase()) &&
      !row.is_archived,
  );

  return {
    all: rows,
    picker: [
      ...householdCats.filter((row) => !row.is_archived),
      ...globals,
    ],
    household: householdCats,
  };
}

export async function listExpenses(options: {
  householdId: string;
  year: number;
  month: number;
  categoryId?: string;
  paidBy?: string;
  query?: string;
}) {
  const supabase = await createClient();
  let request = supabase
    .from("expenses")
    .select(
      "id, item_name, amount, expense_date, split_type, note, paid_by, created_by, created_at, updated_at, edited_by, categories(id, name, icon, color, household_id, is_archived), payer:profiles!expenses_paid_by_fkey(id, full_name), editor:profiles!expenses_edited_by_fkey(full_name), expense_splits(user_id, share_amount, is_included)",
    )
    .eq("household_id", options.householdId)
    .eq("year", options.year)
    .eq("month", options.month)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.categoryId) {
    request = request.eq("category_id", options.categoryId);
  }
  if (options.paidBy) {
    request = request.eq("paid_by", options.paidBy);
  }
  if (options.query) {
    request = request.ilike("item_name", `%${options.query}%`);
  }

  const { data, error } = await request;
  if (error) {
    throw error;
  }

  return ((data ?? []) as ExpenseQueryRow[]).map((row) => ({
    id: row.id,
    itemName: row.item_name,
    amount: toMoneyNumber(row.amount),
    expenseDate: row.expense_date,
    splitType: row.split_type,
    note: row.note,
    paidById: row.paid_by,
    paidByName: relationName(row.payer) || "Roommate",
    category: row.categories,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedByName: row.edited_by ? relationName(row.editor) || "Someone" : null,
    splits: (row.expense_splits ?? []).map((split) => ({
      userId: split.user_id,
      shareAmount: toMoneyNumber(split.share_amount),
      isIncluded: split.is_included,
    })),
  })) satisfies ExpenseRecord[];
}

export async function getExpense(householdId: string, expenseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, item_name, amount, expense_date, split_type, note, paid_by, created_by, created_at, updated_at, edited_by, categories(id, name, icon, color, household_id, is_archived), payer:profiles!expenses_paid_by_fkey(id, full_name), editor:profiles!expenses_edited_by_fkey(full_name), expense_splits(user_id, share_amount, is_included)",
    )
    .eq("id", expenseId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const row = data as ExpenseQueryRow;

  return {
    id: row.id,
    itemName: row.item_name,
    amount: toMoneyNumber(row.amount),
    expenseDate: row.expense_date,
    splitType: row.split_type,
    note: row.note,
    paidById: row.paid_by,
    paidByName: relationName(row.payer) || "Roommate",
    category: row.categories,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedByName: row.edited_by ? relationName(row.editor) || "Someone" : null,
    splits: (row.expense_splits ?? []).map((split) => ({
      userId: split.user_id,
      shareAmount: toMoneyNumber(split.share_amount),
      isIncluded: split.is_included,
    })),
  } satisfies ExpenseRecord;
}
