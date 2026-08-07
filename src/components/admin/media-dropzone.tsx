"use client";

import { uploadPlaceMedia } from "@/lib/admin/upload-place-media";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useState, useTransition } from "react";

type MediaDropzoneProps = {
  label: string;
  hint?: string;
  /** Hidden form field name for single URL, or newline-joined when multiple */
  name?: string;
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multiple?: boolean;
  accept?: string;
  /** `hero` | `gallery` | `menu` | `video` — storage path folder */
  kind?: string;
  /** When false, only updates React state (pair with a separate named input). */
  includeHiddenField?: boolean;
};

export function MediaDropzone({
  label,
  hint,
  name,
  value,
  onChange,
  multiple = false,
  accept = "image/*",
  kind = "gallery",
  includeHiddenField = true,
}: MediaDropzoneProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const urls = Array.isArray(value) ? value : value ? [value] : [];

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setError(null);

      startTransition(async () => {
        const uploaded: string[] = [];
        for (const file of list) {
          const data = new FormData();
          data.set("file", file);
          data.set("kind", kind);
          const result = await uploadPlaceMedia(data);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          uploaded.push(result.url);
        }

        if (multiple) {
          onChange([...urls, ...uploaded]);
        } else {
          onChange(uploaded[0] ?? "");
        }
      });
    },
    [kind, multiple, onChange, urls],
  );

  function removeAt(index: number) {
    if (multiple) {
      onChange(urls.filter((_, i) => i !== index));
    } else {
      onChange("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-[var(--radius-md)] border border-dashed px-4 py-6 text-center transition-colors",
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border)] bg-[var(--background)]",
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={pending}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="pointer-events-none flex flex-col items-center gap-2 text-sm text-muted">
          {pending ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          ) : (
            <Upload className="h-6 w-6 text-[var(--accent)]" />
          )}
          <p>
            {pending
              ? "Uploading…"
              : "Drag & drop or click to upload"}
          </p>
          <p className="inline-flex items-center gap-1 text-[11px]">
            <ImagePlus className="h-3.5 w-3.5" />
            Saves to Supabase storage · public URL stored on the place
          </p>
        </div>
      </div>

      {/* Persist URLs into the form */}
      {includeHiddenField && name ? (
        multiple ? (
          <input type="hidden" name={name} value={urls.join("\n")} readOnly />
        ) : (
          <input type="hidden" name={name} value={urls[0] ?? ""} readOnly />
        )
      ) : null}

      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, i) => {
            const isVideo =
              /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video");
            return (
              <li
                key={`${url}-${i}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--secondary)]"
              >
                {isVideo ? (
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="160px"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-[var(--brand-navy)]/80 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Manual URL fallback */}
      <label className="block space-y-1">
        <span className="text-[11px] text-muted">
          Or paste URL{multiple ? "s (one per line)" : ""}
        </span>
        {multiple ? (
          <textarea
            rows={2}
            value={urls.join("\n")}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(/\n/)
                  .map((l) => l.trim())
                  .filter(Boolean),
              )
            }
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
            placeholder="https://…"
          />
        ) : (
          <input
            value={urls[0] ?? ""}
            onChange={(e) => onChange(e.target.value.trim())}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
            placeholder="https://…"
          />
        )}
      </label>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
