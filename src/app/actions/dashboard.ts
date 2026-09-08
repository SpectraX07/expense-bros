"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import { setOverallBudgetSchema } from "@/lib/validations/dashboard";

export async function setOverallBudgetAction(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = setOverallBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_overall_budget", {
    p_household_id: parsed.data.householdId,
    p_year: parsed.data.year,
    p_month: parsed.data.month,
    p_amount: parsed.data.amount,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Budget saved." };
}
