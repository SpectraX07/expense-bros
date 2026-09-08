"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { createHouseholdSchema } from "@/lib/validations/auth";
import { createHousehold } from "@/app/actions/households";

export function CreateHouseholdForm({
  submitLabel = "Create household",
}: {
  submitLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createHouseholdSchema.safeParse({
      name: form.get("name"),
      currency,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setPending(true);
    try {
      const result = await createHousehold(parsed.data);
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
        <Label htmlFor="household-name">Household name</Label>
        <Input
          id="household-name"
          name="name"
          required
          minLength={2}
          placeholder="Sunset Apartment"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={currency}
          onValueChange={(value) => {
            if (typeof value === "string") {
              setCurrency(value as CurrencyCode);
            }
          }}
        >
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
