"use client";

import { ChevronDownIcon, HouseIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function HouseholdSwitcher({
  memberships,
  currentHousehold,
  variant = "header",
}: {
  memberships: HouseholdMembership[];
  currentHousehold: HouseholdMembership;
  variant?: "header" | "sidebar";
}) {
  const showSwitcher = memberships.length > 1;
  const sidebar = variant === "sidebar";
  const frame = cn(
    "flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium outline-none",
    sidebar
      ? "border border-white/10 bg-white/5 text-sidebar-foreground"
      : "max-w-48 border border-border bg-card/80",
    showSwitcher &&
      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  );

  const body = (
    <>
      <HouseIcon className={cn("size-4 shrink-0", sidebar ? "text-sidebar-primary" : "text-primary")} />
      <span className="min-w-0 flex-1 truncate">{currentHousehold.name}</span>
      {showSwitcher ? (
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0",
            sidebar ? "text-sidebar-foreground/50" : "text-muted-foreground",
          )}
        />
      ) : null}
    </>
  );

  if (!showSwitcher) {
    return <div className={frame}>{body}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(frame, "justify-between")}>{body}</DropdownMenuTrigger>
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
