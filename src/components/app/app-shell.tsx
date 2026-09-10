"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, PlusIcon } from "lucide-react";
import { Brand } from "@/components/brand";
import { HouseholdSwitcher } from "@/components/app/household-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { MobileMoreMenu } from "@/components/app/mobile-more-menu";
import {
  ADD_EXPENSE_NAV,
  MANAGE_NAV,
  MOBILE_TABS_END,
  MOBILE_TABS_START,
  PRIMARY_NAV,
  navIsActive,
  type NavItem,
} from "@/components/app/nav-items";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";
import type { HouseholdMembership } from "@/lib/households";

function NavBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span
      className={cn(
        "absolute flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground ring-2 ring-background",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SidebarLink({
  item,
  active,
  emphasize,
  badge,
}: {
  item: NavItem;
  active: boolean;
  emphasize?: boolean;
  badge: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        emphasize
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90"
          : active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {active && !emphasize ? (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
      ) : null}
      <span className="relative">
        <Icon className="size-4" />
        <NavBadge count={badge} className="-top-1.5 -right-1.5 ring-sidebar" />
      </span>
      {item.label}
    </Link>
  );
}

function BottomTab({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative inline-flex size-8 items-center justify-center rounded-xl transition-colors",
          active && "bg-accent",
        )}
      >
        <Icon className="size-5" />
        <NavBadge count={badge} className="-top-0.5 -right-0.5" />
      </span>
      {item.shortLabel ?? item.label}
    </Link>
  );
}

export function AppShell({
  user,
  displayName,
  memberships,
  currentHousehold,
  dashboardBadge = 0,
  settlementBadge = 0,
  children,
}: {
  user: AuthUser;
  displayName: string;
  memberships: HouseholdMembership[];
  currentHousehold: HouseholdMembership;
  dashboardBadge?: number;
  settlementBadge?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const initials = displayName.slice(0, 1).toUpperCase();
  const badges: Record<string, number> = {
    "/dashboard": dashboardBadge,
    "/settlement": settlementBadge,
  };

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
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {PRIMARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={navIsActive(item.href, pathname)}
              emphasize={item.href === ADD_EXPENSE_NAV.href}
              badge={badges[item.href] ?? 0}
            />
          ))}
          <p className="mt-5 px-3 pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
            Manage
          </p>
          {MANAGE_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={navIsActive(item.href, pathname)}
              badge={0}
            />
          ))}
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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Brand size="sm" />
          <HouseholdSwitcher memberships={memberships} currentHousehold={currentHousehold} />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-6 md:pt-8 md:pb-12 xl:px-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-center px-1">
          {MOBILE_TABS_START.map((item) => (
            <li key={item.href}>
              <BottomTab
                item={item}
                active={navIsActive(item.href, pathname)}
                badge={badges[item.href] ?? 0}
              />
            </li>
          ))}

          <li className="flex min-h-14 items-center justify-center">
            <Link
              href={ADD_EXPENSE_NAV.href}
              aria-label={ADD_EXPENSE_NAV.label}
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform active:scale-95"
            >
              <PlusIcon className="size-6" />
            </Link>
          </li>

          {MOBILE_TABS_END.map((item) => (
            <li key={item.href}>
              <BottomTab
                item={item}
                active={navIsActive(item.href, pathname)}
                badge={badges[item.href] ?? 0}
              />
            </li>
          ))}

          <li>
            <MobileMoreMenu
              user={user}
              displayName={displayName}
              householdName={currentHousehold.name}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
}
