import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isSupabaseConfigured();
  let status: "unconfigured" | "connected" | "error" = "unconfigured";
  let detail: string | null = null;

  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("households").select("id").limit(1);

      if (error) {
        status = "error";
        detail = error.message;
      } else {
        status = "connected";
      }
    } catch (error) {
      status = "error";
      detail = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">ExpenseBros</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Project scaffold is running
        </h1>
        <p className="text-muted-foreground">
          Phase 1 is schema and clients only. Auth, onboarding, and the rest of
          the UI start in Phase 2.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">Supabase</p>
        {status === "unconfigured" ? (
          <p className="mt-2 text-muted-foreground">
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env.local</code>, add your project URL
            and publishable key, then apply the SQL migrations.
          </p>
        ) : null}
        {status === "connected" ? (
          <p className="mt-2 text-muted-foreground">
            Connected. The client can reach your project.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-2 text-destructive">
            Could not query the database
            {detail ? `: ${detail}` : "."} If the tables are missing, run the
            migrations in <code className="font-mono">supabase/migrations</code>
            .
          </p>
        ) : null}
      </section>
    </main>
  );
}
