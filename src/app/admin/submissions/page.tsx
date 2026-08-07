import {
  approvePlaceSubmission,
  getPlaceSubmissions,
  rejectPlaceSubmission,
} from "@/lib/admin/command";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const metadata = {
  title: "Command Center · Submissions",
};

export default async function AdminSubmissionsPage() {
  const submissions = await getPlaceSubmissions();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Intake
          </p>
          <h1 className="mt-1 font-display text-4xl">Place submissions</h1>
          <p className="mt-2 text-sm text-muted">
            Public Add Your Place → approve creates an unpublished place draft.
          </p>
        </div>
        <Link
          href="/add-your-place"
          target="_blank"
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--glass)]"
        >
          Open public form →
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No submissions</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Run migration 004, then share{" "}
            <Link href="/add-your-place" className="text-[var(--accent)]">
              /add-your-place
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {submissions.map((sub) => (
            <li
              key={sub.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl">{sub.placeName}</p>
                    <span className="rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs capitalize">
                      {sub.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {sub.city} · {sub.category} · by {sub.submitterName}
                    {sub.submitterEmail ? ` · ${sub.submitterEmail}` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(new Date(sub.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {sub.status === "pending" && (
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await approvePlaceSubmission(sub.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)]"
                      >
                        Approve → draft
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectPlaceSubmission(sub.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--danger)]/40 px-3 py-1.5 text-xs text-[var(--danger)]"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
                {sub.createdPlaceId && (
                  <Link
                    href={`/admin/places/${sub.createdPlaceId}`}
                    className="text-sm text-[var(--accent)]"
                  >
                    Open place draft →
                  </Link>
                )}
              </div>
              {sub.story && (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed">
                  {sub.story}
                </p>
              )}
              {sub.payload && Object.keys(sub.payload).length > 0 ? (
                <details className="mt-3 text-xs text-muted">
                  <summary className="cursor-pointer text-[var(--accent)]">
                    Extra submission details
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-[11px]">
                    {JSON.stringify(sub.payload, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
