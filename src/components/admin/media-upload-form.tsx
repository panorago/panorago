"use client";

import { uploadMediaAsset } from "@/lib/admin/command";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MediaUploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = await uploadMediaAsset(data);
          setMessage(result.ok ? "Uploaded." : result.error);
          if (result.ok) {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Upload
      </p>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">File</span>
        <input
          type="file"
          name="file"
          accept="image/*,video/*"
          required
          className="block w-full text-sm"
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Alt text</span>
        <input
          name="alt"
          placeholder="Describe the asset"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload to media"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
