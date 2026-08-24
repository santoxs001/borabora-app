export const MIN_AGE = Number(process.env.NEXT_PUBLIC_MIN_AGE ?? 18);

export function ageFromBirthdate(birthdate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return null;
  const [y, m, d] = birthdate.split('-').map(Number);
  const dob = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dob.getTime())) return null;
  // Reject impossible dates that Date silently rolls over (e.g. 2000-02-31).
  if (dob.getUTCMonth() !== m - 1 || dob.getUTCDate() !== d) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - y;
  const beforeBirthday =
    now.getUTCMonth() < m - 1 || (now.getUTCMonth() === m - 1 && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export interface AgeCheck {
  ok: boolean;
  age: number | null;
  reason?: string;
}

/**
 * The 18+ gate. Enforced here on the client for immediate feedback and
 * again in the API layer — the client check is UX, the server check is
 * the actual control.
 */
export function checkAge(birthdate: string): AgeCheck {
  const age = ageFromBirthdate(birthdate);
  if (age == null) return { ok: false, age: null, reason: "that date doesn't look right." };
  if (age < MIN_AGE) return { ok: false, age, reason: `HEY is ${MIN_AGE}+. we'll be here when you are.` };
  if (age > 120) return { ok: false, age, reason: "that date doesn't look right." };
  return { ok: true, age };
}
