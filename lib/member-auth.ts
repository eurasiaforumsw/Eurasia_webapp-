export type MembershipType = "professional" | "student" | "institutional";

export type EducationLevel = "high-school" | "diploma" | "bachelor" | "master" | "doctorate";

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
  /* extended profile — editable on /member/profile */
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  educationLevel?: EducationLevel;
  license?: string;
  experienceYears?: number;
  targetGroups?: string[];
};

type StoredMember = MemberProfile & { passwordHash: string };

export const MEMBER_STORAGE_KEY = "efsw.member";
export const MEMBER_SESSION_KEY = "efsw.member.session";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** True when Supabase env vars are present — enables the remote (database) path.
 *  Note: `NEXT_PUBLIC_*` vars are inlined at build time, so this works in both
 *  SSR and the browser. */
export const isRemoteMemberStoreEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

const writeMember = (member: StoredMember | null) => {
  if (!canUseStorage()) return;
  if (member === null) {
    window.localStorage.removeItem(MEMBER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
};

/** Remove the password hash before handing a profile to the UI. */
const stripPassword = (member: StoredMember): MemberProfile => {
  const { passwordHash: _passwordHash, ...profile } = member;
  return profile;
};

/* ══════════════════════════════════════════
   Remote (Supabase) calls — degrade gracefully
   ══════════════════════════════════════════ */

const remoteRegister = async (
  member: StoredMember,
): Promise<{ member?: MemberProfile; error?: string; conflict?: boolean }> => {
  try {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        country: member.country,
        membershipType: member.membershipType,
        organization: member.organization,
        position: member.position,
        expertise: member.expertise,
        university: member.university,
        faculty: member.faculty,
        degree: member.degree,
        organizationType: member.organizationType,
        contactPosition: member.contactPosition,
        bio: member.bio,
        passwordHash: member.passwordHash,
        status: member.status,
        joinedAt: member.joinedAt,
        avatarUrl: member.avatarUrl,
        firstName: member.firstName,
        lastName: member.lastName,
        city: member.city,
        educationLevel: member.educationLevel,
        license: member.license,
        experienceYears: member.experienceYears,
        targetGroups: member.targetGroups,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      member?: MemberProfile;
      error?: string;
      conflict?: boolean;
    };
    if (!res.ok) return { error: body.error || `HTTP ${res.status}`, conflict: body.conflict };
    return { member: body.member ?? stripPassword(member) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
};

const remoteLogin = async (
  email: string,
  password: string,
): Promise<{ member?: MemberProfile; error?: string }> => {
  try {
    const res = await fetch("/api/members/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { member?: MemberProfile; error?: string };
    if (!res.ok) return { error: body.error || `HTTP ${res.status}` };
    return { member: body.member };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
};

const remoteUpdate = async (id: string, updates: Partial<MemberProfile>): Promise<{ error?: string }> => {
  try {
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: body.error || `HTTP ${res.status}` };
    }
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
};

const remoteFetchByEmail = async (email: string): Promise<MemberProfile | null> => {
  try {
    const res = await fetch(`/api/members?email=${encodeURIComponent(normalizeEmail(email))}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { member: MemberProfile | null };
    return body.member ?? null;
  } catch {
    return null;
  }
};

const remoteFetchById = async (id: string): Promise<MemberProfile | null> => {
  try {
    const res = await fetch(`/api/members?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { member: MemberProfile | null };
    return body.member ?? null;
  } catch {
    return null;
  }
};

/* ══════════════════════════════════════════
   Public API
   ══════════════════════════════════════════ */

export const getMember = (): MemberProfile | null => {
  const member = readMember();
  if (!member) return null;
  return stripPassword(member);
};

export const getSessionMember = (): MemberProfile | null => {
  if (!canUseStorage() || window.localStorage.getItem(MEMBER_SESSION_KEY) !== "active") return null;
  return getMember();
};

/**
 * Register a new member. When Supabase is configured the profile is inserted
 * into the `members` table and the returned row is mirrored into localStorage;
 * otherwise the profile stays local-only.
 */
export const registerMember = async (
  input: Omit<MemberProfile, "id" | "joinedAt" | "status"> & { password: string },
): Promise<MemberProfile> => {
  if (!canUseStorage()) throw new Error("Browser storage is unavailable.");

  const { password, ...profileInput } = input;
  const normalizedEmail = normalizeEmail(profileInput.email);
  const passwordHash = await hashPassword(password);
  const local: StoredMember = {
    ...profileInput,
    email: normalizedEmail,
    id: `efsw-${Date.now().toString(36)}`,
    joinedAt: new Date().toISOString(),
    status: "pending",
    passwordHash,
  };

  if (isRemoteMemberStoreEnabled()) {
    const existing = await remoteFetchByEmail(normalizedEmail);
    if (existing) throw new Error("This email is already registered. Please sign in instead.");
    const result = await remoteRegister(local);
    if (result.error) throw new Error(result.error);
    const stored: StoredMember = { ...(result.member ?? local), passwordHash };
    writeMember(stored);
    window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
    return stripPassword(stored);
  }

  const inBrowser = readMember();
  if (inBrowser) {
    throw new Error("A member profile already exists in this browser. Sign in with the same email.");
  }
  writeMember(local);
  window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
  return stripPassword(local);
};

/**
 * Sign in with email + password. Uses the server-side verify endpoint when
 * Supabase is configured (the password hash never round-trips to the client),
 * and falls back to the local browser copy otherwise.
 */
export const loginMember = async (email: string, password: string): Promise<MemberProfile> => {
  const normalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  if (isRemoteMemberStoreEnabled()) {
    const result = await remoteLogin(normalized, password);
    if (result.error) throw new Error(result.error);
    const profile = result.member!;
    writeMember({ ...profile, passwordHash });
    window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
    return profile;
  }

  const local = readMember();
  if (!local || local.email !== normalized) throw new Error("No member account was found for this email.");
  if (local.passwordHash !== passwordHash) throw new Error("Incorrect password.");
  window.localStorage.setItem(MEMBER_SESSION_KEY, "active");
  return stripPassword(local);
};

/**
 * Refresh the current member from Supabase (used after sign-in elsewhere or on
 * profile load) and mirror it into localStorage. Returns null when offline.
 */
export const refreshSessionMember = async (): Promise<MemberProfile | null> => {
  const local = readMember();
  if (!local) return null;
  if (!isRemoteMemberStoreEnabled()) return stripPassword(local);
  const remote = await remoteFetchById(local.id);
  if (!remote) return stripPassword(local);
  const merged: StoredMember = { ...local, ...remote, passwordHash: local.passwordHash };
  writeMember(merged);
  return stripPassword(merged);
};

export const updateMember = (updates: Partial<MemberProfile>): MemberProfile => {
  const member = readMember();
  if (!member) throw new Error("Member profile not found.");
  const next: StoredMember = {
    ...member,
    ...updates,
    email: updates.email ? normalizeEmail(updates.email) : member.email,
  };
  writeMember(next);
  if (isRemoteMemberStoreEnabled()) {
    void remoteUpdate(member.id, updates);
  }
  return stripPassword(next);
};

export const logoutMember = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(MEMBER_SESSION_KEY);
    window.dispatchEvent(new Event("efsw:member-session-changed"));
  }
};

export const removeMember = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(MEMBER_STORAGE_KEY);
  window.localStorage.removeItem(MEMBER_SESSION_KEY);
};

/**
 * Get all members (for admin/aggregation purposes).
 * In a local-only setup this returns an empty array.
 * With Supabase enabled, it fetches from the remote store.
 */
export const getAllMembers = (): MemberProfile[] => {
  // Local-only: return empty array (single-member storage)
  if (!isRemoteMemberStoreEnabled()) {
    const member = readMember();
    return member ? [stripPassword(member)] : [];
  }

  // Remote: would need a server-side API endpoint
  // For now, return empty array and implement server-side fetch later
  return [];
};
