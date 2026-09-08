import { cookies } from "next/headers";
import { HOUSEHOLD_COOKIE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export type HouseholdMembership = {
  householdId: string;
  name: string;
  currency: string;
  inviteCode: string;
  role: Enums<"member_role">;
};

export type HouseholdMember = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: Enums<"member_role">;
  joinedAt: string;
};

type MembershipQueryRow = {
  role: Enums<"member_role">;
  households:
    | {
        id: string;
        name: string;
        currency: string;
        invite_code: string;
      }
    | null;
};

type MemberQueryRow = {
  user_id: string;
  role: Enums<"member_role">;
  joined_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

export async function getHouseholdMemberships(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("role, households(id, name, currency, invite_code)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as MembershipQueryRow[]).flatMap((row) => {
    if (!row.households) {
      return [];
    }

    return [
      {
        householdId: row.households.id,
        name: row.households.name,
        currency: row.households.currency,
        inviteCode: row.households.invite_code,
        role: row.role,
      } satisfies HouseholdMembership,
    ];
  });
}

export async function getHouseholdMembers(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("user_id, role, joined_at, profiles(full_name, avatar_url)")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as MemberQueryRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.profiles?.full_name || "Roommate",
    avatarUrl: row.profiles?.avatar_url ?? null,
    role: row.role,
    joinedAt: row.joined_at,
  })) satisfies HouseholdMember[];
}

export async function getCurrentHouseholdId(memberships: HouseholdMembership[]) {
  if (memberships.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const saved = cookieStore.get(HOUSEHOLD_COOKIE)?.value;
  if (saved && memberships.some((item) => item.householdId === saved)) {
    return saved;
  }

  return memberships[0].householdId;
}

export async function setCurrentHouseholdCookie(householdId: string) {
  const cookieStore = await cookies();
  cookieStore.set(HOUSEHOLD_COOKIE, householdId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function formatInviteCode(code: string) {
  const compact = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return compact;
}
