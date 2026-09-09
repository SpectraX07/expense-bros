"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setMemberActiveAction, setMemberRoleAction } from "@/app/actions/households";
import { moneyToCents } from "@/lib/money";
import type { Enums } from "@/lib/supabase/database.types";

export function MemberRowActions({
  householdId,
  userId,
  fullName,
  role,
  isActive,
  outstandingNet = 0,
}: {
  householdId: string;
  userId: string;
  fullName: string;
  role: Enums<"member_role">;
  isActive: boolean;
  outstandingNet?: number;
}) {
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "restore" | "demote" | null>(
    null,
  );
  const hasBalance = moneyToCents(outstandingNet) !== 0;

  async function onSetActive(isActiveNext: boolean) {
    setPending(true);
    try {
      const result = await setMemberActiveAction({
        householdId,
        userId,
        isActive: isActiveNext,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  async function onSetRole(nextRole: Enums<"member_role">) {
    setPending(true);
    try {
      const result = await setMemberRoleAction({
        householdId,
        userId,
        role: nextRole,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Actions for ${fullName}`}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive && role === "member" ? (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => {
                void onSetRole("admin");
              }}
            >
              Make admin
            </DropdownMenuItem>
          ) : null}
          {isActive && role === "admin" ? (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => setConfirm("demote")}
            >
              Remove admin
            </DropdownMenuItem>
          ) : null}
          {isActive ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={pending}
              onClick={() => setConfirm("archive")}
            >
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => setConfirm("restore")}
            >
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "archive"
                ? `Archive ${fullName}?`
                : confirm === "restore"
                  ? `Restore ${fullName}?`
                  : `Remove admin from ${fullName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "archive" && hasBalance
                ? `${fullName} still has a running balance. Settle up first so you do not bury an unpaid amount.`
                : confirm === "archive"
                  ? "They will leave this household. Past expenses stay in history, and you can restore them later."
                  : confirm === "restore"
                    ? "They will become an active roommate again and can log expenses."
                    : "They will stay in the household as a member. You can make them admin again later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {confirm === "archive" && hasBalance ? (
              <AlertDialogAction render={<Link href="/settlement?scope=all" />}>
                Settle up first
              </AlertDialogAction>
            ) : (
            <AlertDialogAction
              variant={confirm === "archive" ? "destructive" : "default"}
              disabled={pending}
              onClick={() => {
                if (confirm === "archive") {
                  void onSetActive(false);
                } else if (confirm === "restore") {
                  void onSetActive(true);
                } else if (confirm === "demote") {
                  void onSetRole("member");
                }
              }}
            >
              {confirm === "archive"
                ? "Archive"
                : confirm === "restore"
                  ? "Restore"
                  : "Remove admin"}
            </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
