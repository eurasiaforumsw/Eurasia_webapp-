"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, logoutAdmin, AdminSession } from "@/lib/admin-auth";
import {
  AdminActivity,
  AdminContentItem,
  AdminContentCategory,
  AdminLeaderProfile,
  AdminLayoutConfig,
  AdminMember,
  AdminSettings,
  defaultLayoutConfig,
  deleteAdminContent,
  deleteAdminMember,
  getAdminActivity,
  getAdminContent,
  getAdminContentCategories,
  getAdminLayout,
  getAdminMembers,
  getAdminSettings,
  recordAdminActivity,
  saveAdminContent,
  saveAdminContentCategories,
  saveAdminLayout,
  saveAdminSettings,
  setAdminMemberStatus,
} from "@/lib/admin-data";
import { AdminSidebar, AdminView } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewView } from "@/components/admin/views/AdminOverviewView";
import { AdminMembersView } from "@/components/admin/views/AdminMembersView";
import { AdminContentView } from "@/components/admin/views/AdminContentView";
import { AdminLayoutView } from "@/components/admin/views/AdminLayoutView";
import { AdminActivityView } from "@/components/admin/views/AdminActivityView";
import { AdminSettingsView } from "@/components/admin/views/AdminSettingsView";
import { MemberDetailDrawer } from "@/components/admin/modals/MemberDetailDrawer";
import { ContentEditorModal } from "@/components/admin/modals/ContentEditorModal";
import { LeaderEditorModal } from "@/components/admin/modals/LeaderEditorModal";
import { ConfirmDeleteDialog } from "@/components/admin/modals/ConfirmDeleteDialog";

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

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
    const current = getAdminSession();
    if (!current) {
      window.location.replace("/admin/login");
      return;
    }
    setSession(current);
    setMembers(getAdminMembers());
    setContent(getAdminContent());
    setContentCategories(getAdminContentCategories());
    setActivity(getAdminActivity());
    setSettings(getAdminSettings());
    setLayout(getAdminLayout());
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
    (item: AdminContentItem) => {
      const isNew = !item.id || !content.some((c) => c.id === item.id);
      const updatedList = saveAdminContent(item);
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
        onConfirm: () => {
          const updated = deleteAdminContent(id);
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
    (item: AdminContentItem) => {
      const nextStatus = item.status === "published" ? "draft" : "published";
      const updated: AdminContentItem = {
        ...item,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      const updatedList = saveAdminContent(updated);
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
    (updatedLayout: AdminLayoutConfig) => {
      saveAdminLayout(updatedLayout);
      setLayout(updatedLayout);
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

      saveAdminLayout(updatedLayout);
      setLayout(updatedLayout);
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
          saveAdminLayout(updatedLayout);
          setLayout(updatedLayout);
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

  const handleSignOut = () => {
    logoutAdmin();
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
    <div className="flex min-h-screen bg-surface-deep text-text-primary">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-teal/40 bg-surface-raised/95 px-5 py-3 text-xs font-bold text-teal-light shadow-2xl backdrop-blur-md animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modular Sidebar */}
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
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          currentView={view}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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

          {view === "activity" && <AdminActivityView activity={activity} />}

          {view === "settings" && (
            <AdminSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
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
