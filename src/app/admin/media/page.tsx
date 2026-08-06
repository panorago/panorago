import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { deleteMediaAsset, getMediaAssets } from "@/lib/admin/command";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Command Center · Media Library",
};

function formatBytes(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const assets = await getMediaAssets();
  const filtered = q.trim()
    ? assets.filter(
        (a) =>
          a.filename.toLowerCase().includes(q.toLowerCase()) ||
          a.path.toLowerCase().includes(q.toLowerCase()) ||
          a.alt.toLowerCase().includes(q.toLowerCase()),
      )
    : assets;

  const totalBytes = assets.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Assets
        </p>
        <h1 className="mt-1 font-display text-4xl">Media Library</h1>
        <p className="mt-2 text-sm text-muted">
          Upload and manage files in the Supabase <code>media</code> bucket.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Files
            </p>
            <p className="mt-2 font-display text-3xl">{assets.length}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Estimated usage
            </p>
            <p className="mt-2 font-display text-3xl">
              {formatBytes(totalBytes)}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Bucket
            </p>
            <p className="mt-2 text-sm text-muted">
              Public <code>media</code> (migration 005 / dashboard).
            </p>
          </div>
        </div>
        <MediaUploadForm />
      </div>

      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search filename, path, alt…"
          className="w-full max-w-md rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No media records</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Upload above, or ensure migration 005 created{" "}
            <code>media_assets</code>.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((asset) => (
            <li
              key={asset.id}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] shadow-[var(--shadow)]"
            >
              {asset.publicUrl && asset.contentType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.publicUrl}
                  alt={asset.alt || asset.filename}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[var(--secondary)] text-sm text-muted">
                  {asset.contentType || "file"}
                </div>
              )}
              <div className="space-y-2 p-4">
                <p className="truncate text-sm font-medium">{asset.filename}</p>
                <p className="truncate text-xs text-muted">
                  {asset.bucket}/{asset.path}
                </p>
                <p className="text-xs text-muted">
                  {formatBytes(asset.sizeBytes)} ·{" "}
                  {formatDistanceToNow(new Date(asset.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                <div className="flex flex-wrap gap-3">
                  {asset.publicUrl ? (
                    <a
                      href={asset.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent)]"
                    >
                      Open →
                    </a>
                  ) : null}
                  <form
                    action={async () => {
                      "use server";
                      await deleteMediaAsset(asset.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
