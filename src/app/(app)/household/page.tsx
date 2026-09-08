import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CopyButton } from "@/components/copy-button";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { JoinHouseholdForm } from "@/components/household/join-household-form";
import { HouseholdSettingsForm } from "@/components/household/household-settings-form";
import { ProfileNameForm } from "@/components/household/profile-name-form";
import { RotateInviteButton } from "@/components/household/rotate-invite-button";
import { LeaveHouseholdButton } from "@/components/household/leave-household-button";
import { MemberRowActions } from "@/components/household/member-row-actions";
import { requireAuthUser } from "@/lib/auth";
import {
  formatInviteCode,
  getCurrentHouseholdId,
  getHouseholdMembers,
  getHouseholdMemberships,
} from "@/lib/households";
import { getSiteOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

function MemberRow({
  member,
  isYou,
  isAdmin,
  householdId,
}: {
  member: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    role: "admin" | "member";
    joinedAt: string;
    isActive: boolean;
  };
  isYou: boolean;
  isAdmin: boolean;
  householdId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="sm">
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt={member.fullName} />
          ) : null}
          <AvatarFallback>
            {member.fullName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.fullName}
            {isYou ? " (you)" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.isActive
              ? `Joined ${format(parseISO(member.joinedAt), "d MMM yyyy")}`
              : "Archived — history kept"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Badge variant={member.role === "admin" && member.isActive ? "default" : "secondary"}>
          {member.isActive ? member.role : "archived"}
        </Badge>
        {isAdmin && !isYou ? (
          <MemberRowActions
            householdId={householdId}
            userId={member.userId}
            fullName={member.fullName}
            role={member.role}
            isActive={member.isActive}
          />
        ) : null}
      </div>
    </div>
  );
}

export default async function HouseholdPage() {
  const user = await requireAuthUser();
  const memberships = await getHouseholdMemberships(user.id);
  const currentId = await getCurrentHouseholdId(memberships);
  const current =
    memberships.find((item) => item.householdId === currentId) ?? memberships[0];
  const members = await getHouseholdMembers(current.householdId, {
    includeInactive: true,
  });
  const origin = await getSiteOrigin();
  const inviteLink = `${origin}/join?code=${current.inviteCode}`;
  const isAdmin = current.role === "admin";
  const activeMembers = members.filter((member) => member.isActive);
  const archivedMembers = members.filter((member) => !member.isActive);
  const activeAdminCount = activeMembers.filter((member) => member.role === "admin").length;
  const canLeave = !(current.role === "admin" && activeAdminCount === 1);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Household</h1>
        <p className="text-muted-foreground">
          Invite roommates, manage members, and edit household settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/household/budgets"
          className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">Budgets</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Overall and per-category caps for a month.
          </p>
        </Link>
        <Link
          href="/household/recurring"
          className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">Recurring</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rent and bills that repeat each month or week.
          </p>
        </Link>
        <Link
          href="/household/categories"
          className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">Categories</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Names and colors used when logging expenses.
          </p>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{current.name}</CardTitle>
          <CardDescription>
            Currency {current.currency}. You are {current.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Invite code</p>
              <p className="font-mono text-lg tracking-wider">
                {formatInviteCode(current.inviteCode)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={current.inviteCode} />
              {isAdmin ? <RotateInviteButton householdId={current.householdId} /> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Invite link</p>
              <p className="truncate text-sm">{inviteLink}</p>
            </div>
            <CopyButton value={inviteLink} label="Copy link" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Archive a roommate to hide them from new splits without deleting history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMembers.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              isYou={member.userId === user.id}
              isAdmin={isAdmin}
              householdId={current.householdId}
            />
          ))}
          {archivedMembers.length > 0 ? (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Archived</p>
              {archivedMembers.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isYou={member.userId === user.id}
                  isAdmin={isAdmin}
                  householdId={current.householdId}
                />
              ))}
            </div>
          ) : null}
          <div className="border-t border-border pt-4">
            <LeaveHouseholdButton
              householdId={current.householdId}
              householdName={current.name}
              canLeave={canLeave}
            />
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Household settings</CardTitle>
            <CardDescription>Rename this household or change its currency.</CardDescription>
          </CardHeader>
          <CardContent>
            <HouseholdSettingsForm
              householdId={current.householdId}
              name={current.name}
              currency={current.currency}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>This name is shown to roommates on expenses and settlement.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileNameForm fullName={profile?.full_name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add another household</CardTitle>
          <CardDescription>
            Create a new one or join with a different invite code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>
            <TabsContent value="join" className="pt-4">
              <JoinHouseholdForm submitLabel="Join household" />
            </TabsContent>
            <TabsContent value="create" className="pt-4">
              <CreateHouseholdForm submitLabel="Create household" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
