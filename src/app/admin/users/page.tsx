import { CreateAdminAccountForm } from "@/components/admin/create-admin-account-form";
import {
  getAdminProfiles,
  setAdminPassword,
  setProfileRole,
} from "@/lib/admin/command";
import type { ProfileRole } from "@/types";

export const metadata = {
  title: "Command Center · Users",
};

const ROLES: ProfileRole[] = ["admin", "editor", "viewer", "suspended"];

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function AdminUsersPage() {
  const profiles = await getAdminProfiles();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Access
        </p>
        <h1 className="mt-1 font-display text-4xl">Users</h1>
        <p className="mt-2 text-sm text-muted">
          Profiles linked to Supabase Auth. Only <code>admin</code> may open
          Command Center. Passwords are stored in Auth only;{" "}
          <code>admin_credentials</code> tracks when they were last set.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] px-5 py-5 shadow-[var(--shadow)]">
        <h2 className="font-display text-2xl">Create account</h2>
        <p className="mt-1 text-sm text-muted">
          Creates a Supabase Auth user, profile, and credentials row. New
          accounts must reset their temporary password on first login.
        </p>
        <CreateAdminAccountForm />
      </section>

      {profiles.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No profiles found</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Sign in once as the bootstrap admin, or create an account above
            (requires <code>SUPABASE_SERVICE_ROLE_KEY</code>).
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] px-5 py-4 shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {profile.displayName || profile.email || "User"}
                  </p>
                  <p className="text-xs text-muted">
                    {profile.email || profile.id}
                    {profile.suspendedAt ? " · suspended" : ""}
                    {" · password set "}
                    {formatWhen(profile.passwordUpdatedAt)}
                    {profile.mustReset ? " · must reset" : ""}
                  </p>
                </div>
                <form
                  action={async (formData) => {
                    "use server";
                    const role = String(formData.get("role")) as ProfileRole;
                    await setProfileRole(profile.id, role);
                  }}
                  className="flex items-center gap-2"
                >
                  <select
                    name="role"
                    defaultValue={profile.role}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--glass)]"
                  >
                    Save
                  </button>
                </form>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const password = String(formData.get("password") ?? "");
                  const mustReset = formData.get("mustReset") === "on";
                  await setAdminPassword(profile.id, password, { mustReset });
                }}
                className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-4"
              >
                <label className="min-w-[12rem] flex-1 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Set password
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <label className="flex items-center gap-2 pb-2 text-xs text-muted">
                  <input
                    name="mustReset"
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[var(--border)]"
                  />
                  Require reset on next login
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--accent-foreground,#fff)] hover:opacity-90"
                >
                  Update password
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
