"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import {
  createSettlementSchema,
  settlementIdSchema,
} from "@/lib/validations/settlements";

function revalidateSettlementPaths() {
  revalidatePath("/settlement");
  revalidatePath("/dashboard");
}

async function getMembership(householdId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSettlementAction(input: unknown): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = createSettlementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  if (parsed.data.fromUserId === parsed.data.toUserId) {
    return { ok: false, error: "A settlement has to be between two different people." };
  }

  const membership = await getMembership(parsed.data.householdId, user.id);
  if (!membership) {
    return { ok: false, error: "You are not in this household." };
  }

  const isAdmin = membership.role === "admin";
  if (!isAdmin && parsed.data.fromUserId !== user.id) {
    return { ok: false, error: "Only the person who owes can mark this as paid." };
  }

  const supabase = await createClient();
  const { data: members, error: memberError } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", parsed.data.householdId)
    .in("user_id", [parsed.data.fromUserId, parsed.data.toUserId]);

  if (memberError) {
    return { ok: false, error: publicErrorMessage(memberError.message) };
  }
  if ((members ?? []).length < 2) {
    return { ok: false, error: "Both people must belong to this household." };
  }

  const { error } = await supabase.from("settlements").insert({
    household_id: parsed.data.householdId,
    from_user: parsed.data.fromUserId,
    to_user: parsed.data.toUserId,
    amount: parsed.data.amount,
    year: parsed.data.year,
    month: parsed.data.month,
    status: "pending",
    note: parsed.data.note?.trim() ? parsed.data.note.trim() : null,
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateSettlementPaths();
  return { ok: true, message: "Marked as paid. Waiting for confirmation." };
}

export async function confirmSettlementAction(input: unknown): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = settlementIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data: row, error: loadError } = await supabase
    .from("settlements")
    .select("id, household_id, from_user, to_user, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !row) {
    return { ok: false, error: "That settlement could not be found." };
  }
  if (row.status !== "pending") {
    return { ok: false, error: "This settlement is already confirmed." };
  }

  const membership = await getMembership(row.household_id, user.id);
  if (!membership) {
    return { ok: false, error: "You are not in this household." };
  }

  const isAdmin = membership.role === "admin";
  if (!isAdmin && row.to_user !== user.id) {
    return { ok: false, error: "Only the person who is owed can confirm this." };
  }

  const { error } = await supabase
    .from("settlements")
    .update({
      status: "confirmed",
      settled_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateSettlementPaths();
  return { ok: true, message: "Settlement confirmed." };
}

export async function cancelSettlementAction(input: unknown): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = settlementIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data: row, error: loadError } = await supabase
    .from("settlements")
    .select("id, household_id, from_user, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !row) {
    return { ok: false, error: "That settlement could not be found." };
  }
  if (row.status !== "pending") {
    return { ok: false, error: "Confirmed settlements cannot be cancelled." };
  }

  const membership = await getMembership(row.household_id, user.id);
  if (!membership) {
    return { ok: false, error: "You are not in this household." };
  }

  const isAdmin = membership.role === "admin";
  if (!isAdmin && row.from_user !== user.id) {
    return { ok: false, error: "Only the person who marked this paid can cancel it." };
  }

  const { error } = await supabase.from("settlements").delete().eq("id", row.id).eq("status", "pending");

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  revalidateSettlementPaths();
  return { ok: true, message: "Pending settlement cancelled." };
}
