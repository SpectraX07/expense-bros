"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleOffIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryGlyph, colorWithAlpha } from "@/components/expenses/category-glyph";
import { cn } from "@/lib/utils";
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
  const [searchOpen, setSearchOpen] = useState(false);
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
  const canCreate = query.trim().length > 0 && !exactMatch;

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all",
            value === null
              ? "border-primary/40 bg-primary/15 text-foreground shadow-sm"
              : "border-border/80 bg-card/70 text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted">
            <CircleOffIcon className="size-3.5" />
          </span>
          None
        </button>

        {filtered.map((category) => {
          const color = category.color ?? "#64748b";
          const selected = value === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all",
                selected
                  ? "text-foreground shadow-sm"
                  : "border-border/80 bg-card/70 hover:bg-muted",
              )}
              style={
                selected
                  ? {
                      backgroundColor: colorWithAlpha(color, "28"),
                      borderColor: color,
                      boxShadow: `0 0 0 1px ${colorWithAlpha(color, "55")}`,
                    }
                  : undefined
              }
            >
              <span
                className="inline-flex size-6 items-center justify-center rounded-full"
                style={{
                  backgroundColor: colorWithAlpha(color, "33"),
                  color,
                }}
              >
                <CategoryGlyph icon={category.icon} className="size-3.5" />
              </span>
              {category.name}
            </button>
          );
        })}

        {canCreate ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={creating}
            onClick={() => void createCategory()}
          >
            <PlusIcon />
            Create “{query.trim()}”
          </Button>
        ) : null}
      </div>

      {searchOpen ? (
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or add a category"
            className="rounded-full pl-8"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate) {
                event.preventDefault();
                void createCategory();
              }
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setSearchOpen(true)}
        >
          Find or add a category
        </button>
      )}

      {query.trim() && filtered.length === 0 && !canCreate ? (
        <p className="text-sm text-muted-foreground">No matching categories.</p>
      ) : null}
    </div>
  );
}
