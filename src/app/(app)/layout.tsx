import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth";
import {
  getCurrentHouseholdId,
  getHouseholdMemberships,
} from "@/lib/households";
import { AppShell } from "@/components/app/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  const memberships = await getHouseholdMemberships(user.id);

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const currentId = await getCurrentHouseholdId(memberships);
  const currentHousehold =
    memberships.find((item) => item.householdId === currentId) ?? memberships[0];

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      user={user}
      displayName={profile?.full_name || user.email?.split("@")[0] || "You"}
      memberships={memberships}
      currentHousehold={currentHousehold}
    >
      {children}
    </AppShell>
  );
}
