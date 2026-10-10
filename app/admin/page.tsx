"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/styles/admin-layout.css";
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
  deleteAdminMember,
  getAdminActivity,
  getAdminContent,
  getAdminContentCategories,
  getAdminLayout,
  getAdminMembers,
  getAdminSettings,
  recordAdminActivity,
  saveAdminContentCategories,
  saveAdminContentRemote,
  saveAdminLayout,
  saveAdminLayoutRemote,
  syncAdminLayout,
  saveAdminSettings,
  setAdminMemberStatus,
  syncAdminContent,
} from "@/lib/admin-data";
import { AdminRole } from "@/lib/admin-auth";
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
  const router = useRouter();
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
    onConfirm: () => void;
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
        setMembers(getAdminMembers());
        setContent(getAdminContent());
        setContentCategories(getAdminContentCategories());
        setActivity(getAdminActivity());
        setSettings(getAdminSettings());
        setLayout(getAdminLayout());

        // Pull latest from Supabase in the background.
        syncAdminContent()
          .then((merged) => {
            setContent(merged);
          })
          .catch(() => {
            // Silent — local data remains available.
          });

        syncAdminLayout()
          .then((merged) => {
            setLayout(merged);
          })
          .catch(() => {
            // Silent — local data remains available.
          });
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
      recordAdminActivity({ action, detail, tone });
      setActivity(getAdminActivity());
    },
    []
  );

  // Member actions
  const handleUpdateMemberStatus = useCallback(
    (id: string, status: AdminMember["status"], reviewNote: string = "") => {
      const updated = setAdminMemberStatus(id, status, reviewNote);
      setMembers(getAdminMembers());
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(updated);
      }
      logActivity(
        status === "active"
          ? "Approve member"
          : status === "suspended"
          ? "Suspend member"
          : "Change member status",
        `ID: ${id} · ${status}`,
        status === "active" ? "success" : "warning"
      );
      notify("Member status updated");
    },
    [selectedMember, logActivity, notify]
  );

  const handleDeleteMember = useCallback(
    (id: string) => {
      const member = members.find((m) => m.id === id);
      setConfirmDelete({
        isOpen: true,
        title: "Confirm member deletion",
        description: `Delete member ${member?.fullName || id}? This cannot be undone.`,
        onConfirm: () => {
          setMembers(deleteAdminMember(id));
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
      const updatedList = await saveAdminContentRemote(item, (errorMsg) => {
        notify(`Database error: ${errorMsg}`);
      });
      setContent(updatedList);
      setIsContentModalOpen(false);
      setContentEditorItem(null);
      logActivity(isNew ? "Created content" : "Updated content", item.title, "success");
      notify("Content saved");
    },
    [content, logActivity, notify]
  );

  const handleSaveContentCategories = useCallback((categories: AdminContentCategory[]) => {
    const updated = saveAdminContentCategories(categories);
    setContentCategories(updated);
    setContent(getAdminContent());
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
          const updated = await deleteAdminContentRemote(id, (errorMsg) => {
            notify(`Database error: ${errorMsg}`);
          });
          setContent(updated);
          setIsContentModalOpen(false);
          setContentEditorItem(null);
          setConfirmDelete(null);
          logActivity("Deleted content", item?.title || id, "warning");
          notify("Content deleted");
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
      const updatedList = await saveAdminContentRemote(updated, (errorMsg) => {
        notify(`Database error: ${errorMsg}`);
      });
      setContent(updatedList);
      logActivity(
        nextStatus === "published" ? "Published content" : "Moved content to draft",
        item.title,
        "neutral"
      );
      notify(`Status changed to ${nextStatus === "published" ? "published" : "draft"}`);
    },
    [logActivity, notify]
  );

  // Layout actions
  const handleSaveLayout = useCallback(
    async (updatedLayout: AdminLayoutConfig) => {
      setLayout(updatedLayout);
      await saveAdminLayoutRemote(updatedLayout, (errorMsg) => {
        notify(`Database error: ${errorMsg}`);
      });
      logActivity("Saved website layout", "Hero, Leadership, Organization history & Section Visibility", "success");
      notify("Website layout saved");
    },
    [logActivity, notify]
  );

  const handleSaveLeader = useCallback(
    (leader: AdminLeaderProfile) => {
      const isNew = !layout.deanProfiles.some((p) => p.id === leader.id);
      const nextProfiles = isNew
        ? [...layout.deanProfiles, leader]
        : layout.deanProfiles.map((p) => (p.id === leader.id ? leader : p));

      const updatedLayout: AdminLayoutConfig = {
        ...layout,
        deanProfiles: nextProfiles,
      };

      setLayout(updatedLayout);
      saveAdminLayoutRemote(updatedLayout, (errorMsg) => {
        notify(`Database error: ${errorMsg}`);
      });
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
        onConfirm: () => {
          const nextProfiles = layout.deanProfiles.filter((p) => p.id !== leader.id);
          const updatedLayout: AdminLayoutConfig = {
            ...layout,
            deanProfiles: nextProfiles,
          };
          setLayout(updatedLayout);
          saveAdminLayoutRemote(updatedLayout, (errorMsg) => {
            notify(`Database error: ${errorMsg}`);
          });
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
    (updatedSettings: AdminSettings) => {
      saveAdminSettings(updatedSettings);
      setSettings(updatedSettings);
      logActivity("Saved system settings", "Organization & Email Preferences", "success");
      notify("System settings saved");
    },
    [logActivity, notify]
  );

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue to logout even if request fails
    }
    router.push("/admin/login");
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
          currentView={view}
          onSelectView={setView}
          session={session}
          pendingMembersCount={pendingMembersCount}
          draftContentCount={draftContentCount}
          onSignOut={handleSignOut}
          mobileNavOpen={mobileNavOpen}
          onCloseMobileNav={() => setMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="admin-main">
          <AdminTopbar
            currentView={view}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="admin-content">
          {view === "overview" && (
            <AdminOverviewView
              members={members}
              content={content}
              activity={activity}
              onNavigate={setView}
              onOpenNewContent={() => {
                setContentEditorItem(null);
                setIsContentModalOpen(true);
              }}
            />
          )}

          {view === "analytics" && (
            <AnalyticsDashboard />
          )}

          {view === "members" && (
            <AdminMembersView
              members={members}
              onOpenMember={setSelectedMember}
              onUpdateStatus={(m, s) => handleUpdateMemberStatus(m.id, s)}
              onExportCsv={handleExportMembersCsv}
            />
          )}

          {view === "content" && (
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

          {view === "layout" && (
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

          {view === "broadcast" && (
            <AdminBroadcastView
              content={content}
              members={members}
            />
          )}

          {view === "messages" && (
            <AdminMessagesView members={members} />
          )}

          {view === "activity" && <AdminActivityView activity={activity} />}

          {view === "settings" && (
            <AdminSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
        </div>
      </div>

      {/* Isolated Modals & Drawers */}
      <MemberDetailDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onUpdateStatus={handleUpdateMemberStatus}
        onDeleteMember={handleDeleteMember}
      />

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

      <LeaderEditorModal
        initialLeader={leaderEditorProfile}
        isOpen={isLeaderModalOpen}
        onClose={() => {
          setIsLeaderModalOpen(false);
          setLeaderEditorProfile(null);
        }}
        onSave={handleSaveLeader}
        onDelete={handleDeleteLeader}
      />

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
