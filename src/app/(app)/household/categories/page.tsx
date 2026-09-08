import { getAppContext } from "@/lib/app-context";
import { listCategories } from "@/lib/expenses";
import { CategoryManager } from "@/components/expenses/category-manager";

export default async function CategoriesPage() {
  const { household, isAdmin } = await getAppContext();
  const { household: householdCategories } = await listCategories(
    household.householdId,
    { includeArchived: true },
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Household categories sit on top of the shared defaults. Anyone can add one while
          logging an expense; only admins can rename or archive them here.
        </p>
      </div>
      <CategoryManager
        householdId={household.householdId}
        categories={householdCategories}
        isAdmin={isAdmin}
      />
    </div>
  );
}
