import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { shiftPeriod } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export function MonthSwitcher({
  year,
  month,
  extra = {},
}: {
  year: number;
  month: number;
  extra?: Record<string, string | undefined>;
}) {
  const previous = shiftPeriod(year, month, -1);
  const next = shiftPeriod(year, month, 1);
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy");

  function href(target: { year: number; month: number }) {
    const params = new URLSearchParams();
    params.set("year", String(target.year));
    params.set("month", String(target.month));
    for (const [key, value] of Object.entries(extra)) {
      if (value) {
        params.set(key, value);
      }
    }
    return `?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={href(previous)}
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
        aria-label="Previous month"
      >
        <ChevronLeftIcon />
      </Link>
      <p className="min-w-28 flex-1 text-center text-sm font-medium sm:min-w-36 sm:flex-none">
        {label}
      </p>
      <Link
        href={href(next)}
        className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
        aria-label="Next month"
      >
        <ChevronRightIcon />
      </Link>
    </div>
  );
}
