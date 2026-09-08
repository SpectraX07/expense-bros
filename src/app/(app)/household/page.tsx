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
import { requireAuthUser } from "@/lib/auth";
import {
  formatInviteCode,
  getCurrentHouseholdId,
  getHouseholdMembers,
  getHouseholdMemberships,
} from "@/lib/households";
import { getSiteOrigin } from "@/lib/http";

export default async function HouseholdPage() {
  const user = await requireAuthUser();
  const memberships = await getHouseholdMemberships(user.id);
  const currentId = await getCurrentHouseholdId(memberships);
  const current =
    memberships.find((item) => item.householdId === currentId) ?? memberships[0];
  const members = await getHouseholdMembers(current.householdId);
  const origin = await getSiteOrigin();
  const inviteLink = `${origin}/join?code=${current.inviteCode}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Household</h1>
        <p className="text-muted-foreground">
          Invite roommates and switch between households.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium">
          <Link href="/household/categories" className="underline-offset-4 hover:underline">
            Categories
          </Link>
          <Link href="/household/budgets" className="underline-offset-4 hover:underline">
            Budgets
          </Link>
          <Link href="/household/recurring" className="underline-offset-4 hover:underline">
            Recurring
          </Link>
        </div>
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
            <CopyButton value={current.inviteCode} />
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
          <CardDescription>Active roommates in this household.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                  ) : null}
                  <AvatarFallback>
                    {member.fullName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.fullName}
                    {member.userId === user.id ? " (you)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {format(parseISO(member.joinedAt), "d MMM yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                {member.role}
              </Badge>
            </div>
          ))}
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
