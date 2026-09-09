import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { PageHeader } from "@/components/app/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const { user, household, members } = await getAppContext();
  const { picker } = await listCategories(household.householdId);
  const defaultItemName = item?.trim() || undefined;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={defaultItemName === "Rent" ? "Add rent" : "New recurring expense"}
        description="Saved as a template. The dashboard will ask you to confirm it when the next run date arrives."
      />
      <ExpenseForm
        mode="recurring"
        householdId={household.householdId}
        currency={household.currency}
        members={members}
        categories={picker}
        currentUserId={user.id}
        defaultItemName={defaultItemName}
      />
      <p className="text-sm text-muted-foreground">
        <Link href="/household/recurring" className="underline-offset-4 hover:underline">
          Back to templates
        </Link>
      </p>
    </div>
  );
}
