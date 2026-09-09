import { getAppContext } from "@/lib/app-context";
import { getSiteOrigin } from "@/lib/http";
import { PageHeader } from "@/components/app/page-header";
import { HouseholdSetup } from "@/components/household/household-setup";

export default async function HouseholdSetupPage() {
  const { household } = await getAppContext();
  const origin = await getSiteOrigin();
  const inviteLink = `${origin}/join?code=${household.inviteCode}`;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Get the flat set up"
        description="Invite roommates, then optionally save rent so you are not retyping it every month."
      />
      <HouseholdSetup
        householdId={household.householdId}
        householdName={household.name}
        inviteCode={household.inviteCode}
        inviteLink={inviteLink}
        currency={household.currency}
      />
    </div>
  );
}
