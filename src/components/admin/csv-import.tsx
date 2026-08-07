"use client";

import { importPlacesCsv, type CsvPlaceImportRow } from "@/lib/admin/actions";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

/** Required header columns (must be present). */
const REQUIRED_COLUMNS = [
  "name",
  "slug",
  "location",
  "city",
  "category",
  "story",
  "panora_notes",
  "latitude",
  "longitude",
  "price_guide",
  "hero_image",
] as const;

/** Optional columns matching public place / admin form fields. */
const OPTIONAL_COLUMNS = [
  "country",
  "average_spend",
  "gallery",
  "menu_image_urls",
  "video_url",
  "pricing_items",
  "mood",
  "golden_hour",
  "best_time",
  "dress_vibe",
  "noise_level",
  "opening_hours",
  "perfect_for",
  "payment_methods",
  "whatsapp",
  "phone",
  "email",
  "website",
  "instagram",
  "facebook",
  "tiktok",
  "google_maps_url",
  "homepage_sections",
  "meta_title",
  "meta_description",
  "distance_km",
] as const;

const ALL_KNOWN = new Set<string>([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);

export type CsvPlaceRow = CsvPlaceImportRow;

/** Minimal CSV parser: headers + rows, supports quoted fields with commas. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const normalized = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushField();
      pushRow();
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return { headers, rows: rows.slice(1) };
}

function cell(
  headers: string[],
  cells: string[],
  col: string,
): string {
  const idx = headers.indexOf(col);
  if (idx < 0) return "";
  return (cells[idx] ?? "").trim();
}

function rowsToPlaceDrafts(
  headers: string[],
  rows: string[][],
): { drafts: CsvPlaceRow[]; error?: string } {
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return {
      drafts: [],
      error: `Missing required column(s): ${missing.join(", ")}.`,
    };
  }

  const drafts: CsvPlaceRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.every((c) => !c.trim())) continue;

    const name = cell(headers, cells, "name");
    if (!name) {
      return {
        drafts: [],
        error: `Row ${i + 2}: name is required.`,
      };
    }

    const draft: CsvPlaceRow = {
      name,
      slug: cell(headers, cells, "slug"),
      location: cell(headers, cells, "location"),
      city: cell(headers, cells, "city") || "Chinhoyi",
      category: cell(headers, cells, "category") || "dining",
      story: cell(headers, cells, "story"),
      panora_notes: cell(headers, cells, "panora_notes"),
      latitude: cell(headers, cells, "latitude"),
      longitude: cell(headers, cells, "longitude"),
      price_guide: cell(headers, cells, "price_guide"),
      hero_image: cell(headers, cells, "hero_image"),
    };

    for (const col of OPTIONAL_COLUMNS) {
      if (!headers.includes(col)) continue;
      const value = cell(headers, cells, col);
      if (value) {
        (draft as Record<string, string>)[col] = value;
      }
    }

    drafts.push(draft);
  }

  if (drafts.length === 0) {
    return { drafts: [], error: "No data rows found in CSV." };
  }

  return { drafts };
}

export function CsvImport() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<CsvPlaceRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => drafts.slice(0, 8), [drafts]);

  function onFileChange(file: File | null) {
    setError(null);
    setMessage(null);
    setDrafts([]);
    setFileName(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const { headers, rows } = parseCsv(text);
      const unknown = headers.filter((h) => h && !ALL_KNOWN.has(h));
      const result = rowsToPlaceDrafts(headers, rows);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFileName(file.name);
      setDrafts(result.drafts);
      if (unknown.length > 0) {
        setMessage(
          `Note: ignoring unknown column(s): ${unknown.join(", ")}.`,
        );
      }
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  }

  function onImport() {
    if (drafts.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await importPlacesCsv(drafts);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? `Imported ${drafts.length} place(s) as drafts.`);
      setDrafts([]);
      setFileName(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <div>
        <h2 className="font-display text-xl">CSV / Excel import</h2>
        <p className="mt-1 text-sm text-muted">
          Upload a spreadsheet of places. Rows are inserted as{" "}
          <span className="text-[var(--foreground)]">unpublished</span> drafts
          for review. Export from Excel as CSV (UTF-8).
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Required columns:{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            {REQUIRED_COLUMNS.join(", ")}
          </code>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Optional (match admin form / public page):{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            {OPTIONAL_COLUMNS.join(", ")}
          </code>
          . Use{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            |
          </code>{" "}
          to separate multiple URLs in{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            gallery
          </code>{" "}
          and{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            menu_image_urls
          </code>
          . Pricing rows:{" "}
          <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[11px]">
            Label|Price;Label2|Price2
          </code>{" "}
          (semicolon between items, or one Label|Price per line in quoted
          cells). Category: dining, escape, nightlife, wellness, culture,
          outdoors, coffee, weekend.
        </p>
      </div>

      <label className="inline-flex cursor-pointer flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Choose CSV
        </span>
        <input
          type="file"
          accept=".csv,.xls,text/csv,application/vnd.ms-excel"
          className="block w-full max-w-md text-sm text-muted file:mr-3 file:rounded-full file:border file:border-[var(--border)] file:bg-[var(--secondary)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--glass)]"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {fileName && (
        <p className="text-xs text-muted">
          Loaded <span className="text-[var(--foreground)]">{fileName}</span> —{" "}
          {drafts.length} row{drafts.length === 1 ? "" : "s"}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-[var(--radius-sm)] border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]"
        >
          {message}
        </p>
      )}

      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border)]">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-[var(--secondary)] text-[10px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">City</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {preview.map((row, i) => (
                  <tr key={`${row.name}-${i}`}>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-muted">{row.city}</td>
                    <td className="px-3 py-2 text-muted">{row.category}</td>
                    <td className="px-3 py-2 text-muted">
                      {row.slug || "(auto)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {drafts.length > preview.length && (
            <p className="text-xs text-muted">
              Showing first {preview.length} of {drafts.length} rows.
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={onImport}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
          >
            {pending ? "Importing…" : "Import unpublished"}
          </button>
        </div>
      )}
    </div>
  );
}
