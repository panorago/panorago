"use client";

import { reorderHomepageSections } from "@/lib/admin/command";
import type { HomepageSection } from "@/types";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  initialSections: HomepageSection[];
};

export function HomepageSectionBoard({ initialSections }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...sections];
    const from = next.findIndex((s) => s.id === dragId);
    const to = next.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setSections(next);
    setDragId(null);
    startTransition(async () => {
      const result = await reorderHomepageSections(next.map((s) => s.id));
      setMessage(result.ok ? "Order saved." : result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Drag sections to reorder. Changes save automatically.
        {pending ? " Saving…" : null}
        {message ? ` ${message}` : null}
      </p>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li
            key={section.id}
            draggable
            onDragStart={() => setDragId(section.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(section.id)}
            className="flex cursor-grab items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-card)] px-4 py-3 active:cursor-grabbing"
          >
            <GripVertical
              className="h-4 w-4 shrink-0 text-[var(--accent)]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {section.key}
              </p>
              <p className="truncate font-medium">{section.title}</p>
            </div>
            <span className="text-xs text-muted">
              {section.enabled ? "On" : "Off"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
