"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinHouseholdSchema } from "@/lib/validations/auth";
import { joinHousehold } from "@/app/actions/households";

export function JoinHouseholdForm({
  defaultCode = "",
  submitLabel = "Join household",
}: {
  defaultCode?: string;
  submitLabel?: string;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = joinHouseholdSchema.safeParse({
      inviteCode: form.get("inviteCode"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid invite code.");
      return;
    }

    setPending(true);
    try {
      const result = await joinHousehold(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="inviteCode">Invite code</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          required
          defaultValue={defaultCode}
          placeholder="AB3K-9Q2M"
          autoCapitalize="characters"
          className="font-mono uppercase tracking-wider"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
