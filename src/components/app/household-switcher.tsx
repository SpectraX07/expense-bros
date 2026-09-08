"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchHousehold } from "@/app/actions/households";
import type { HouseholdMembership } from "@/lib/households";

export function HouseholdSwitcher({
  memberships,
  currentHousehold,
}: {
  memberships: HouseholdMembership[];
  currentHousehold: HouseholdMembership;
}) {
  const showSwitcher = memberships.length > 1;

  if (!showSwitcher) {
    return (
      <div className="truncate rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium">
        {currentHousehold.name}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="truncate">{currentHousehold.name}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>Households</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((household) => (
          <DropdownMenuItem
            key={household.householdId}
            disabled={household.householdId === currentHousehold.householdId}
            onClick={() => {
              void switchHousehold({ householdId: household.householdId });
            }}
          >
            <span className="truncate">{household.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
