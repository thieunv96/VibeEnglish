"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ConfirmDeleteButton({
  apiPath,
  testId,
  label = "Delete",
}: {
  apiPath: string;
  testId: string;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error("Delete failed");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      data-testid={testId}
      className="text-red-600 hover:text-red-800 font-semibold text-xs disabled:opacity-50"
    >
      {isPending ? "Deleting…" : label}
    </button>
  );
}
