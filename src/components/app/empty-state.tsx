import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center shadow-sm",
        className,
      )}
    >
      <p className="font-heading text-lg font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
