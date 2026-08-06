import { getAdminProfiles, setProfileRole } from "@/lib/admin/command";
import type { ProfileRole } from "@/types";

export const metadata = {
  title: "Command Center · Users",
};

const ROLES: ProfileRole[] = ["admin", "editor", "viewer", "suspended"];

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
          Command Center. Suspend rather than hard-delete when possible.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] px-6 py-16 text-center">
          <p className="font-display text-2xl">No profiles found</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Insert a row into <code>profiles</code> for your auth user with{" "}
            <code>role = &apos;admin&apos;</code>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] px-5 py-4 shadow-[var(--shadow)]"
            >
              <div>
                <p className="font-medium">
                  {profile.displayName || profile.email || "User"}
                </p>
                <p className="text-xs text-muted">
                  {profile.email || profile.id}
                  {profile.suspendedAt ? " · suspended" : ""}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
