"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANGE_CHIPS, RANGE_LABELS, type RangeKey } from "@/lib/history-range";
import { cn } from "@/lib/utils";

type FilterState = {
  q: string;
  range: RangeKey;
  from: string;
  to: string;
  category: string;
  payer: string;
  uncategorised: boolean;
};

export function HistoryFilters({
  year,
  month,
  query,
  range,
  from,
  to,
  categoryId,
  payerId,
  uncategorised,
  categories,
  members,
  currentUserId,
}: {
  year: number;
  month: number;
  query: string;
  range: RangeKey;
  from: string;
  to: string;
  categoryId: string;
  payerId: string;
  uncategorised: boolean;
  categories: { id: string; name: string }[];
  members: { userId: string; fullName: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  const current: FilterState = {
    q: query,
    range,
    from,
    to,
    category: categoryId,
    payer: payerId,
    uncategorised,
  };

  const categoryItems = {
    all: "All categories",
    none: "Uncategorised",
    ...Object.fromEntries(categories.map((item) => [item.id, item.name])),
  };
  const payerItems = {
    all: "Anyone paid",
    ...Object.fromEntries(members.map((member) => [member.userId, member.fullName])),
  };

  const filtersActive =
    Boolean(query) ||
    Boolean(categoryId) ||
    Boolean(payerId) ||
    uncategorised ||
    range !== "month";

  function navigate(patch: Partial<FilterState>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));

    if (next.range !== "month") {
      params.set("range", next.range);
    }
    if (next.range === "custom") {
      if (next.from) {
        params.set("from", next.from);
      }
      if (next.to) {
        params.set("to", next.to);
      }
    }
    if (next.q.trim()) {
      params.set("q", next.q.trim());
    }
    if (next.uncategorised) {
      params.set("category", "none");
    } else if (next.category) {
      params.set("category", next.category);
    }
    if (next.payer) {
      params.set("payer", next.payer);
    }

    startTransition(() => {
      router.replace(`/history?${params.toString()}`);
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      navigate({ q: value });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const categorySelectValue = uncategorised ? "none" : categoryId || "all";

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-card/70 p-3 shadow-sm sm:p-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          placeholder="Search items and notes"
          aria-label="Search expenses"
          className="h-10 pl-9 pr-9 text-base sm:text-sm"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <span className="absolute top-1/2 right-2 -translate-y-1/2">
          {pending ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                navigate({ q: "" });
              }}
            >
              <XIcon />
            </Button>
          ) : null}
        </span>
      </div>

      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
        {RANGE_CHIPS.map((key) => {
          const active = range === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => navigate({ range: key, from: "", to: "" })}
              className={cn(
                "shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {RANGE_LABELS[key]}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={range === "custom"}
          onClick={() => navigate({ range: "custom" })}
          className={cn(
            "shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
            range === "custom"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {RANGE_LABELS.custom}
        </button>
      </div>

      {range === "custom" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              className="h-10"
              onChange={(event) => navigate({ from: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              className="h-10"
              onChange={(event) => navigate({ to: event.target.value })}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          value={categorySelectValue}
          items={categoryItems}
          onValueChange={(value) => {
            if (typeof value !== "string") {
              return;
            }
            navigate({
              category: value === "all" || value === "none" ? "" : value,
              uncategorised: value === "none",
            });
          }}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="none">Uncategorised</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={payerId || "all"}
          items={payerItems}
          onValueChange={(value) => {
            if (typeof value === "string") {
              navigate({ payer: value === "all" ? "" : value });
            }
          }}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anyone paid</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.fullName}
                {member.userId === currentUserId ? " (you)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={payerId === currentUserId ? "default" : "outline"}
          size="sm"
          onClick={() =>
            navigate({ payer: payerId === currentUserId ? "" : currentUserId })
          }
        >
          I paid
        </Button>
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              startTransition(() => {
                router.replace(`/history?year=${year}&month=${month}`);
              });
            }}
          >
            <XIcon />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
