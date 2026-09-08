export default function Loading() {
  return (
    <div className="w-full space-y-4">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="h-60 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
