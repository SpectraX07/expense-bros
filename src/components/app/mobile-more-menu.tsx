"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, EllipsisIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { MOBILE_MORE_NAV, navIsActive } from "@/components/app/nav-items";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth";

export function MobileMoreMenu({
  user,
  displayName,
  householdName,
}: {
  user: AuthUser;
  displayName: string;
  householdName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const initials = displayName.slice(0, 1).toUpperCase();
  const sectionActive = MOBILE_MORE_NAV.some((item) => navIsActive(item.href, pathname));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="More"
            className={cn(
              "flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
              sectionActive ? "text-primary" : "text-muted-foreground",
            )}
          />
        }
      >
        <span className="inline-flex size-8 items-center justify-center rounded-xl">
          <EllipsisIcon className="size-5" />
        </span>
        More
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>{householdName}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3">
            <Avatar className="ring-1 ring-foreground/10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName}</p>
              {user.email ? (
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
          </div>

          <nav>
            <ul className="overflow-hidden rounded-2xl border border-border">
              {MOBILE_MORE_NAV.map((item) => {
                const active = navIsActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="border-b border-border last:border-0">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center gap-3 px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent/60 text-foreground"
                          : "text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="min-h-11 flex-1 justify-center border border-border" />
            <form action={signOut} className="flex-1">
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 w-full justify-center"
              >
                <LogOutIcon />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
