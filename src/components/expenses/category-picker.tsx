"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExpenseCategory } from "@/lib/expenses";
import { createCategoryAction } from "@/app/actions/expenses";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function CategoryPicker({
  householdId,
  categories,
  value,
  onChange,
  onCreated,
}: {
  householdId: string;
  categories: ExpenseCategory[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreated: (category: ExpenseCategory) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return categories;
    }
    return categories.filter((category) =>
      category.name.toLowerCase().includes(needle),
    );
  }, [categories, query]);

  const exactMatch = categories.some(
    (category) => category.name.toLowerCase() === query.trim().toLowerCase(),
  );

  async function createCategory() {
    const name = query.trim();
    if (!name) {
      return;
    }
    setCreating(true);
    try {
      const result = await createCategoryAction({
        householdId,
        name,
        color: COLORS[categories.length % COLORS.length],
      });
      if (!result.ok || !result.category) {
        toast.error(result.ok ? "Could not create category." : result.error);
        return;
      }
      onCreated(result.category);
      onChange(result.category.id);
      setQuery("");
      toast.success(`Added ${result.category.name}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search or add a category"
      />
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
            value === null ? "bg-accent" : "hover:bg-muted"
          }`}
        >
          No category
        </button>
        {filtered.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
              value === category.id ? "bg-accent" : "hover:bg-muted"
            }`}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: category.color ?? "#64748b" }}
            />
            {category.name}
          </button>
        ))}
        {query.trim() && !exactMatch ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            disabled={creating}
            onClick={() => void createCategory()}
          >
            <PlusIcon />
            Create “{query.trim()}”
          </Button>
        ) : null}
      </div>
    </div>
  );
}
