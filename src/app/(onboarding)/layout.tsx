import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireAuthUser } from "@/lib/auth";
import { getHouseholdMemberships } from "@/lib/households";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  const memberships = await getHouseholdMemberships(user.id);

  if (memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        {children}
      </div>
    </main>
  );
}
