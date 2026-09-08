import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { JoinHouseholdForm } from "@/components/household/join-household-form";
import { INVITE_COOKIE } from "@/lib/constants";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const code = params.code ?? cookieStore.get(INVITE_COOKIE)?.value ?? "";
  const defaultTab = code ? "join" : "create";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your household</CardTitle>
        <CardDescription>
          Create a new one, or join roommates with an invite code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="join">Join</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="pt-4">
            <CreateHouseholdForm />
          </TabsContent>
          <TabsContent value="join" className="pt-4">
            <JoinHouseholdForm defaultCode={code} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
