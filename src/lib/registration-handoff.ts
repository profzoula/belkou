const STORAGE_KEY = "belkou_registration_handoff";

export type RegistrationHandoff = {
  email: string;
  registrationId?: string;
  courseSlug?: string;
  paid: boolean;
  savedAt: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveRegistrationHandoff(input: Omit<RegistrationHandoff, "savedAt">): void {
  if (!canUseStorage()) return;

  const payload: RegistrationHandoff = {
    ...input,
    email: input.email.trim().toLowerCase(),
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function getRegistrationHandoff(): RegistrationHandoff | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationHandoff;
    if (!parsed?.email?.trim()) return null;
    return {
      ...parsed,
      email: parsed.email.trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function clearRegistrationHandoff(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
