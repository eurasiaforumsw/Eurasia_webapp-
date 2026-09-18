export type MembershipType = "professional" | "student" | "institutional";

export type MemberProfile = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  membershipType: MembershipType;
  organization: string;
  position: string;
  expertise: string;
  university: string;
  faculty: string;
  degree: string;
  organizationType: string;
  contactPosition: string;
  bio: string;
  joinedAt: string;
  status: "pending" | "active" | "suspended";
};

type StoredMember = MemberProfile & { passwordHash: string };

export const MEMBER_STORAGE_KEY = "efsw.member";
export const MEMBER_SESSION_KEY = "efsw.member.session";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = async (password: string) => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return btoa(unescape(encodeURIComponent(password)));
};

const readMember = (): StoredMember | null => {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(MEMBER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredMember;
  } catch {
    return null;
  }
};

export const getMember = (): MemberProfile | null => {
  const member = readMember();
  if (!member) return null;
  const { passwordHash: _passwordHash, ...profile } = member;
  return profile;
};

export const getSessionMember = (): MemberProfile | null => {
  if (!canUseStorage() || window.localStorage.getItem(MEMBER_SESSION_KEY) !== "active") return null;
  return getMember();
};

export const registerMember = async (input: Omit<MemberProfile, "id" | "joinedAt" | "status"> & { password: string }) => {
  if (!canUseStorage()) throw new Error("Browser storage is unavailable.");
  if (readMember()) throw new Error("A member profile already exists in this browser. Sign in with the same email.");

  const { password, ...profileInput } = input;
  const member: StoredMember = {
    ...profileInput,
    email: normalizeEmail(profileInput.email),
    id: `efsw-${Date.now().toString(36)}`,
    joinedAt: new Date().toISOString(),
    status: "pending",
    passwordHash: await hashPassword(password),
  };

  window.localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
  window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
  return getMember();
};

export const loginMember = async (email: string, password: string) => {
  const member = readMember();
  if (!member || member.email !== normalizeEmail(email)) throw new Error("No member account was found for this email.");
  if (member.passwordHash !== await hashPassword(password)) throw new Error("Incorrect password.");
  if (canUseStorage()) window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
  return getMember();
};

export const updateMember = (updates: Partial<MemberProfile>) => {
  const member = readMember();
  if (!member) throw new Error("Member profile not found.");
  const next: StoredMember = { ...member, ...updates, email: normalizeEmail(updates.email ?? member.email) };
  if (canUseStorage()) window.localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(next));
  return getMember();
};

export const logoutMember = () => {
  if (canUseStorage()) window.localStorage.removeItem(MEMBER_SESSION_KEY);
};

export const removeMember = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(MEMBER_STORAGE_KEY);
  window.localStorage.removeItem(MEMBER_SESSION_KEY);
};
