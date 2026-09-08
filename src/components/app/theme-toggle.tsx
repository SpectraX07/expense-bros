"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon-sm" : "sm"}
      className={cn(!compact && "justify-start", className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle color theme"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
      {compact ? null : (
        <>
          <span className="dark:hidden">Dark</span>
          <span className="hidden dark:inline">Light</span>
        </>
      )}
    </Button>
  );
}
