"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [category, setCategory] = useState(categoryId || "all");
  const [payer, setPayer] = useState(payerId || "all");

  const categoryItems = {
    all: "All categories",
    ...Object.fromEntries(categories.map((item) => [item.id, item.name])),
  };
  const payerItems = {
    all: "Anyone paid",
    ...Object.fromEntries(members.map((member) => [member.userId, member.fullName])),
  };

  return (
    <form className="grid gap-2 sm:grid-cols-4" method="get">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="category" value={category === "all" ? "" : category} />
      <input type="hidden" name="payer" value={payer === "all" ? "" : payer} />
      <Input name="q" defaultValue={query} placeholder="Search items" />
      <Select
        value={category}
        items={categoryItems}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setCategory(value);
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
        value={payer}
        items={payerItems}
        onValueChange={(value) => {
          if (typeof value === "string") {
            setPayer(value);
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
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
