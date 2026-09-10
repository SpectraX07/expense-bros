import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/60 px-5 py-10 text-center shadow-sm sm:px-6 sm:py-12",
        className,
      )}
    >
      {Icon ? (
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="size-6" />
        </span>
      ) : null}
      <p className="font-heading text-base font-semibold text-balance sm:text-lg">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
