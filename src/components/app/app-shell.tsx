"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  ScaleIcon,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { HouseholdSwitcher } from "@/components/app/household-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";
import type { HouseholdMembership } from "@/lib/households";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/expenses/new", label: "Add expense", icon: PlusIcon, shortLabel: "Add" },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/settlement", label: "Settlement", icon: ScaleIcon, shortLabel: "Settle" },
  { href: "/household", label: "Household", icon: HomeIcon, shortLabel: "Home" },
] as const;

export function AppShell({
  user,
  displayName,
  memberships,
  currentHousehold,
  children,
}: {
  user: AuthUser;
  displayName: string;
  memberships: HouseholdMembership[];
  currentHousehold: HouseholdMembership;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <Brand size="sm" />
        </div>
        <div className="px-3 py-3">
          <HouseholdSwitcher
            memberships={memberships}
            currentHousehold={currentHousehold}
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2.5 text-xs font-medium">{displayName}</p>
          {user.email ? (
            <p className="truncate px-2.5 text-[11px] text-muted-foreground">{user.email}</p>
          ) : null}
          <ThemeToggle />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="mt-1 w-full justify-start"
            >
              <LogOutIcon />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Brand size="sm" />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <HouseholdSwitcher
              memberships={memberships}
              currentHousehold={currentHousehold}
            />
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const label = "shortLabel" in item ? item.shortLabel : item.label;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-5", item.href === "/expenses/new" && "size-6")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
