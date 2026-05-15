"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil } from "lucide-react";
import { approveLessonAction, rejectLessonAction } from "./actions";

export function QueueRowActions({ id }: { id: string }) {
  const t = useTranslations("admin.queue");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const onApprove = () => {
    startTransition(async () => {
      await approveLessonAction(id);
    });
  };
  const onReject = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      await rejectLessonAction(id, reason);
      setConfirming(null);
      setReason("");
    });
  };

  if (confirming === "reject") {
    return (
      <div className="w-full max-w-md flex flex-col gap-2">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={t("rejectPlaceholder")}
          className="text-sm"
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>{t("cancel")}</Button>
          <Button size="sm" variant="danger" onClick={onReject} disabled={pending}>
            {t("confirmReject")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button asChild variant="outline" size="sm">
        <Link href={`/lessons/${id}`} target="_blank"><Pencil className="size-3.5" /> {t("view")}</Link>
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirming("reject")} disabled={pending}>
        <X className="size-3.5" /> {t("reject")}
      </Button>
      <Button size="sm" variant="success" onClick={onApprove} disabled={pending}>
        <Check className="size-3.5" /> {t("approve")}
      </Button>
    </div>
  );
}
