"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import {
  getHouseholdMemberships,
  setCurrentHouseholdCookie,
} from "@/lib/households";
import { HOUSEHOLD_COOKIE, INVITE_COOKIE } from "@/lib/constants";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import {
  createHouseholdSchema,
  householdIdSchema,
  joinHouseholdSchema,
  setMemberActiveSchema,
  setMemberRoleSchema,
  switchHouseholdSchema,
  updateHouseholdSettingsSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";

function revalidateHouseholdSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/household");
  revalidatePath("/dashboard");
  revalidatePath("/settlement");
  revalidatePath("/history");
  revalidatePath("/expenses/new");
}

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

export async function updateHouseholdSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = updateHouseholdSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_household", {
    p_household_id: parsed.data.householdId,
    p_name: parsed.data.name,
    p_currency: parsed.data.currency,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateHouseholdSurfaces();
  return { ok: true, message: "Household updated." };
}

export async function rotateInviteCodeAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = householdIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rotate_invite_code", {
    p_household_id: parsed.data.householdId,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateHouseholdSurfaces();
  return { ok: true, message: "Invite code rotated. Old links no longer work." };
}

export async function setMemberActiveAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = setMemberActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_active", {
    p_household_id: parsed.data.householdId,
    p_user_id: parsed.data.userId,
    p_is_active: parsed.data.isActive,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateHouseholdSurfaces();
  return {
    ok: true,
    message: parsed.data.isActive ? "Roommate restored." : "Roommate archived.",
  };
}

export async function setMemberRoleAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAuthUser();
  const parsed = setMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", {
    p_household_id: parsed.data.householdId,
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateHouseholdSurfaces();
  return {
    ok: true,
    message: parsed.data.role === "admin" ? "Admin role granted." : "Admin role removed.",
  };
}

export async function leaveHouseholdAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = householdIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_household", {
    p_household_id: parsed.data.householdId,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  const memberships = await getHouseholdMemberships(user.id);
  const cookieStore = await cookies();

  if (memberships.length === 0) {
    cookieStore.delete(HOUSEHOLD_COOKIE);
    redirect("/onboarding");
  }

  const nextHousehold =
    memberships.find((item) => item.householdId !== parsed.data.householdId) ??
    memberships[0];
  await setCurrentHouseholdCookie(nextHousehold.householdId);
  revalidateHouseholdSurfaces();
  redirect("/dashboard");
}

export async function updateDisplayNameAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateHouseholdSurfaces();
  return { ok: true, message: "Display name updated." };
}
