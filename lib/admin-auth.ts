export type AdminRole = "super-admin" | "content-editor" | "member-reviewer";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  signedInAt: string;
};

export const ADMIN_SESSION_KEY = "efsw.admin.session";

// This account exists only so the local prototype can be reviewed end to end.
// Replace it with a server-side identity provider before production use.
export const ADMIN_DEMO_ACCOUNT = {
  email: "admin@efsw.local",
  password: "EFSW-demo-admin",
  name: "EFSW Administrator",
  role: "super-admin" as const,
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
  if (normalizeEmail(email) !== ADMIN_DEMO_ACCOUNT.email) throw new Error("ไม่พบบัญชีผู้ดูแลนี้");
  if (password !== ADMIN_DEMO_ACCOUNT.password) throw new Error("รหัสผ่านผู้ดูแลไม่ถูกต้อง");
  if (!canUseStorage()) throw new Error("เปิดใช้งาน local storage ไม่ได้ในเบราว์เซอร์นี้");

  const session: AdminSession = {
    id: "admin-demo",
    name: ADMIN_DEMO_ACCOUNT.name,
    email: ADMIN_DEMO_ACCOUNT.email,
    role: ADMIN_DEMO_ACCOUNT.role,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const logoutAdmin = () => {
  if (canUseStorage()) window.localStorage.removeItem(ADMIN_SESSION_KEY);
};
