"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  archiveCategoryAction,
  createCategoryAction,
  updateCategoryAction,
} from "@/app/actions/expenses";
import type { ExpenseCategory } from "@/lib/expenses";

export function CategoryManager({
  householdId,
  categories,
  isAdmin,
}: {
  householdId: string;
  categories: ExpenseCategory[];
  isAdmin: boolean;
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await createCategoryAction({ householdId, name });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      toast.success("Category added");
    } finally {
      setPending(false);
    }
  }

  async function onSave(id: string) {
    setPending(true);
    try {
      const result = await updateCategoryAction({
        id,
        householdId,
        name: editingName,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditingId(null);
      toast.success("Category updated");
    } finally {
      setPending(false);
    }
  }

  async function onArchive(id: string, archived: boolean) {
    const result = await archiveCategoryAction({ id, householdId, archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(archived ? "Category archived" : "Category restored");
  }

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void onCreate(event)}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New category name"
          required
        />
        <Button type="submit" disabled={pending}>
          Add category
        </Button>
      </form>

      <ul className="space-y-2">
        {categories.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No household categories yet. Global defaults still appear when you add an expense.
          </li>
        ) : (
          categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color ?? "#64748b" }}
                />
                {editingId === category.id ? (
                  <Input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="h-8 w-44"
                  />
                ) : (
                  <p className="truncate text-sm font-medium">{category.name}</p>
                )}
                {category.is_archived ? <Badge variant="secondary">Archived</Badge> : null}
              </div>
              {isAdmin ? (
                <div className="flex flex-wrap gap-2">
                  {editingId === category.id ? (
                    <>
                      <Button size="sm" onClick={() => void onSave(category.id)} disabled={pending}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void onArchive(category.id, !category.is_archived)}
                      >
                        {category.is_archived ? "Restore" : "Archive"}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
