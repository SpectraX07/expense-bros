import type { ComponentType } from "react";
import {
  HistoryIcon,
  HomeIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RepeatIcon,
  ScaleIcon,
  TagsIcon,
  WalletIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
};

export const ADD_EXPENSE_NAV: NavItem = {
  href: "/expenses/new",
  label: "Add expense",
  shortLabel: "Add",
  icon: PlusIcon,
};

const DASHBOARD_NAV: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboardIcon,
};

const HISTORY_NAV: NavItem = { href: "/history", label: "History", icon: HistoryIcon };

const SETTLEMENT_NAV: NavItem = {
  href: "/settlement",
  label: "Settlement",
  shortLabel: "Settle",
  icon: ScaleIcon,
};

const HOUSEHOLD_NAV: NavItem = {
  href: "/household",
  label: "Household",
  shortLabel: "Home",
  icon: HomeIcon,
};

export const PRIMARY_NAV: NavItem[] = [
  DASHBOARD_NAV,
  ADD_EXPENSE_NAV,
  HISTORY_NAV,
  SETTLEMENT_NAV,
  HOUSEHOLD_NAV,
];

export const MANAGE_NAV: NavItem[] = [
  { href: "/household/budgets", label: "Budgets", icon: WalletIcon },
  { href: "/household/recurring", label: "Recurring", icon: RepeatIcon },
  { href: "/household/categories", label: "Categories", icon: TagsIcon },
];

/**
 * The bottom bar centres "Add expense", so tabs are split into the pair that
 * sits on each side of it. Everything else moves into the More sheet.
 */
export const MOBILE_TABS_START: NavItem[] = [DASHBOARD_NAV, HISTORY_NAV];
export const MOBILE_TABS_END: NavItem[] = [SETTLEMENT_NAV];

/** Reachable on mobile only through the More sheet. */
export const MOBILE_MORE_NAV: NavItem[] = [HOUSEHOLD_NAV, ...MANAGE_NAV];

export function navIsActive(href: string, pathname: string) {
  if (href === "/household") {
    return pathname === "/household";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
