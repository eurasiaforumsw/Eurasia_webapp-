"use client";

import { useEffect, useState, useCallback } from "react";
import "@/styles/admin-layout.css";
import "@/styles/admin-mobile-responsive.css";
import {
  AdminActivity,
  AdminContentItem,
  AdminContentCategory,
  AdminLeaderProfile,
  AdminLayoutConfig,
  AdminMember,
  AdminSettings,
  defaultLayoutConfig,
  deleteAdminContentRemote,
  getAdminSettings,
  saveAdminContentRemote,
  saveAdminLayoutRemote,
  syncAdminLayout,
  syncAdminContent,
  saveAdminSettingsRemote,
  syncAdminSettings,
} from "@/lib/admin-data";
import { AdminRole, logoutAdmin } from "@/lib/admin-auth";
import { logoutMember } from "@/lib/member-auth";
import { fetchAdminMembers, updateAdminMemberStatus, deleteAdminMemberRemote } from "@/lib/admin-members";
import { syncAdminCategories, saveAdminCategories, fetchAdminActivity, recordAdminActivityRemote } from "@/lib/admin-console-data";
import { canAccessAdminView, defaultAdminView } from "@/lib/admin-permissions";
import { AdminSidebar, AdminView } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewView } from "@/components/admin/views/AdminOverviewView";
import { AdminMembersView } from "@/components/admin/views/AdminMembersView";
import { AdminContentView } from "@/components/admin/views/AdminContentView";
import { AdminLayoutView } from "@/components/admin/views/AdminLayoutView";
import { AdminMessagesView } from "@/components/admin/views/AdminMessagesView";
import { AdminBroadcastView } from "@/components/admin/views/AdminBroadcastView";
import { AdminActivityView } from "@/components/admin/views/AdminActivityView";
import { AdminSettingsView } from "@/components/admin/views/AdminSettingsView";
import { AdminAcademicAnalyticsView } from "@/components/admin/views/AdminAcademicAnalyticsView";
import { MessageModeration } from "@/components/admin/moderation/MessageModeration";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { MemberDetailDrawer } from "@/components/admin/modals/MemberDetailDrawer";
import { ContentEditorModal } from "@/components/admin/modals/ContentEditorModal";
import { LeaderEditorModal } from "@/components/admin/modals/LeaderEditorModal";
import { ConfirmDeleteDialog } from "@/components/admin/modals/ConfirmDeleteDialog";

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  signedInAt: string;
}

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [view, setView] = useState<AdminView>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<string>("");

  // Data states
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [contentCategories, setContentCategories] = useState<AdminContentCategory[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [layout, setLayout] = useState<AdminLayoutConfig>(defaultLayoutConfig);

  // Modals & Drawer states
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [contentEditorItem, setContentEditorItem] = useState<AdminContentItem | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [leaderEditorProfile, setLeaderEditorProfile] = useState<AdminLeaderProfile | null>(null);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Initialize and verify session
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify');
        if (!response.ok) {
          window.location.replace("/admin/login");
          return;
        }
        const sessionData = await response.json();
        setSession(sessionData);
        setView(defaultAdminView(sessionData.role));
        const jobs: Promise<unknown>[] = [];
        const load = <T,>(label: string, promise: Promise<T>, apply: (data: T) => void) => {
          jobs.push(promise.then(apply).catch((error) => {
            setToast(`${label}: ${error instanceof Error ? error.message : "Unable to load data"}`);
          }));
        };
        if (canAccessAdminView(sessionData.role, "members")) load("Members", fetchAdminMembers(), setMembers);
        if (canAccessAdminView(sessionData.role, "content")) {
          load("Content", syncAdminContent(), setContent);
          load("Categories", syncAdminCategories(), setContentCategories);
        }
        if (canAccessAdminView(sessionData.role, "layout")) load("Layout", syncAdminLayout(), setLayout);
        if (canAccessAdminView(sessionData.role, "settings")) load("Settings", syncAdminSettings(), setSettings);
        if (canAccessAdminView(sessionData.role, "activity")) load("Activity", fetchAdminActivity(), setActivity);
        await Promise.all(jobs);
      } catch (error) {
        window.location.replace("/admin/login");
      }
    };

    verifySession();
  }, []);

  // Toast timer
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const logActivity = useCallback(
    (action: string, detail: string, tone: AdminActivity["tone"] = "neutral") => {
      void recordAdminActivityRemote({ action, detail, tone })
        .then(() => fetchAdminActivity()).then(setActivity)
        .catch((error) => notify(`Activity log failed: ${error instanceof Error ? error.message : "Please try again"}`));
    },
    [notify]
  );

  const refreshMembers = useCallback(async () => {
    try { setMembers(await fetchAdminMembers()); }
    catch (error) { notify(`Refresh failed: ${error instanceof Error ? error.message : "Please try again"}`); }
  }, [notify]);

  const handleUpdateMemberStatus = useCallback(
    async (id: string, status: AdminMember["status"], reviewNote?: string) => {
      try {
        const updated = await updateAdminMemberStatus(id, status, reviewNote);
        setMembers((current) => current.map((member) => member.id === id ? updated : member));
        setSelectedMember((current) => current?.id === id ? updated : current);
        logActivity(status === "active" ? "Approve member" : status === "suspended" ? "Suspend member" : "Change member status", `ID: ${id} · ${status}`, status === "active" ? "success" : "warning");
        notify("Member status updated");
      } catch (error) {
        notify(`Save failed: ${error instanceof Error ? error.message : "Please try again"}`);
        throw error;
      }
    },
    [logActivity, notify]
  );

  const handleDeleteMember = useCallback(
    (id: string) => {
      const member = members.find((m) => m.id === id);
      setConfirmDelete({
        isOpen: true,
        title: "Confirm member deletion",
        description: `Delete member ${member?.fullName || id}? This cannot be undone.`,
        onConfirm: async () => {
          await deleteAdminMemberRemote(id);
          setMembers((current) => current.filter((item) => item.id !== id));
          setSelectedMember(null);
          setConfirmDelete(null);
          logActivity("Deleted member", member?.fullName || id, "warning");
          notify("Member deleted");
        },
      });
    },
    [members, logActivity, notify]
  );

  const handleExportMembersCsv = useCallback(() => {
    const rows = [
      ["Member ID", "Name", "Email", "Country", "Type", "Status", "Joined"],
      ...members.map((m) => [
        m.id,
        m.fullName,
        m.email,
        m.country,
        m.membershipType,
        m.status,
        m.joinedAt,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "efsw-members.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    logActivity("Exported members", `${members.length} records`, "neutral");
    notify("CSV downloaded");
  }, [members, logActivity, notify]);

  // Content actions
  const handleSaveContent = useCallback(
    async (item: AdminContentItem) => {
      const isNew = !item.id || !content.some((c) => c.id === item.id);
      const updatedList = await saveAdminContentRemote(item);
      setContent(updatedList);
      setIsContentModalOpen(false);
      setContentEditorItem(null);
      logActivity(isNew ? "Created content" : "Updated content", item.title, "success");
      notify("Content saved");
    },
    [content, logActivity, notify]
  );

  const handleSaveContentCategories = useCallback(async (categories: AdminContentCategory[]) => {
    const updated = await saveAdminCategories(categories);
    setContentCategories(updated);
    logActivity("Updated content filter modes", `${updated.filter((category) => category.kind === "news").length} news modes`, "success");
    notify("News filter modes saved");
  }, [logActivity, notify]);

  const handleDeleteContent = useCallback(
    (id: string) => {
      const item = content.find((c) => c.id === id);
      setConfirmDelete({
        isOpen: true,
        title: "Confirm content deletion",
        description: `Delete "${item?.title || id}" from the system?`,
        onConfirm: async () => {
          try {
            const updated = await deleteAdminContentRemote(id);
            setContent(updated);
            setIsContentModalOpen(false);
            setContentEditorItem(null);
            setConfirmDelete(null);
            logActivity("Deleted content", item?.title || id, "warning");
            notify("Content deleted");
          } catch (error) {
            notify(`Delete failed: ${error instanceof Error ? error.message : "Please try again"}`);
            throw error;
          }
        },
      });
    },
    [content, logActivity, notify]
  );

  const handleToggleContentStatus = useCallback(
    async (item: AdminContentItem) => {
      const nextStatus = item.status === "published" ? "draft" : "published";
      const updated: AdminContentItem = {
        ...item,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      try {
        const updatedList = await saveAdminContentRemote(updated);
        setContent(updatedList);
        logActivity(
          nextStatus === "published" ? "Published content" : "Moved content to draft",
          item.title,
          "neutral"
        );
        notify(`Status changed to ${nextStatus === "published" ? "published" : "draft"}`);
      } catch (error) {
        notify(`Status change failed: ${error instanceof Error ? error.message : "Please try again"}`);
      }
    },
    [logActivity, notify]
  );

  // Layout actions
  const handleSaveLayout = useCallback(
    async (updatedLayout: AdminLayoutConfig) => {
      const saved = await saveAdminLayoutRemote(updatedLayout);
      setLayout(saved);
      logActivity("Saved website layout", "Hero, Leadership, Organization history & Section Visibility", "success");
      notify("Website layout saved");
    },
    [logActivity, notify]
  );

  const handleSaveLeader = useCallback(
    async (leader: AdminLeaderProfile) => {
      const isNew = !layout.deanProfiles.some((p) => p.id === leader.id);
      const nextProfiles = isNew
        ? [...layout.deanProfiles, leader]
        : layout.deanProfiles.map((p) => (p.id === leader.id ? leader : p));

      const updatedLayout: AdminLayoutConfig = {
        ...layout,
        deanProfiles: nextProfiles,
      };

      setLayout(await saveAdminLayoutRemote(updatedLayout));
      setIsLeaderModalOpen(false);
      setLeaderEditorProfile(null);
      logActivity(isNew ? "Added leader" : "Updated leader", leader.name, "success");
      notify("Leadership profile saved");
    },
    [layout, logActivity, notify]
  );

  const handleDeleteLeader = useCallback(
    (leader: AdminLeaderProfile) => {
      setConfirmDelete({
        isOpen: true,
        title: "Confirm leadership profile deletion",
        description: `Delete the profile for "${leader.name}"?`,
        onConfirm: async () => {
          const nextProfiles = layout.deanProfiles.filter((p) => p.id !== leader.id);
          const updatedLayout: AdminLayoutConfig = {
            ...layout,
            deanProfiles: nextProfiles,
          };
          setLayout(await saveAdminLayoutRemote(updatedLayout));
          setIsLeaderModalOpen(false);
          setLeaderEditorProfile(null);
          setConfirmDelete(null);
          logActivity("Deleted leader", leader.name, "warning");
          notify("Leadership profile deleted");
        },
      });
    },
    [layout, logActivity, notify]
  );

  // Settings action
  const handleSaveSettings = useCallback(
    async (updatedSettings: AdminSettings) => {
      await saveAdminSettingsRemote(updatedSettings);
      setSettings(updatedSettings);
      logActivity("Saved system settings", "Organization & Email Preferences", "success");
      notify("System settings saved");
    },
    [logActivity, notify]
  );

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/admin/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error("Unable to end server session");
      logoutAdmin();
      logoutMember();
      window.location.replace("/admin/login");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Sign out failed");
    }
  };

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <p className="text-xs font-semibold text-text-muted">Loading admin control centre...</p>
        </div>
      </main>
    );
  }

  const activeView = canAccessAdminView(session.role, view) ? view : defaultAdminView(session.role);
  const selectView = (next: AdminView) => { if (canAccessAdminView(session.role, next)) setView(next); };
  const canDeleteMembers = session.role === "admin" || session.role === "super-admin";
  const pendingMembersCount = members.filter((m) => m.status === "pending").length;
  const draftContentCount = content.filter((c) => c.status === "draft").length;

  return (
    <div className="admin-shell">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <span className="toast-indicator" />
          <span>{toast}</span>
        </div>
      )}

      {/* CSS Grid Layout: Sidebar + Main */}
      <div className="admin-layout">
        {/* Collapsible Sidebar */}
        <AdminSidebar
          currentView={activeView}
          onSelectView={selectView}
          session={session}
          pendingMembersCount={settings.reviewNotifications ? pendingMembersCount : 0}
          draftContentCount={draftContentCount}
          onSignOut={handleSignOut}
          mobileNavOpen={mobileNavOpen}
          onCloseMobileNav={() => setMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="admin-main">
          <AdminTopbar
            currentView={activeView}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="admin-content">
          {activeView === "overview" && (
            <AdminOverviewView
              members={members}
              content={content}
              activity={activity}
              onNavigate={selectView}
              onOpenNewContent={() => {
                setContentEditorItem(null);
                setIsContentModalOpen(true);
              }}
            />
          )}

          {activeView === "analytics" && (
            <AnalyticsDashboard />
          )}

          {activeView === "academic-analytics" && (
            <AdminAcademicAnalyticsView />
          )}

          {activeView === "members" && (
            <AdminMembersView
              members={members}
              onOpenMember={setSelectedMember}
              onUpdateStatus={(m, s) => { void handleUpdateMemberStatus(m.id, s).catch(() => {}); }}
              onRefresh={refreshMembers}
              canDelete={canDeleteMembers}
              onExportCsv={handleExportMembersCsv}
            />
          )}

          {activeView === "content" && (
            <AdminContentView
              content={content}
              contentCategories={contentCategories}
              onSaveCategories={handleSaveContentCategories}
              onOpenEditor={(item) => {
                setContentEditorItem(item);
                setIsContentModalOpen(true);
              }}
              onOpenDelete={(item) => handleDeleteContent(item.id)}
              onToggleStatus={handleToggleContentStatus}
              onAddNew={() => {
                setContentEditorItem(null);
                setIsContentModalOpen(true);
              }}
            />
          )}

          {activeView === "layout" && (
            <AdminLayoutView
              layout={layout}
              onSaveLayout={handleSaveLayout}
              onOpenLeaderEditor={(leader) => {
                setLeaderEditorProfile(leader || null);
                setIsLeaderModalOpen(true);
              }}
              onDeleteLeader={handleDeleteLeader}
            />
          )}

          {activeView === "broadcast" && (
            <AdminBroadcastView
              content={content}
              members={members}
            />
          )}

          {activeView === "messages" && (
            <AdminMessagesView members={members} />
          )}

          {activeView === "moderation" && (
            <MessageModeration
              onSuspendMember={(memberId) => handleUpdateMemberStatus(memberId, "suspended")}
            />
          )}

          {activeView === "activity" && <AdminActivityView activity={activity} />}

          {activeView === "settings" && (
            <AdminSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
        </div>
      </div>

      {/* Isolated Modals & Drawers */}
      {selectedMember && <MemberDetailDrawer
        key={selectedMember.id}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onUpdateStatus={handleUpdateMemberStatus}
        onDeleteMember={canDeleteMembers ? handleDeleteMember : undefined}
      />}

      <ContentEditorModal
        initialItem={contentEditorItem}
        contentCategories={contentCategories}
        isOpen={isContentModalOpen}
        onClose={() => {
          setIsContentModalOpen(false);
          setContentEditorItem(null);
        }}
        onSave={handleSaveContent}
        onDelete={handleDeleteContent}
      />

      {isLeaderModalOpen && <LeaderEditorModal
        key={leaderEditorProfile?.id || "new"}
        initialLeader={leaderEditorProfile}
        isOpen={isLeaderModalOpen}
        onClose={() => {
          setIsLeaderModalOpen(false);
          setLeaderEditorProfile(null);
        }}
        onSave={handleSaveLeader}
        onDelete={handleDeleteLeader}
      />}

      {confirmDelete && (
        <ConfirmDeleteDialog
          isOpen={confirmDelete.isOpen}
          title={confirmDelete.title}
          description={confirmDelete.description}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
