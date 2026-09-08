export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
