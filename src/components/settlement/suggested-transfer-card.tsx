"use client";

import { ExternalLinkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { MarkPaidButton } from "@/components/settlement/mark-paid-button";
import { formatMoney } from "@/lib/money";
import {
  isUpiHandle,
  repaymentShareText,
  upiPayUrl,
  whatsappShareUrl,
} from "@/lib/payment";
import { cn } from "@/lib/utils";
import type { SuggestedTransfer } from "@/lib/settlements";

function personLabel(name: string, userId: string, currentUserId: string) {
  return userId === currentUserId ? `${name} (you)` : name;
}

export function SuggestedTransferCard({
  row,
  currentUserId,
  isAdmin,
  householdId,
  householdName,
  currency,
  year,
  month,
  allTime,
}: {
  row: SuggestedTransfer;
  currentUserId: string;
  isAdmin: boolean;
  householdId: string;
  householdName: string;
  currency: string;
  year: number;
  month: number;
  allTime: boolean;
}) {
  const canMark = isAdmin || row.fromUserId === currentUserId;
  const isDebtor = row.fromUserId === currentUserId;
  const isCreditor = row.toUserId === currentUserId;
  const handle = row.toPaymentHandle;
  const shareText = repaymentShareText({
    amount: row.amount,
    currency,
    householdName,
    payeeName: row.toName,
    handle,
  });

  return (
    <li className="space-y-3 rounded-xl border border-border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {personLabel(row.fromName, row.fromUserId, currentUserId)} pays{" "}
            {personLabel(row.toName, row.toUserId, currentUserId)}
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatMoney(row.amount, currency)}
          </p>
          {handle ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {currency === "INR" ? "UPI" : "Pay"} {handle}
            </p>
          ) : isDebtor ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ask {row.toName} to add how they take payment in Household → profile.
            </p>
          ) : null}
        </div>
        {canMark ? (
          <MarkPaidButton
            householdId={householdId}
            fromUserId={row.fromUserId}
            toUserId={row.toUserId}
            toName={row.toName}
            amount={row.amount}
            year={year}
            month={month}
            currency={currency}
            allTime={allTime}
          />
        ) : (
          <p className="text-xs text-muted-foreground">Waiting on them to pay</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {handle ? <CopyButton value={handle} label="Copy ID" /> : null}
        {isDebtor && handle && currency === "INR" && isUpiHandle(handle) ? (
          <a
            href={upiPayUrl({
              handle,
              payeeName: row.toName,
              amount: row.amount,
              note: householdName,
            })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center gap-1.5")}
          >
            <ExternalLinkIcon />
            Pay in UPI
          </a>
        ) : null}
        {isCreditor || isAdmin ? (
          <a
            href={whatsappShareUrl(shareText)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center gap-1.5")}
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </li>
  );
}
