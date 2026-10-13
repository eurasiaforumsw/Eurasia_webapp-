import type { AdminMember } from "./admin-data";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Member operation failed");
  return result as T;
}

export async function fetchAdminMembers(): Promise<AdminMember[]> {
  const result = await request<{ members: AdminMember[] }>("/api/members");
  return result.members;
}

export async function updateAdminMemberStatus(id: string, status: AdminMember["status"], reviewNote?: string): Promise<AdminMember> {
  const result = await request<{ member: AdminMember }>("/api/members", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, ...(reviewNote === undefined ? {} : { reviewNote }) }),
  });
  return result.member;
}

export async function deleteAdminMemberRemote(id: string): Promise<void> {
  await request(`/api/members?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export type MemberBulkResult = { id: string; success: boolean; error?: string };

export async function executeMemberBulk(action: "approve" | "delete", ids: string[]): Promise<MemberBulkResult[]> {
  const result = await request<{ results: MemberBulkResult[] }>("/api/members/bulk", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ids }),
  });
  if (!Array.isArray(result.results)) throw new Error("Missing bulk operation results");
  return ids.map((id) => result.results.find((item) => item.id === id) || {
    id, success: false, error: "Missing result for this member",
  });
}
