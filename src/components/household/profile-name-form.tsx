"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSchema } from "@/lib/validations/auth";
import { updateDisplayNameAction } from "@/app/actions/households";

export function ProfileNameForm({ fullName }: { fullName: string }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = updateProfileSchema.safeParse({
      fullName: form.get("fullName"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setPending(true);
    try {
      const result = await updateDisplayNameAction(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="fullName"
          required
          minLength={1}
          maxLength={80}
          defaultValue={fullName}
          autoComplete="name"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save name
      </Button>
    </form>
  );
}
