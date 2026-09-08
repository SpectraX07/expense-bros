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
import { updateHouseholdSettingsSchema } from "@/lib/validations/auth";
import { updateHouseholdSettingsAction } from "@/app/actions/households";

export function HouseholdSettingsForm({
  householdId,
  name,
  currency,
}: {
  householdId: string;
  name: string;
  currency: string;
}) {
  const [pending, setPending] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    (CURRENCIES.some((item) => item.code === currency)
      ? currency
      : "INR") as CurrencyCode,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = updateHouseholdSettingsSchema.safeParse({
      householdId,
      name: form.get("name"),
      currency: selectedCurrency,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setPending(true);
    try {
      const result = await updateHouseholdSettingsAction(parsed.data);
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-household-name">Household name</Label>
          <Input
            id="settings-household-name"
            name="name"
            required
            minLength={2}
            defaultValue={name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-currency">Currency</Label>
          <Select
            value={selectedCurrency}
            items={Object.fromEntries(CURRENCIES.map((item) => [item.code, item.label]))}
            onValueChange={(value) => {
              if (typeof value === "string") {
                setSelectedCurrency(value as CurrencyCode);
              }
            }}
          >
            <SelectTrigger id="settings-currency" className="w-full">
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
      </div>
      <p className="text-xs text-muted-foreground">
        Changing currency does not convert amounts already logged.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save household
      </Button>
    </form>
  );
}
