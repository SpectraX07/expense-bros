"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendMagicLink, signInWithPassword } from "@/app/actions/auth";
import { loginSchema, magicLinkSchema } from "@/lib/validations/auth";

export function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const [passwordPending, setPasswordPending] = useState(false);
  const [magicPending, setMagicPending] = useState(false);

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setPasswordPending(true);
    try {
      const result = await signInWithPassword(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setPasswordPending(false);
    }
  }

  async function onMagicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = magicLinkSchema.safeParse({
      email: form.get("magic-email"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }

    setMagicPending(true);
    try {
      const result = await sendMagicLink(parsed.data);
      if (result.ok) {
        toast.success(result.message ?? "Check your email.");
      } else {
        toast.error(result.error);
      }
    } finally {
      setMagicPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <Tabs defaultValue="password">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="magic">Magic link</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="pt-4">
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
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
                autoComplete="current-password"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={passwordPending} size="lg">
              {passwordPending ? (
                <Loader2Icon className="animate-spin" />
              ) : null}
              Sign in
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="magic" className="pt-4">
          <form className="space-y-4" onSubmit={onMagicSubmit}>
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                name="magic-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={magicPending} size="lg">
              {magicPending ? <Loader2Icon className="animate-spin" /> : null}
              Send magic link
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
