import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { PageHeader } from "@/components/app/page-header";
import { CategoryManager } from "@/components/expenses/category-manager";

export default async function CategoriesPage() {
  const { household, isAdmin } = await getAppContext();
  const { household: householdCategories } = await listCategories(
    household.householdId,
    { includeArchived: true },
  );

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Categories"
        description="Household categories sit on top of the shared defaults. Anyone can add one while logging an expense; only admins can rename or archive them here."
      />
      <CategoryManager
        householdId={household.householdId}
        categories={householdCategories}
        isAdmin={isAdmin}
      />
    </div>
  );
}
