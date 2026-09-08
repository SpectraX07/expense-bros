"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import { setCurrentHouseholdCookie } from "@/lib/households";
import { INVITE_COOKIE } from "@/lib/constants";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import {
  createHouseholdSchema,
  joinHouseholdSchema,
  switchHouseholdSchema,
} from "@/lib/validations/auth";

export async function createHousehold(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_household", {
    p_name: parsed.data.name,
    p_currency: parsed.data.currency,
  });

  if (error || !data) {
    return {
      ok: false,
      error: publicErrorMessage(error?.message ?? "Could not create household."),
    };
  }

  const household = Array.isArray(data) ? data[0] : data;
  if (!household?.id) {
    return { ok: false, error: "Could not create household." };
  }

  await setCurrentHouseholdCookie(household.id);
  redirect("/dashboard");
}

export async function joinHousehold(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = joinHouseholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_household", {
    p_invite_code: parsed.data.inviteCode,
  });

  if (error || !data) {
    return {
      ok: false,
      error: publicErrorMessage(error?.message ?? "Could not join household."),
    };
  }

  await setCurrentHouseholdCookie(data);
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE);
  redirect("/dashboard");
}

export async function switchHousehold(input: unknown): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = switchHouseholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  await setCurrentHouseholdCookie(parsed.data.householdId);
  redirect("/dashboard");
}
