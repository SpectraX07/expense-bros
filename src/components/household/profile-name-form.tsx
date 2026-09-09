"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSchema } from "@/lib/validations/auth";
import { updateDisplayNameAction } from "@/app/actions/households";

export function ProfileNameForm({
  fullName,
  paymentHandle,
  currency,
}: {
  fullName: string;
  paymentHandle: string;
  currency: string;
}) {
  const [pending, setPending] = useState(false);
  const upi = currency === "INR";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = updateProfileSchema.safeParse({
      fullName: form.get("fullName"),
      paymentHandle: form.get("paymentHandle"),
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
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
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
      <div className="space-y-2">
        <Label htmlFor="payment-handle">{upi ? "UPI ID" : "How to pay you"}</Label>
        <Input
          id="payment-handle"
          name="paymentHandle"
          maxLength={80}
          defaultValue={paymentHandle}
          placeholder={upi ? "name@upi" : "Account details"}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          {upi
            ? "Roommates can copy this or open a UPI app when they settle up with you."
            : "Shown on suggested transfers so roommates know how to pay you."}
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save profile
      </Button>
    </form>
  );
}
