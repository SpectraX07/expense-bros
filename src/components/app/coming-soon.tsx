import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-xl space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Badge variant="secondary">Coming next</Badge>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </section>
  );
}
