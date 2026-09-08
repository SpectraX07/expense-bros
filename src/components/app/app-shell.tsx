"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  RepeatIcon,
  ScaleIcon,
  TagsIcon,
  WalletIcon,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { HouseholdSwitcher } from "@/components/app/household-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";
import type { HouseholdMembership } from "@/lib/households";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/expenses/new", label: "Add expense", icon: PlusIcon, shortLabel: "Add" },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/settlement", label: "Settlement", icon: ScaleIcon, shortLabel: "Settle" },
  { href: "/household", label: "Household", icon: HomeIcon, shortLabel: "Home" },
] as const;

const MANAGE_NAV = [
  { href: "/household/budgets", label: "Budgets", icon: WalletIcon },
  { href: "/household/recurring", label: "Recurring", icon: RepeatIcon },
  { href: "/household/categories", label: "Categories", icon: TagsIcon },
] as const;

function navIsActive(href: string, pathname: string) {
  if (href === "/household") {
    return pathname === "/household";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sidebarLinkClass(active: boolean, emphasize = false) {
  if (emphasize) {
    return "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90";
  }
  return active
    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";
}

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
  children: ReactNode;
}) {
  const pathname = usePathname();
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-full">
      <aside className="fixed inset-y-0 left-0 hidden w-[17.5rem] flex-col bg-sidebar text-sidebar-foreground shadow-[4px_0_24px_oklch(0.2_0.04_260/0.18)] md:flex">
        <div className="px-4 py-5">
          <Brand size="sm" className="text-sidebar-foreground" />
        </div>
        <div className="px-3 pb-4">
          <HouseholdSwitcher
            memberships={memberships}
            currentHousehold={currentHousehold}
            variant="sidebar"
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {PRIMARY_NAV.map((item) => {
            const active = navIsActive(item.href, pathname);
            const Icon = item.icon;
            const emphasize = item.href === "/expenses/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  sidebarLinkClass(active, emphasize),
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <p className="mt-5 px-3 pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
            Manage
          </p>
          {MANAGE_NAV.map((item) => {
            const active = navIsActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  sidebarLinkClass(active),
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <Avatar size="sm" className="ring-1 ring-white/15">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {user.email ? (
                <p className="truncate text-[11px] text-sidebar-foreground/55">{user.email}</p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-1">
            <ThemeToggle className="flex-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <form action={signOut} className="flex-1">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOutIcon />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="md:pl-[17.5rem]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Brand size="sm" />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <HouseholdSwitcher
              memberships={memberships}
              currentHousehold={currentHousehold}
            />
          </div>
        </header>

        <main className="w-full px-4 pb-28 pt-6 md:px-6 md:pb-12 md:pt-8 xl:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {PRIMARY_NAV.map((item) => {
            const active = navIsActive(item.href, pathname);
            const Icon = item.icon;
            const label = "shortLabel" in item ? item.shortLabel : item.label;
            const add = item.href === "/expenses/new";
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    add
                      ? "text-primary-foreground"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl",
                      add && "size-9 bg-primary text-primary-foreground shadow-md shadow-primary/30",
                      !add && active && "text-primary",
                    )}
                  >
                    <Icon className={cn("size-5", add && "size-5")} />
                  </span>
                  <span className={cn(add && "text-foreground")}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
