import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth";
import {
  getCurrentHouseholdId,
  getHouseholdMembers,
  getHouseholdMemberships,
} from "@/lib/households";

export async function getAppContext() {
  const user = await requireAuthUser();
  const memberships = await getHouseholdMemberships(user.id);

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const currentId = await getCurrentHouseholdId(memberships);
  const household =
    memberships.find((item) => item.householdId === currentId) ?? memberships[0];
  const members = await getHouseholdMembers(household.householdId);

  return {
    user,
    household,
    members,
    isAdmin: household.role === "admin",
  };
}

export function currentPeriod(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function parsePeriod(year?: string, month?: string) {
  const fallback = currentPeriod();
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  return {
    year:
      Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
        ? parsedYear
        : fallback.year,
    month:
      Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
        ? parsedMonth
        : fallback.month,
  };
}

export function shiftPeriod(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}
