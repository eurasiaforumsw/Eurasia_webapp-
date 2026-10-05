"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { logoutMember, updateMember } from "@/lib/member-auth";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileEdit, Draft } from "@/hooks/useProfileEdit";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { ProfileHeader } from "@/components/member/ProfileHeader";
import { ProfileInterests } from "@/components/member/ProfileInterests";
import { ProfileSettings } from "@/components/member/ProfileSettings";
import { AvatarEditor } from "@/components/member/AvatarEditor";

/**
 * Member Profile Page (Refactored)
 *
 * Original: 1,204 lines monolithic component
 * Refactored: ~200 lines orchestrator + 4 sub-components + 3 hooks
 *
 * Structure:
 * - Custom hooks for state management (useProfileData, useProfileEdit, useAvatarUpload)
 * - ProfileHeader: Avatar, name, badges, completion
 * - ProfileInterests: Location, education, practice, targets, bio
 * - ProfileSettings: Account info, logout, danger zone
 * - AvatarEditor: Upload, crop, zoom modal
 */

export default function MemberProfilePage() {
  const router = useRouter();

  // Data fetching & syncing
  const { member, loading, error, refresh } = useProfileData();

  // Edit state management
  const {
    editingSection,
    draft,
    saving,
    saveError,
    startEditing,
    cancelEditing,
    updateDraft,
    saveSection,
  } = useProfileEdit(member);

  // Avatar upload & crop
  const {
    uploading: avatarUploading,
    error: avatarError,
    avatarSettings,
    editorOpen,
    openEditor,
    closeEditor,
    handleFileSelect,
    updateSettings: updateAvatarSettings,
    saveAvatar,
  } = useAvatarUpload();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !member) {
      router.push("/member/login");
    }
  }, [loading, member, router]);

  // Profile completion percentage
  const completion = useMemo(() => {
    if (!draft) return 0;
    const checks = [
      Boolean(draft.firstName.trim()),
      Boolean(draft.lastName.trim()),
      Boolean(draft.country.trim()),
      Boolean(draft.avatar?.src),
      Boolean(draft.educationLevel),
      Boolean(draft.experienceYears.trim()),
      draft.targetGroups.length > 0,
      Boolean(draft.bio.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  // Handle avatar save
  const handleAvatarSave = async () => {
    const savedAvatar = await saveAvatar();
    if (savedAvatar) {
      updateDraft({ avatar: savedAvatar });

      // Save to member profile
      if (member) {
        updateMember({
          avatarUrl: savedAvatar.src,
        });

        refresh();
        closeEditor();
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutMember();
    router.push("/member/login");
  };

  // Handle section save with error handling
  const handleSaveSection = async (section: Parameters<typeof saveSection>[0]) => {
    const success = await saveSection(section);
    if (success) {
      refresh(); // Refresh data after save
    }
    return success;
  };

  // Loading state
  if (loading) {
    return (
      <main className="efsw-profile">
        <div className="efsw-profile__loading">
          <div className="efsw-profile__spinner" />
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !member || !draft) {
    return (
      <main className="efsw-profile">
        <div className="efsw-profile__error">
          <h1>Unable to load profile</h1>
          <p>{error || "Please try signing in again."}</p>
          <button
            onClick={() => router.push("/member/login")}
            className="efsw-profile__btn efsw-profile__btn--primary"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="efsw-profile">
      {/* Profile Header */}
      <ProfileHeader
        member={member}
        completion={completion}
        avatar={draft.avatar}
        onEditAvatar={openEditor}
      />

      {/* Navigation Tabs */}
      <nav className="efsw-profile__tabs">
        <button type="button" className="efsw-profile__tab is-active">
          Profile
        </button>
        <button type="button" className="efsw-profile__tab">
          Activity
        </button>
        <button type="button" className="efsw-profile__tab">
          Settings
        </button>
      </nav>

      {/* Save Status Feedback */}
      {saveError && (
        <div className="efsw-profile__alert efsw-profile__alert--error">
          {saveError}
        </div>
      )}

      {/* Profile Interests Sections */}
      <ProfileInterests
        member={member}
        draft={draft}
        editingSection={editingSection}
        saving={saving}
        onStartEdit={startEditing}
        onSave={handleSaveSection}
        onCancel={cancelEditing}
        onUpdateDraft={updateDraft}
      />

      {/* Settings Section */}
      <ProfileSettings member={member} onLogout={handleLogout} />

      {/* Avatar Editor Modal */}
      {editorOpen && (
        <AvatarEditor
          avatar={avatarSettings}
          uploading={avatarUploading}
          error={avatarError}
          onFileSelect={handleFileSelect}
          onUpdateSettings={updateAvatarSettings}
          onSave={handleAvatarSave}
          onCancel={closeEditor}
        />
      )}

      {/* Profile Completion Prompt */}
      {completion < 100 && (
        <div className="efsw-profile__completion-prompt">
          <h3>Complete your profile</h3>
          <p>
            Your profile is {completion}% complete. A complete profile helps you connect
            with other members and access all forum features.
          </p>
          <div className="efsw-profile__completion-bar">
            <div
              className="efsw-profile__completion-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
