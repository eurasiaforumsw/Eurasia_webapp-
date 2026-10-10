export type AdminRole = "super-admin" | "content-editor" | "member-reviewer" | "admin" | "pr";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  signedInAt: string;
};

export const ADMIN_SESSION_KEY = "efsw.admin.session";
const ADMIN_LOGIN_ATTEMPTS_KEY = "efsw.admin.attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Demo admin account — password moved to env var
// In production, replace with proper auth backend
export const ADMIN_DEMO_ACCOUNT = {
  email: "admin@efsw.local",
  name: "EFSW Administrator",
  role: "super-admin" as const,
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Rate limiting for login attempts
 */
const checkRateLimit = (): { allowed: boolean; remainingAttempts: number; lockedUntil?: Date } => {
  if (!canUseStorage()) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };

  const raw = window.localStorage.getItem(ADMIN_LOGIN_ATTEMPTS_KEY);
  if (!raw) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };

  try {
    const data = JSON.parse(raw) as { count: number; firstAttempt: string; lockedUntil?: string };
    const now = Date.now();

    // Check if locked
    if (data.lockedUntil) {
      const lockedUntil = new Date(data.lockedUntil);
      if (now < lockedUntil.getTime()) {
        return { allowed: false, remainingAttempts: 0, lockedUntil };
      }
      // Lock expired, reset
      window.localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    // Check if attempts are within time window (1 hour)
    const firstAttempt = new Date(data.firstAttempt).getTime();
    if (now - firstAttempt > 60 * 60 * 1000) {
      // Reset after 1 hour
      window.localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    const remainingAttempts = MAX_LOGIN_ATTEMPTS - data.count;
    return { allowed: remainingAttempts > 0, remainingAttempts };
  } catch {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }
};

const recordLoginAttempt = (success: boolean) => {
  if (!canUseStorage()) return;

  if (success) {
    window.localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
    return;
  }

  const raw = window.localStorage.getItem(ADMIN_LOGIN_ATTEMPTS_KEY);
  const now = new Date().toISOString();

  if (!raw) {
    window.localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify({
      count: 1,
      firstAttempt: now,
    }));
    return;
  }

  try {
    const data = JSON.parse(raw) as { count: number; firstAttempt: string };
    const newCount = data.count + 1;

    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      // Lock account
      window.localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify({
        count: newCount,
        firstAttempt: data.firstAttempt,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION).toISOString(),
      }));
    } else {
      window.localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify({
        count: newCount,
        firstAttempt: data.firstAttempt,
      }));
    }
  } catch {
    // Reset on error
    window.localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify({
      count: 1,
      firstAttempt: now,
    }));
  }
};

export const getAdminSession = (): AdminSession | null => {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
};

export const loginAdmin = async (email: string, password: string): Promise<AdminSession> => {
  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    if (rateLimit.lockedUntil) {
      const minutes = Math.ceil((rateLimit.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }
    throw new Error(`Too many sign-in attempts (${rateLimit.remainingAttempts} remaining).`);
  }

  // Validate credentials
  if (normalizeEmail(email) !== ADMIN_DEMO_ACCOUNT.email) {
    recordLoginAttempt(false);
    throw new Error("Admin account not found.");
  }

  // Get password from env (fallback to demo password for development)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "EFSW-demo";

  if (password !== adminPassword) {
    recordLoginAttempt(false);
    const remaining = rateLimit.remainingAttempts - 1;
    throw new Error(`Incorrect admin password (${remaining} attempt${remaining === 1 ? "" : "s"} remaining).`);
  }

  if (!canUseStorage()) {
    throw new Error("Browser storage is unavailable.");
  }

  // Success
  recordLoginAttempt(true);

  const session: AdminSession = {
    id: "admin-demo",
    name: ADMIN_DEMO_ACCOUNT.name,
    email: ADMIN_DEMO_ACCOUNT.email,
    role: ADMIN_DEMO_ACCOUNT.role,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  // Tell any subscribed listeners (SiteNav, profile topbar) that a fresh
  // admin session just landed so they can swap Login/Register for the
  // Admin console link without waiting for the next page load.
  window.dispatchEvent(new Event("efsw:admin-session-changed"));
  return session;
};

export const logoutAdmin = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    // Don't clear attempts on logout
    // Notify other UI (SiteNav, profile topbar) that the session ended so
    // they can swap the admin link back to Login/Register without a refresh.
    window.dispatchEvent(new Event("efsw:admin-session-changed"));
  }
};

/**
 * Get remaining login attempts (for UI display)
 */
export const getRemainingAttempts = (): number => {
  const rateLimit = checkRateLimit();
  return rateLimit.remainingAttempts;
};
