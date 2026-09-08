"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import { splitsAreValid } from "@/lib/splits";
import {
  recurringIdSchema,
  saveRecurringSchema,
  upsertBudgetSchema,
} from "@/lib/validations/recurring";
import type { Json } from "@/lib/supabase/database.types";

const toggleRecurringSchema = z.object({
  id: z.uuid(),
  active: z.boolean(),
});

function revalidateRecurringPaths() {
  revalidatePath("/household/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/settlement");
}

function revalidateBudgetPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/household/budgets");
}

export async function saveRecurringAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = saveRecurringSchema.safeParse(input);
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
  const { error } = await supabase.rpc("save_recurring_expense", {
    p_household_id: parsed.data.householdId,
    p_paid_by: parsed.data.paidBy,
    p_item_name: parsed.data.itemName,
    p_amount: parsed.data.amount,
    p_split_type: parsed.data.splitType,
    p_splits: parsed.data.splits.map((split) => ({
      user_id: split.userId,
      share_amount: split.shareAmount,
      is_included: split.isIncluded,
    })) as Json,
    p_frequency: parsed.data.frequency,
    p_next_run_date: parsed.data.nextRunDate,
    p_category_id: parsed.data.categoryId,
    p_note: parsed.data.note ?? null,
    p_id: parsed.data.id ?? null,
    p_active: parsed.data.active ?? true,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateRecurringPaths();
  redirect("/household/recurring");
}

export async function applyRecurringAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = recurringIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_recurring_expense", { p_id: parsed.data.id });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateRecurringPaths();
  return { ok: true, message: "Added this period's expense." };
}

export async function skipRecurringAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = recurringIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("skip_recurring_expense", { p_id: parsed.data.id });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateRecurringPaths();
  return { ok: true, message: "Skipped this run." };
}

export async function setRecurringActiveAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = toggleRecurringSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateRecurringPaths();
  return {
    ok: true,
    message: parsed.data.active ? "Recurring expense resumed." : "Recurring expense paused.",
  };
}

export async function deleteRecurringAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = recurringIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateRecurringPaths();
  redirect("/household/recurring");
}

export async function upsertBudgetAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = upsertBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_budget", {
    p_household_id: parsed.data.householdId,
    p_year: parsed.data.year,
    p_month: parsed.data.month,
    p_amount: parsed.data.amount,
    p_category_id: parsed.data.categoryId,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateBudgetPaths();
  return {
    ok: true,
    message: parsed.data.amount === null ? "Budget cleared." : "Budget saved.",
  };
}
