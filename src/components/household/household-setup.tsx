"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { createRentTemplateAction } from "@/app/actions/recurring";
import { formatInviteCode } from "@/lib/invite-code";
import { toMoneyNumber } from "@/lib/money";

export function HouseholdSetup({
  householdId,
  householdName,
  inviteCode,
  inviteLink,
  currency,
}: {
  householdId: string;
  householdName: string;
  inviteCode: string;
  inviteLink: string;
  currency: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [nextRunDate, setNextRunDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pending, setPending] = useState(false);

  async function saveRent() {
    const parsed = toMoneyNumber(amount);
    if (parsed <= 0) {
      toast.error("Enter the monthly rent amount, or skip this step.");
      return;
    }
    setPending(true);
    try {
      const result = await createRentTemplateAction({
        householdId,
        amount: parsed,
        nextRunDate,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Rent saved.");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-5">
        <div>
          <h2 className="font-heading text-lg font-semibold">Invite your roommates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {householdName} is empty until someone else joins. Share the code or link.
          </p>
        </div>
        <div className="rounded-2xl bg-primary/12 px-4 py-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Invite code
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.12em] break-all sm:text-3xl sm:tracking-[0.18em]">
            {formatInviteCode(inviteCode)}
          </p>
          <div className="mt-4">
            <CopyButton value={inviteCode} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-3 py-2.5">
          <p className="min-w-0 truncate text-sm">{inviteLink}</p>
          <CopyButton value={inviteLink} label="Copy link" />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-5">
        <div>
          <h2 className="font-heading text-lg font-semibold">Add rent (optional)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved as a monthly template. The dashboard will ask you to add it when the date arrives —
            it will not post a bill by itself.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rent-amount">Monthly rent ({currency})</Label>
            <Input
              id="rent-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent-date">Next due date</Label>
            <Input
              id="rent-date"
              type="date"
              value={nextRunDate}
              onChange={(event) => setNextRunDate(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => void saveRent()}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Save rent and continue
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        </div>
      </section>
    </div>
  );
}
