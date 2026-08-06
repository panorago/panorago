import { getSiteSettings, saveSiteSettings } from "@/lib/admin/command";

export const metadata = {
  title: "Command Center · Settings",
};

const field =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  const envSnapshot = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      note: "Server only — never expose to client",
    },
    {
      key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      set: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
      note: "Browser Maps key only",
    },
    {
      key: "NEXT_PUBLIC_PANORA_WHATSAPP",
      set: Boolean(process.env.NEXT_PUBLIC_PANORA_WHATSAPP),
    },
    {
      key: "NEXT_PUBLIC_PANORA_EMAIL",
      set: Boolean(process.env.NEXT_PUBLIC_PANORA_EMAIL),
    },
    {
      key: "RESEND_API_KEY",
      set: Boolean(process.env.RESEND_API_KEY),
      note: "Optional ESP — mailto/wa.me used when absent",
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          System
        </p>
        <h1 className="mt-1 font-display text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Env-backed keys (read-only) plus editable site settings stored in
          Supabase <code>site_settings</code>.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)]">
        <h2 className="font-display text-2xl">Environment</h2>
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {envSnapshot.map((row) => (
            <li
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <code className="text-[var(--accent)]">{row.key}</code>
                {row.note && (
                  <p className="text-xs text-muted">{row.note}</p>
                )}
              </div>
              <span
                className={
                  row.set ? "text-[var(--success)]" : "text-muted"
                }
              >
                {row.set ? "Configured" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form
        action={async (formData) => {
          "use server";
          await saveSiteSettings(formData);
        }}
        className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow)]"
      >
        <h2 className="font-display text-2xl">Site settings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["whatsapp", "WhatsApp number"],
              ["email", "Public email"],
              ["phone", "Phone (E.164)"],
              ["phoneDisplay", "Phone display"],
              ["heroVideoUrl", "Hero video URL"],
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
              ["tiktok", "TikTok"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="space-y-1.5">
              <span className="text-xs text-muted">{label}</span>
              <input
                name={name}
                defaultValue={settings[name]}
                className={field}
              />
            </label>
          ))}
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs text-muted">Maps API key note</span>
            <textarea
              name="mapsApiKeyNote"
              rows={2}
              defaultValue={settings.mapsApiKeyNote}
              className={field}
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
