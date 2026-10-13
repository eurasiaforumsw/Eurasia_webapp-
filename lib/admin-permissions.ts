import type { AdminRole } from "./admin-auth";

export type AdminView = "overview" | "analytics" | "academic-analytics" | "members" | "content" | "layout" | "messages" | "broadcast" | "moderation" | "activity" | "settings";

export function canAccessAdminView(role: AdminRole, view: AdminView): boolean {
  if (role === "super-admin" || role === "admin") return true;
  if (role === "pr") return view === "content" || view === "broadcast";
  if (role === "content-editor") return view === "content";
  return role === "member-reviewer" && view === "members";
}

export function defaultAdminView(role: AdminRole): AdminView {
  if (role === "member-reviewer") return "members";
  if (role === "pr" || role === "content-editor") return "content";
  return "overview";
}
