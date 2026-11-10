"use client";

import { approvePlaceSubmission } from "@/lib/admin/command";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ApproveSubmissionButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await approvePlaceSubmission(id);
            if (!result.ok || !result.id) {
              setError(result.ok ? "Draft was not created." : result.error);
              return;
            }
            router.push(`/preview/places/${result.id}`);
          });
        }}
      >
        {pending ? "Approving…" : "Approve → preview"}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
