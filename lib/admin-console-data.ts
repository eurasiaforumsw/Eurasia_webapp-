import { defaultContentCategories, type AdminActivity, type AdminContentCategory } from "@/lib/admin-data";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

export async function syncAdminCategories(): Promise<AdminContentCategory[]> {
  const result = await request<{ categories: AdminContentCategory[] | null }>("/api/admin/categories");
  return result.categories ?? defaultContentCategories;
}

export async function saveAdminCategories(categories: AdminContentCategory[]): Promise<AdminContentCategory[]> {
  const result = await request<{ categories: AdminContentCategory[] }>("/api/admin/categories", {
    method: "PUT", body: JSON.stringify({ categories }),
  });
  return result.categories;
}

export async function fetchAdminActivity(limit = 30): Promise<AdminActivity[]> {
  const result = await request<{ activity: AdminActivity[] }>(`/api/admin/activity?limit=${Math.max(1, Math.min(100, limit))}`);
  return result.activity;
}

export async function recordAdminActivityRemote(activity: Omit<AdminActivity, "id" | "at">): Promise<AdminActivity> {
  const result = await request<{ activity: AdminActivity }>("/api/admin/activity", {
    method: "POST", body: JSON.stringify(activity),
  });
  return result.activity;
}
