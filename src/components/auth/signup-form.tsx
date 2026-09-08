"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword } from "@/app/actions/auth";
import { signUpSchema } from "@/lib/validations/auth";

export function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setPending(true);
    try {
      const result = await signUpWithPassword(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNotice(result.message ?? "Check your email to continue.");
      toast.success(result.message);
    } finally {
      setPending(false);
    }
  }

  if (notice) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
          {notice}
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            placeholder="Alex"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending} size="lg">
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
