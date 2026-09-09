"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HistoryFilters({
  year,
  month,
  query,
  categoryId,
  payerId,
  categories,
  members,
}: {
  year: number;
  month: number;
  query: string;
  categoryId: string;
  payerId: string;
  categories: { id: string; name: string }[];
  members: { userId: string; fullName: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  const categoryItems = {
    all: "All categories",
    ...Object.fromEntries(categories.map((item) => [item.id, item.name])),
  };
  const payerItems = {
    all: "Anyone paid",
    ...Object.fromEntries(members.map((member) => [member.userId, member.fullName])),
  };

  function navigate(next: { q?: string; category?: string; payer?: string }) {
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    const q = next.q ?? search;
    const category = next.category ?? categoryId;
    const payer = next.payer ?? payerId;
    if (q.trim()) {
      params.set("q", q.trim());
    }
    if (category) {
      params.set("category", category);
    }
    if (payer) {
      params.set("payer", payer);
    }
    startTransition(() => {
      router.replace(`/history?${params.toString()}`);
    });
  }

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Input
        value={search}
        placeholder="Search items"
        onChange={(event) => {
          const value = event.target.value;
          setSearch(value);
          if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
          }
          debounceRef.current = window.setTimeout(() => {
            navigate({ q: value });
          }, 300);
        }}
      />
      <Select
        value={categoryId || "all"}
        items={categoryItems}
        onValueChange={(value) => {
          if (typeof value === "string") {
            navigate({ category: value === "all" ? "" : value });
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
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
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Anyone paid</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {member.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
