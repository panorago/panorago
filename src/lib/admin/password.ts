/** Shared password policy for Command Center (safe to import from server modules). */

export const BOOTSTRAP_ADMIN_EMAIL = "victorm@panorago.co.zw";

const LAUNCH_DEFAULT = "Password";

/**
 * Validates a new admin password.
 * Rejects the known launch default unless `allowLaunchPassword` (temp set + must_reset).
 */
export function validateAdminPassword(
  password: string,
  options: { allowLaunchPassword?: boolean } = {},
): string | null {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!options.allowLaunchPassword && trimmed === LAUNCH_DEFAULT) {
    return "Choose a different password than the launch default.";
  }
  return null;
}

export function isLaunchDefaultPassword(password: string): boolean {
  return password.trim() === LAUNCH_DEFAULT;
}
