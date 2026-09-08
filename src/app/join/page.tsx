import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { JoinHouseholdForm } from "@/components/household/join-household-form";
import { Brand } from "@/components/brand";
import { getAuthUser } from "@/lib/auth";
import { formatInviteCode } from "@/lib/households";
import { cn } from "@/lib/utils";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code?.trim() ?? "";
  const user = await getAuthUser();

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Join a household</CardTitle>
            <CardDescription>
              {code
                ? `Invite code ${formatInviteCode(code)}`
                : "Enter the invite code your roommate shared."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <JoinHouseholdForm defaultCode={code} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account to join this household.
                </p>
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                >
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
