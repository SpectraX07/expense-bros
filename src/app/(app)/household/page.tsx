import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  RepeatIcon,
  ShieldAlertIcon,
  TagsIcon,
  WalletIcon,
} from "lucide-react";
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
import { PageHeader } from "@/components/app/page-header";
import { requireAuthUser } from "@/lib/auth";
import {
  formatInviteCode,
  getCurrentHouseholdId,
  getHouseholdMembers,
  getHouseholdMemberships,
  type HouseholdMember,
} from "@/lib/households";
import { getSiteOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { getSettlementSnapshot } from "@/lib/settlements";
import { listRecurringExpenses } from "@/lib/recurring";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  {
    href: "/household/budgets",
    title: "Budgets",
    description: "Monthly caps by category",
    icon: WalletIcon,
    tint: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  {
    href: "/household/recurring",
    title: "Recurring",
    description: "Rent and repeating bills",
    icon: RepeatIcon,
    tint: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  {
    href: "/household/categories",
    title: "Categories",
    description: "Names and colors for logs",
    icon: TagsIcon,
    tint: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
] as const;

function MemberRow({
  member,
  isYou,
  isAdmin,
  householdId,
  outstandingNet,
}: {
  member: HouseholdMember;
  isYou: boolean;
  isAdmin: boolean;
  householdId: string;
  outstandingNet: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
        member.isActive ? "bg-muted/50" : "bg-muted/25 opacity-80",
      )}
    >
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
            outstandingNet={outstandingNet}
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
  const [snapshot, templates] = await Promise.all([
    getSettlementSnapshot(current.householdId, null),
    listRecurringExpenses(current.householdId),
  ]);
  const nets = new Map(snapshot.balances.map((row) => [row.userId, row.net]));
  const hasRentTemplate = templates.some((item) =>
    item.itemName.toLowerCase().includes("rent"),
  );
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
    .select("full_name, payment_handle")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Household"
        description="Invite roommates, manage members, and keep settings in one place. Budgets, rent, and categories live here."
      >
        <Badge variant="secondary">{current.currency}</Badge>
        <Badge variant={isAdmin ? "default" : "outline"}>{current.role}</Badge>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          const isRecurring = item.href === "/household/recurring";
          const title =
            isRecurring && templates.length === 0
              ? "Add rent"
              : isRecurring && !hasRentTemplate
                ? "Add rent"
                : item.title;
          const description =
            isRecurring && templates.length === 0
              ? "Save rent so you are not retyping it every month"
              : item.description;
          const href =
            isRecurring && !hasRentTemplate
              ? "/household/recurring/new?item=Rent"
              : item.href;
          return (
            <Link
              key={item.href}
              href={href}
              className="group rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl",
                  item.tint,
                )}
              >
                <Icon className="size-5" />
              </span>
              <p className="mt-3 font-heading font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{current.name}</CardTitle>
              <CardDescription>
                Share this code so a roommate can join. Rotating it invalidates old links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-primary/12 px-4 py-5">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Invite code
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.12em] break-all sm:text-3xl sm:tracking-[0.18em]">
                  {formatInviteCode(current.inviteCode)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton value={current.inviteCode} />
                  {isAdmin ? <RotateInviteButton householdId={current.householdId} /> : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-3 py-2.5">
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
                Archive someone to hide them from new splits. Their history stays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeMembers.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isYou={member.userId === user.id}
                  isAdmin={isAdmin}
                  householdId={current.householdId}
                  outstandingNet={nets.get(member.userId) ?? 0}
                />
              ))}
              {archivedMembers.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Archived
                  </p>
                  {archivedMembers.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      isYou={member.userId === user.id}
                      isAdmin={isAdmin}
                      householdId={current.householdId}
                      outstandingNet={nets.get(member.userId) ?? 0}
                    />
                  ))}
                </div>
              ) : null}
              <div className="pt-3">
                {canLeave ? (
                  <LeaveHouseholdButton
                    householdId={current.householdId}
                    householdName={current.name}
                    canLeave
                  />
                ) : (
                  <div className="flex gap-2.5 rounded-xl bg-amber-500/12 px-3 py-3 text-sm text-amber-950 dark:text-amber-100">
                    <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
                    <p>
                      You are the last admin. Promote another roommate before
                      leaving this household.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Household settings</CardTitle>
                <CardDescription>Rename this home or change its currency.</CardDescription>
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
              <CardDescription>
                Shown on expenses, settlement, and in the sidebar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileNameForm
                fullName={profile?.full_name ?? ""}
                paymentHandle={profile?.payment_handle ?? ""}
                currency={current.currency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Another household</CardTitle>
              <CardDescription>Create a new one or join with an invite code.</CardDescription>
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
      </div>
    </div>
  );
}
