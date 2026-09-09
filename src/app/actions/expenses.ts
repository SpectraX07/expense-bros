"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import { splitsAreValid } from "@/lib/splits";
import { safeInternalPath } from "@/lib/http";
import {
  createCategorySchema,
  deleteExpenseSchema,
  saveExpenseSchema,
  updateCategorySchema,
  archiveCategorySchema,
} from "@/lib/validations/expenses";
import type { ExpenseCategory } from "@/lib/expenses";
import type { Json } from "@/lib/supabase/database.types";

function revalidateExpensePaths() {
  revalidatePath("/history");
  revalidatePath("/expenses/new");
  revalidatePath("/dashboard");
  revalidatePath("/household/categories");
  revalidatePath("/household/recurring");
  revalidatePath("/household/budgets");
  revalidatePath("/settlement");
  revalidatePath("/", "layout");
}

export async function saveExpenseAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = saveExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const splits = parsed.data.splits.map((split) => ({
    userId: split.userId,
    included: split.isIncluded,
    shareAmount: split.shareAmount,
  }));

  if (!splitsAreValid(parsed.data.amount, splits)) {
    return { ok: false, error: "Splits must add up to the total amount." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_expense", {
    p_household_id: parsed.data.householdId,
    p_paid_by: parsed.data.paidBy,
    p_item_name: parsed.data.itemName,
    p_amount: parsed.data.amount,
    p_expense_date: parsed.data.expenseDate,
    p_split_type: parsed.data.splitType,
    p_splits: parsed.data.splits.map((split) => ({
      user_id: split.userId,
      share_amount: split.shareAmount,
      is_included: split.isIncluded,
    })) as Json,
    p_category_id: parsed.data.categoryId,
    p_note: parsed.data.note ?? null,
    p_id: parsed.data.id ?? null,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateExpensePaths();
  if (parsed.data.id) {
    revalidatePath(`/expenses/${parsed.data.id}/edit`);
  }
  redirect(safeInternalPath(parsed.data.next, "/history"));
}

export async function deleteExpenseAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = deleteExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateExpensePaths();
  redirect("/history");
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult & { category?: ExpenseCategory }> {
  await requireAuthUser();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_id: parsed.data.householdId,
      name: parsed.data.name,
      icon: parsed.data.icon ?? "ellipsis",
      color: parsed.data.color ?? "#64748b",
    })
    .select("id, name, icon, color, household_id, is_archived")
    .single();

  if (error || !data) {
    return { ok: false, error: publicErrorMessage(error?.message ?? "Could not create category.") };
  }

  revalidatePath("/household/categories");
  revalidatePath("/expenses/new");
  return { ok: true, category: data };
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
    })
    .eq("id", parsed.data.id)
    .eq("household_id", parsed.data.householdId);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidatePath("/household/categories");
  return { ok: true };
}

export async function archiveCategoryAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = archiveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: parsed.data.archived })
    .eq("id", parsed.data.id)
    .eq("household_id", parsed.data.householdId);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidatePath("/household/categories");
  return { ok: true };
}
