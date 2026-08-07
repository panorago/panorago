/** Explorer email password policy (client + server). */

export type PasswordChecks = {
  minLength: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordMeetsPolicy(password: string): boolean {
  const c = getPasswordChecks(password);
  return c.minLength && c.upper && c.lower && c.number && c.special;
}

/** 0–4 strength score for the meter. */
export function passwordStrengthScore(password: string): number {
  const c = getPasswordChecks(password);
  return [c.minLength, c.upper, c.lower, c.number, c.special].filter(Boolean)
    .length;
}

export function validateExplorerPassword(password: string): string | null {
  if (!passwordMeetsPolicy(password)) {
    return "Use at least 12 characters with upper, lower, number, and a special character.";
  }
  return null;
}
