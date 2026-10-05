"use client";

import { ChangeEvent, FormEvent, memo, useState } from "react";
import {
  Layout,
  Layers,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
  UploadCloud,
  Image as ImageIcon,
  Film,
  Play,
} from "lucide-react";
import { AdminBoardMember, AdminHeroScene, AdminHistoryItem, AdminLayoutConfig, AdminLeaderProfile, AdminPartnerLogo } from "@/lib/admin-data";
import { uploadMediaToR2 } from "@/lib/admin-data";
import { BoardMemberEditorModal } from "@/components/admin/modals/BoardMemberEditorModal";
import { ConfirmDeleteDialog } from "@/components/admin/modals/ConfirmDeleteDialog";
import { HeroSceneEditor } from "@/components/admin/views/HeroSceneEditor";

export type LayoutTab =
  | "hero"
  | "dean"
  | "board"
  | "history"
  | "partners"
  | "homeSections"
  | "footer"
  | "organization"
  | "library"
  | "sections";

interface AdminLayoutViewProps {
  layout: AdminLayoutConfig;
  onSaveLayout: (updatedLayout: AdminLayoutConfig) => void;
  onOpenLeaderEditor: (leader?: AdminLeaderProfile) => void;
  onDeleteLeader: (leader: AdminLeaderProfile) => void;
}

export const AdminLayoutView = memo(function AdminLayoutView({
  layout,
  onSaveLayout,
  onOpenLeaderEditor,
  onDeleteLeader,
}: AdminLayoutViewProps) {
  const [activeTab, setActiveTab] = useState<LayoutTab>("hero");
  const [formData, setFormData] = useState<AdminLayoutConfig>({
    ...layout,
    heroScenes: layout.heroScenes ?? [],
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [boardEditorMember, setBoardEditorMember] = useState<AdminBoardMember | null>(null);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [boardDeleteMember, setBoardDeleteMember] = useState<AdminBoardMember | null>(null);
  const [historyCompressingId, setHistoryCompressingId] = useState<string | null>(null);

  // ── Hero scene helpers ───────────────────────────────────
  const addHeroScene = () => {
    const scenes = formData.heroScenes ?? [];
    const id = `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setFormData((prev) => ({
      ...prev,
      heroScenes: [
        ...(prev.heroScenes ?? []),
        { id, kind: "image", url: "", durationSec: 5, order: scenes.length } as AdminHeroScene,
      ],
    }));
  };

  const updateHeroScene = (index: number, next: AdminHeroScene) => {
    setFormData((prev) => {
      const list = [...(prev.heroScenes ?? [])];
      list[index] = next;
      return { ...prev, heroScenes: list };
    });
  };

  const removeHeroScene = (index: number) => {
    setFormData((prev) => {
      const list = (prev.heroScenes ?? []).filter((_, i) => i !== index);
      // Re-order after removal
      return { ...prev, heroScenes: list.map((s, i) => ({ ...s, order: i })) };
    });
  };

  const moveHeroScene = (from: number, to: number) => {
    setFormData((prev) => {
      const list = [...(prev.heroScenes ?? [])];
      if (to < 0 || to >= list.length) return prev;
      const [picked] = list.splice(from, 1);
      list.splice(to, 0, picked);
      return { ...prev, heroScenes: list.map((s, i) => ({ ...s, order: i })) };
    });
  };
  /* Partner logos local editor state */
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoEditing, setLogoEditing] = useState<AdminPartnerLogo | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const openLogoEditor = (logo?: AdminPartnerLogo) => {
    setLogoEditing(
      logo ?? {
        id: `partner-${Date.now()}`,
        name: "",
        logoUrl: "",
        websiteUrl: "",
        order: (formData.partnerLogos?.length ?? 0) + 1,
        displaySize: formData.partnerLogos?.find((p) => p.displaySize !== undefined)?.displaySize ?? 200,
      }
    );
    setLogoEditorOpen(true);
  };

  const saveLogo = (logo: AdminPartnerLogo) => {
    setFormData((prev) => {
      const existing = prev.partnerLogos || [];
      const found = existing.some((item) => item.id === logo.id);
      const next = found
        ? existing.map((item) => (item.id === logo.id ? logo : item))
        : [...existing, logo];
      return {
        ...prev,
        partnerLogos: next
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((item, index) => ({ ...item, order: index + 1 })),
      };
    });
    setLogoEditorOpen(false);
    setLogoEditing(null);
  };

  /* Upload a partner-logo file to R2, then patch the in-flight `logoEditing`
     draft with the resulting URL + asset summary fields. Mirrors the history
     upload pattern (sizeBytes / mimeType / uploadedAt). */
  const handleLogoFileUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const result = await uploadMediaToR2(file);
      setLogoEditing((prev) =>
        prev
          ? {
              ...prev,
              logoUrl: result.url,
              sizeBytes: result.sizeBytes ?? file.size,
              mimeType: result.mimeType ?? file.type,
              uploadedAt: new Date().toISOString(),
            }
          : prev,
      );
    } catch (err) {
      console.error("Partner logo upload failed:", err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const deleteLogo = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      partnerLogos: (prev.partnerLogos || [])
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, order: index + 1 })),
    }));
  };

  const moveLogo = (id: string, direction: -1 | 1) => {
    setFormData((prev) => {
      const list = (prev.partnerLogos || []).slice().sort((a, b) => a.order - b.order);
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return {
        ...prev,
        partnerLogos: list.map((item, i) => ({ ...item, order: i + 1 })),
      };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveLayout(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleSection = (key: keyof AdminLayoutConfig["sectionVisibility"]) => {
    setFormData((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [key]: !prev.sectionVisibility[key],
      },
    }));
  };

  /* Scalar setter used by the Home sections + Footer tabs. */
  const update = <K extends keyof AdminLayoutConfig>(key: K, value: AdminLayoutConfig[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* Array helpers for the Organization tab (branches). */
  const updateBranch = (id: string, patch: Partial<AdminLayoutConfig["orgPageBranches"][number]>) =>
    update(
      "orgPageBranches",
      formData.orgPageBranches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  const updateLibraryCategory = (id: string, patch: Partial<AdminLayoutConfig["libraryCategories"][number]>) =>
    update(
      "libraryCategories",
      formData.libraryCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub Tabs */}
      <nav className="efsw-admin-layout-tabs">
        {(
          [
            { id: "hero", label: "Banner & Hero Section" },
            { id: "dean", label: `Leadership (${formData.deanProfiles.length})` },
            { id: "board", label: `Executive Board (${formData.boardMembers.length})` },
            { id: "history", label: `Organization history (${formData.historyItems.length})` },
            { id: "partners", label: `Partner logos (${formData.partnerLogos?.length ?? 0})` },
            { id: "homeSections", label: "Home sections" },
            { id: "footer", label: "Footer" },
            { id: "organization", label: `Org page (${formData.orgPageBranches?.length ?? 0})` },
            { id: "library", label: `Library categories (${formData.libraryCategories?.length ?? 0})` },
            { id: "sections", label: "Section visibility" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="efsw-admin-layout-tabs__item"
            data-active={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: Hero Settings — multi-scene carousel */}
        {activeTab === "hero" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {/* ── Scene carousel ─────────────────────────────── */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <div>
                  <span className="efsw-admin-eyebrow">Banner & hero carousel</span>
                  <h2>Hero scenes</h2>
                  <p style={{ margin: "0.4rem 0 0", color: "var(--admin-muted)", fontSize: "0.72rem", maxWidth: "45rem", lineHeight: 1.5 }}>
                    Each scene plays in order at the top of the home page. Image scenes stay on screen for the configured number of seconds; video scenes play through to their natural end before advancing. Upload directly to Cloudflare R2 or paste a hosted URL — file size and MIME type appear in the asset summary for every uploaded scene.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHeroScene}
                  className="efsw-admin-text-action"
                  style={{
                    padding: "0.55rem 1.1rem",
                    border: "1px solid var(--admin-ink)",
                    background: "var(--admin-ink)",
                    color: "var(--admin-surface)",
                    fontSize: "0.74rem",
                    borderRadius: "999px",
                  }}
                >
                  <Plus size={13} /> Add scene
                </button>
              </header>

              {/* Summary chips: scene count, image vs video breakdown */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.55rem",
                  padding: "0.85rem 1.35rem",
                  borderBottom: "1px solid var(--admin-line)",
                  background: "var(--admin-surface-deep)",
                }}
              >
                <SummaryChip icon={<Film size={12} />} label="Scenes" value={formData.heroScenes?.length ?? 0} />
                <SummaryChip
                  icon={<ImageIcon size={12} />}
                  label="Image scenes"
                  value={(formData.heroScenes ?? []).filter((s) => s.kind === "image").length}
                />
                <SummaryChip
                  icon={<Film size={12} />}
                  label="Video scenes"
                  value={(formData.heroScenes ?? []).filter((s) => s.kind === "video").length}
                />
                <SummaryChip
                  icon={<UploadCloud size={12} />}
                  label="Total size"
                  value={formatTotalBytes(
                    (formData.heroScenes ?? []).reduce((sum, s) => sum + (s.sizeBytes ?? 0), 0)
                  )}
                />
              </div>

              {/* Scene list */}
              <div style={{ display: "grid", gap: "0.7rem", padding: "1rem 1.35rem 1.25rem" }}>
                {(formData.heroScenes ?? []).length === 0 ? (
                  <div className="efsw-admin-empty">
                    <ImageIcon size={22} />
                    <h2>No scenes yet</h2>
                    <p>Add the first scene to launch the hero carousel on the public site.</p>
                    <button
                      type="button"
                      onClick={addHeroScene}
                      className="efsw-admin-text-action"
                      style={{ color: "var(--admin-green)", fontSize: "0.74rem", marginTop: "0.4rem" }}
                    >
                      <Plus size={12} /> Add the first scene
                    </button>
                  </div>
                ) : (
                  (formData.heroScenes ?? []).map((scene, index) => (
                    <HeroSceneEditor
                      key={scene.id}
                      scene={scene}
                      index={index}
                      total={(formData.heroScenes ?? []).length}
                      onChange={(next) => updateHeroScene(index, next)}
                      onRemove={() => removeHeroScene(index)}
                      onMoveUp={() => moveHeroScene(index, index - 1)}
                      onMoveDown={() => moveHeroScene(index, index + 1)}
                    />
                  ))
                )}
              </div>
            </section>

            {/* ── Global hero copy ───────────────────────────── */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <div>
                  <span className="efsw-admin-eyebrow">Global overlay copy</span>
                  <h2>Headline, tagline & CTA</h2>
                  <p style={{ margin: "0.4rem 0 0", color: "var(--admin-muted)", fontSize: "0.72rem", maxWidth: "45rem" }}>
                    Used by every scene unless it has its own per-scene headline or CTA in the collapsible above.
                  </p>
                </div>
              </header>
              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  padding: "1rem 1.35rem",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <label style={{ display: "grid", gap: "0.3rem", gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Main headline</span>
                  <input
                    type="text"
                    value={formData.heroHeadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroHeadline: e.target.value }))}
                    style={inputStyle}
                    placeholder="Where social work finds its regional voice."
                  />
                </label>

                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Tagline</span>
                  <input
                    type="text"
                    value={formData.heroTagline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroTagline: e.target.value }))}
                    style={inputStyle}
                    placeholder="International social work across Eurasia"
                  />
                </label>

                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Supporting copy</span>
                  <textarea
                    rows={2}
                    value={formData.heroSubheadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroSubheadline: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="The Eurasia Forum for Social Workers connects…"
                  />
                </label>

                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>CTA button label</span>
                  <input
                    type="text"
                    value={formData.heroCtaText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroCtaText: e.target.value }))}
                    style={inputStyle}
                    placeholder="Join the Network"
                  />
                </label>

                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>CTA target link</span>
                  <input
                    type="text"
                    value={formData.heroCtaLink}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroCtaLink: e.target.value }))}
                    style={inputStyle}
                    placeholder="/member"
                  />
                </label>
              </div>
            </section>

            {/* ── Announcement banner (optional) ──────────────── */}
            <section
              className="efsw-admin-panel"
              style={{
                border: "1px solid color-mix(in oklch, var(--admin-green) 35%, var(--admin-line))",
                background: "color-mix(in oklch, var(--admin-green) 5%, var(--admin-surface))",
              }}
            >
              <header className="efsw-admin-panel__head">
                <div>
                  <span className="efsw-admin-eyebrow" style={{ color: "var(--admin-green)" }}>
                    Announcement banner (optional)
                  </span>
                  <h2 style={{ fontSize: "1.2rem" }}>Switch the hero to announcement mode</h2>
                  <p style={{ margin: "0.4rem 0 0", color: "var(--admin-muted)", fontSize: "0.72rem", maxWidth: "45rem", lineHeight: 1.5 }}>
                    When you set an announcement title, the hero shows this message with a "More details" link on top of the rotating scenes — useful for promoting summits or registration windows.
                  </p>
                </div>
              </header>
              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  padding: "1rem 1.35rem 1.2rem",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Announcement title</span>
                  <input
                    type="text"
                    value={formData.heroAnnouncementTitle || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroAnnouncementTitle: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. EFSW Regional Summit 2026 — registration opens"
                  />
                </label>
                <label style={{ display: "grid", gap: "0.3rem" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Link label</span>
                  <input
                    type="text"
                    value={formData.heroAnnouncementLinkLabel || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroAnnouncementLinkLabel: e.target.value }))}
                    style={inputStyle}
                    placeholder="More details"
                  />
                </label>
                <label style={{ display: "grid", gap: "0.3rem", gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Summary (optional)</span>
                  <textarea
                    rows={2}
                    value={formData.heroAnnouncementSummary || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroAnnouncementSummary: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="One or two lines of supporting detail…"
                  />
                </label>
                <label style={{ display: "grid", gap: "0.3rem", gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem", fontWeight: 750 }}>Detail link</span>
                  <input
                    type="text"
                    value={formData.heroAnnouncementLink || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, heroAnnouncementLink: e.target.value }))}
                    style={inputStyle}
                    placeholder="/events/event-summit-2026 or /news/some-story"
                  />
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Leadership / Dean Messages */}
        {activeTab === "dean" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-text-primary">
                  Executive leadership profiles
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Portraits, quotes, and specialisations shown in the leadership section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenLeaderEditor()}
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-vivid transition-all"
              >
                <Plus size={15} />
                <span>Add leader</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formData.deanProfiles.map((leader, index) => (
                <div
                  key={leader.id}
                  className="flex flex-col justify-between rounded-xl border border-surface-subtle bg-surface-base p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface-raised border border-surface-subtle">
                      {leader.portrait ? (
                        <img
                          src={leader.portrait}
                          alt={leader.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-muted">
                          <UserCheck size={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate">
                        {leader.name}
                      </div>
                      <div className="text-[11px] text-text-muted truncate mt-0.5">
                        {leader.title}
                      </div>
                      <span className="mt-1 inline-block rounded bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal-light">
                        Position: {leader.textPosition}
                      </span>
                    </div>
                  </div>

                  <blockquote className="text-[11px] text-text-secondary italic line-clamp-3 mb-3 border-l-2 border-teal pl-2">
                    &ldquo;{leader.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center justify-end gap-2 border-t border-surface-subtle pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenLeaderEditor(leader)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:border-teal hover:text-teal"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLeader(leader)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:border-red-500 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Executive board */}
        {activeTab === "board" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-text-primary">Executive Board</h3>
                <p className="mt-0.5 text-xs text-text-muted">Manage names, titles, countries, and portraits shown on the Organization page.</p>
              </div>
              <button
                type="button"
                onClick={() => { setBoardEditorMember(null); setIsBoardEditorOpen(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-vivid"
              >
                <Plus size={15} />
                <span>Add board member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formData.boardMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl border border-surface-subtle bg-surface-base p-3">
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-surface-subtle bg-surface-raised">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted"><UserCheck size={18} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-text-primary">{member.name}</div>
                    <div className="mt-0.5 truncate text-[11px] text-text-muted">{member.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-teal-light">{member.country}</div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setBoardEditorMember(member); setIsBoardEditorOpen(true); }} aria-label={`Edit ${member.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:border-teal hover:text-teal"><Edit3 size={13} /></button>
                    <button type="button" onClick={() => setBoardDeleteMember(member)} aria-label={`Delete ${member.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:border-red-500 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-text-primary">Organization history</h3>
                <p className="mt-0.5 text-xs text-text-muted">Add confirmed CE milestones, descriptions, and an optional supporting image for the public timeline.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const item: AdminHistoryItem = { id: `history-${Date.now().toString(36)}`, year: new Date().getFullYear(), title: "", description: "", isCurrent: false };
                  setFormData((prev) => ({ ...prev, historyItems: [...prev.historyItems, item] }));
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-vivid"
              >
                <Plus size={15} />
                <span>Add milestone</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-surface-subtle pb-6 md:grid-cols-2">
              <label className="text-xs font-bold text-text-secondary">Our story heading
                <input
                  type="text"
                  required
                  value={formData.historySectionTitle}
                  onChange={(event) => setFormData((prev) => ({ ...prev, historySectionTitle: event.target.value }))}
                  placeholder="Built through shared work."
                  className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none"
                />
              </label>
              <label className="text-xs font-bold text-text-secondary">Our story introduction
                <textarea
                  rows={3}
                  required
                  value={formData.historySectionIntro}
                  onChange={(event) => setFormData((prev) => ({ ...prev, historySectionIntro: event.target.value }))}
                  placeholder="Follow the milestones that have shaped EFSW..."
                  className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-base p-3 text-xs font-normal text-text-primary focus:border-teal focus:outline-none"
                />
              </label>
            </div>

            <div className="space-y-4">
              {[...formData.historyItems].sort((a, b) => a.year - b.year).map((item) => (
                <div key={item.id} className="rounded-xl border border-surface-subtle bg-surface-base p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[7rem_1fr]">
                    <label className="text-xs font-bold text-text-secondary">Year (CE)
                      <input type="number" min={1900} max={2200} required value={item.year} onChange={(event) => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, year: Number(event.target.value) || new Date().getFullYear() } : entry) }))} className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-raised px-3 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none" />
                    </label>
                    <label className="text-xs font-bold text-text-secondary">Milestone title
                      <input type="text" required value={item.title} onChange={(event) => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry) }))} placeholder="e.g. The network takes shape" className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-raised px-3 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none" />
                    </label>
                    <label className="text-xs font-bold text-text-secondary md:col-span-2">Description
                      <textarea rows={3} required value={item.description} onChange={(event) => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry) }))} placeholder="Describe the milestone in clear, concise English." className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-raised p-3 text-xs font-normal text-text-primary focus:border-teal focus:outline-none" />
                    </label>
                    <label className="text-xs font-bold text-text-secondary md:col-span-2">Image alt text
                      <input type="text" value={item.imageAlt || ""} onChange={(event) => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, imageAlt: event.target.value } : entry) }))} placeholder="Describe the image for accessibility" className="mt-1.5 w-full rounded-xl border border-surface-subtle bg-surface-raised px-3 py-2.5 text-xs font-normal text-text-primary focus:border-teal focus:outline-none" />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-surface-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary">
                      <input type="checkbox" checked={Boolean(item.isCurrent)} onChange={() => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => ({ ...entry, isCurrent: entry.id === item.id })) }))} className="h-4 w-4 accent-teal" />
                      Mark as current chapter
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-text-muted hover:border-teal hover:text-teal">
                        <input type="file" accept="image/*" className="hidden" disabled={historyCompressingId === item.id} onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setHistoryCompressingId(item.id);
                          try {
                            const result = await uploadMediaToR2(file);
                            setFormData((prev) => ({
                              ...prev,
                              historyItems: prev.historyItems.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      image: result.url,
                                      imageSizeBytes: result.sizeBytes ?? file.size,
                                      imageMimeType: result.mimeType ?? file.type,
                                      imageUploadedAt: new Date().toISOString(),
                                    }
                                  : entry
                              ),
                            }));
                          } catch (err) {
                            console.error("History image upload failed:", err);
                            alert(err instanceof Error ? err.message : "Upload failed");
                          } finally {
                            setHistoryCompressingId(null);
                          }
                        }} />
                        <UploadCloud size={14} />
                        {historyCompressingId === item.id ? "Uploading…" : item.image ? "Replace image" : "Upload image"}
                      </label>
                      {item.image && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              historyItems: prev.historyItems.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      image: "",
                                      imageSizeBytes: undefined,
                                      imageMimeType: undefined,
                                      imageUploadedAt: undefined,
                                    }
                                  : entry
                              ),
                            }))
                          }
                          className="text-xs font-bold text-text-muted hover:text-red-400"
                        >
                          Remove image
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            historyItems: prev.historyItems.filter((entry) => entry.id !== item.id),
                          }))
                        }
                        aria-label={`Delete ${item.year} milestone`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:border-red-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {item.image && (
                    <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
                      <img src={item.image} alt={item.imageAlt || ""} className="h-28 w-full rounded-xl object-cover" />
                      {item.imageSizeBytes !== undefined && item.imageMimeType && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            gap: "0.4rem 0.7rem",
                            padding: "0.55rem 0.7rem",
                            border: "1px solid var(--admin-green)",
                            background: "color-mix(in oklch, var(--admin-green) 6%, var(--admin-surface))",
                            color: "var(--admin-ink)",
                            fontSize: "0.7rem",
                            lineHeight: 1.4,
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: "var(--admin-green)" }} />
                          <strong style={{ fontSize: "0.7rem", fontWeight: 800 }}>Asset summary</strong>
                          <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Size</span>
                          <span>
                            <strong>{formatHistoryBytes(item.imageSizeBytes)}</strong>
                            {item.imageUploadedAt && (
                              <small style={{ display: "block", color: "var(--admin-muted)" }}>
                                uploaded {historyTimeAgo(item.imageUploadedAt)}
                              </small>
                            )}
                          </span>
                          <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Type</span>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                            {item.imageMimeType}
                          </span>
                          <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Storage</span>
                          <span>
                            Cloudflare R2 <code style={{ fontSize: "0.6rem" }}>{item.image.split("/").pop()}</code>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Partner logos */}
        {activeTab === "partners" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-text-primary">
                  Partner logos
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Logos shown in the scrolling partner strip below Leadership.
                  All logos are normalized to the same visual height regardless of upload size.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openLogoEditor()}
                className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-dark"
              >
                <Plus size={15} /> Add partner
              </button>
            </div>

            {/* Logo strip preview (matches public marquee styling) */}
            {(formData.partnerLogos?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-surface-subtle bg-surface-base/50 p-6">
                <div className="flex flex-wrap items-center justify-center gap-8">
                  {(formData.partnerLogos || []).map((logo) => (
                    <img
                      key={logo.id}
                      src={logo.logoUrl}
                      alt={logo.name}
                      className="h-12 max-w-[10rem] object-contain opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Global display size — applies to ALL logos so they line up */}
            {(formData.partnerLogos?.length ?? 0) > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.5rem 1rem",
                  padding: "0.8rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--admin-line-soft)",
                  background: "var(--admin-surface)",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.75rem", color: "var(--admin-ink)" }}>
                    Global logo display size
                  </strong>
                  <p style={{ fontSize: "0.65rem", color: "var(--admin-muted)", marginTop: "0.15rem" }}>
                    All partner logos in the public marquee render at the same height. Use "Apply to all" to update every logo at once.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  {([80, 100, 120, 160, 200] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        const current =
                          formData.partnerLogos?.find((p) => p.displaySize !== undefined)?.displaySize ?? 200;
                        if (current === sz) return;
                        setFormData((prev) => ({
                          ...prev,
                          partnerLogos: (prev.partnerLogos || []).map((p) => ({
                            ...p,
                            displaySize: sz,
                          })),
                        }));
                      }}
                      style={{
                        padding: "0.35rem 0.55rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--admin-line)",
                        background:
                          formData.partnerLogos?.every((p) => p.displaySize === sz)
                            ? "var(--admin-green)"
                            : "var(--admin-surface-deep)",
                        color:
                          formData.partnerLogos?.every((p) => p.displaySize === sz)
                            ? "white"
                            : "var(--admin-ink)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      aria-label={`Set all logos to ${sz}px`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editable list */}
            <div className="space-y-2">
              {(formData.partnerLogos || []).length === 0 ? (
                <p className="text-sm text-text-muted">No partners yet. Add your first partner logo above.</p>
              ) : (
                (formData.partnerLogos || []).map((logo, index) => (
                  <div
                    key={logo.id}
                    className="flex items-center gap-4 rounded-xl border border-surface-subtle bg-surface-base p-3"
                  >
                    {/* Order controls */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLogo(logo.id, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="rounded p-0.5 text-text-muted transition hover:bg-surface-raised disabled:opacity-30"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <span className="text-[10px] font-mono text-text-muted w-5 text-center">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => moveLogo(logo.id, 1)}
                        disabled={index === (formData.partnerLogos || []).length - 1}
                        aria-label="Move down"
                        className="rounded p-0.5 text-text-muted transition hover:bg-surface-raised disabled:opacity-30"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>

                    {/* Logo preview */}
                    <div className="h-10 w-14 flex items-center justify-center overflow-hidden rounded bg-white/80 border border-surface-subtle">
                      <img src={logo.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                    </div>

                    {/* Name + URL */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-text-primary">{logo.name}</div>
                      <div className="truncate text-[11px] text-text-muted">{logo.websiteUrl || "No link"}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openLogoEditor(logo)}
                        className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-surface-raised"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLogo(logo.id)}
                        aria-label={`Delete ${logo.name}`}
                        className="rounded-lg p-2 text-text-muted transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Home sections copy (about-bridge + events + news headlines) */}
        {activeTab === "homeSections" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Homepage section copy
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Edit the headlines, subtitles, and CTA labels that appear in each homepage section.
              </p>
            </div>

            {/* About bridge */}
            <section className="space-y-3">
              <header className="border-b border-surface-subtle pb-2">
                <h4 className="text-sm font-bold text-text-primary">About-bridge section</h4>
                <p className="text-xs text-text-muted mt-0.5">Appears between Leadership and Events on the homepage.</p>
              </header>
              <Field label="Title">
                <input
                  type="text"
                  value={formData.homeAboutBridgeTitle}
                  onChange={(e) => update("homeAboutBridgeTitle", e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Body">
                <textarea
                  rows={3}
                  value={formData.homeAboutBridgeBody}
                  onChange={(e) => update("homeAboutBridgeBody", e.target.value)}
                  className="form-textarea"
                />
              </Field>
              <Field label="CTA label">
                <input
                  type="text"
                  value={formData.homeAboutBridgeCtaText}
                  onChange={(e) => update("homeAboutBridgeCtaText", e.target.value)}
                  className="form-input"
                />
              </Field>
            </section>

            {/* Events */}
            <section className="space-y-3">
              <header className="border-b border-surface-subtle pb-2">
                <h4 className="text-sm font-bold text-text-primary">Events section</h4>
                <p className="text-xs text-text-muted mt-0.5">"Where the network comes together" — events list headline.</p>
              </header>
              <Field label="Title (line 1)">
                <input
                  type="text"
                  value={formData.homeEventsTitle}
                  onChange={(e) => update("homeEventsTitle", e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Title (line 2 — accent)">
                <input
                  type="text"
                  value="comes together."
                  disabled
                  className="form-input opacity-60"
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={2}
                  value={formData.homeEventsSubtitle}
                  onChange={(e) => update("homeEventsSubtitle", e.target.value)}
                  className="form-textarea"
                />
              </Field>
              <Field label="CTA label">
                <input
                  type="text"
                  value={formData.homeEventsCtaText}
                  onChange={(e) => update("homeEventsCtaText", e.target.value)}
                  className="form-input"
                />
              </Field>
            </section>

            {/* News */}
            <section className="space-y-3">
              <header className="border-b border-surface-subtle pb-2">
                <h4 className="text-sm font-bold text-text-primary">News section</h4>
                <p className="text-xs text-text-muted mt-0.5">"Stories that move the work forward" — news list headline.</p>
              </header>
              <Field label="Title (line 1)">
                <input
                  type="text"
                  value={formData.homeNewsTitle}
                  onChange={(e) => update("homeNewsTitle", e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Title (line 2 — accent)">
                <input
                  type="text"
                  value="the network forward."
                  disabled
                  className="form-input opacity-60"
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={2}
                  value={formData.homeNewsSubtitle}
                  onChange={(e) => update("homeNewsSubtitle", e.target.value)}
                  className="form-textarea"
                />
              </Field>
              <Field label="CTA label">
                <input
                  type="text"
                  value={formData.homeNewsCtaText}
                  onChange={(e) => update("homeNewsCtaText", e.target.value)}
                  className="form-input"
                />
              </Field>
            </section>
          </div>
        )}

        {/* Tab 7: Footer copy */}
        {activeTab === "footer" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Footer copy
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Edit the tagline, contact email, and copyright that appear in the dark footer band.
              </p>
            </div>

            <Field label="Tagline (under logo)">
              <input
                type="text"
                value={formData.footerTagline}
                onChange={(e) => update("footerTagline", e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Email — label">
              <input
                type="text"
                value={formData.footerEmailLabel}
                onChange={(e) => update("footerEmailLabel", e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Email address">
              <input
                type="email"
                value={formData.footerEmail}
                onChange={(e) => update("footerEmail", e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Admin console link label">
              <input
                type="text"
                value={formData.footerAdminLinkLabel}
                onChange={(e) => update("footerAdminLinkLabel", e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Copyright / bottom band">
              <input
                type="text"
                value={formData.footerCopyright}
                onChange={(e) => update("footerCopyright", e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
        )}

        {/* Tab 8: Organization page */}
        {activeTab === "organization" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Organization page content
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Edit the three organizational bodies shown on /about/organization. The member, country, document, and event figures there are calculated live from the database.
              </p>
            </div>

            {/* Branches */}
            <section className="space-y-3">
              <header className="border-b border-surface-subtle pb-2">
                <h4 className="text-sm font-bold text-text-primary">Branches ({formData.orgPageBranches.length})</h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Three pillars of the network — each has a number, locale key, and icon.
                </p>
              </header>
              {formData.orgPageBranches.map((b, idx) => (
                <div key={b.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl border border-surface-subtle">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-text-muted">Number</label>
                    <input
                      type="text"
                      value={b.num}
                      onChange={(e) => updateBranch(b.id, { num: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] uppercase tracking-wider text-text-muted">Locale key</label>
                    <input
                      type="text"
                      value={b.key}
                      onChange={(e) => updateBranch(b.id, { key: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] uppercase tracking-wider text-text-muted">Icon</label>
                    <select
                      value={b.iconName}
                      onChange={(e) => updateBranch(b.id, { iconName: e.target.value })}
                      className="form-input"
                    >
                      {["BookOpen","Globe","Users","Network","Handshake","Sparkles","GraduationCap","HeartHandshake","Calendar"].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[10px] text-text-muted">#{idx + 1}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* The working-group / reach / stage editors were removed when the
                public page stopped showing "Standing groups, shared work".
                The organization page now renders live network figures from
                the member database instead of hand-entered placeholders. */}
            <p className="text-xs text-text-muted">
              Branches above are the only editable items on this page — the
              public page now shows live member and document figures, so
              hand-entered working-group and reach numbers are no longer used.
            </p>
          </div>
        )}

        {/* Tab 9: Library categories */}
        {activeTab === "library" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Library category cards
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Edit the three category cards shown on the academic documents page. Accent color follows the value in the input.
              </p>
            </div>

            {formData.libraryCategories.map((c, idx) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl border border-surface-subtle">
                <div className="col-span-3">
                  <label className="text-[10px] uppercase tracking-wider text-text-muted">Locale key</label>
                  <input
                    type="text"
                    value={c.key}
                    onChange={(e) => updateLibraryCategory(c.id, { key: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] uppercase tracking-wider text-text-muted">Mod class</label>
                  <select
                    value={c.mod}
                    onChange={(e) => updateLibraryCategory(c.id, { mod: e.target.value })}
                    className="form-input"
                  >
                    {["research","practice","briefings"].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] uppercase tracking-wider text-text-muted">Accent (hex/oklch)</label>
                  <input
                    type="text"
                    value={c.accent}
                    onChange={(e) => updateLibraryCategory(c.id, { accent: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className="inline-block w-6 h-6 rounded border border-surface-subtle"
                    style={{ background: c.accent }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-text-muted ml-2">#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 10: Section Visibility */}
        {activeTab === "sections" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Control homepage section visibility
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Choose which homepage sections are visible.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  {
                    key: "hero",
                    label: "Hero Banner",
                    desc: "Main banner with video and primary action",
                  },
                  {
                    key: "deanMessage",
                    label: "Leadership message",
                    desc: "Leadership quotes and vision",
                  },
                  {
                    key: "about",
                    label: "About EFSW",
                    desc: "Network introduction and direction",
                  },
                  {
                    key: "news",
                    label: "Latest news",
                    desc: "Top three news and updates",
                  },
                  {
                    key: "voices",
                    label: "Featured Voices",
                    desc: "Perspectives from social workers",
                  },
                  {
                    key: "partnerLogos",
                    label: "Partner Logos",
                    desc: "Scrolling partner strip below leadership",
                  },
                  {
                    key: "membership",
                    label: "Membership Tiers",
                    desc: "Membership types and benefits",
                  },
                ] as const
              ).map((sec) => {
                const isVisible = formData.sectionVisibility[sec.key];

                return (
                  <div
                    key={sec.key}
                    onClick={() => handleToggleSection(sec.key)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isVisible
                        ? "border-teal/50 bg-teal/10 shadow-sm"
                        : "border-surface-subtle bg-surface-base/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        {isVisible ? (
                          <Eye size={14} className="text-teal-light" />
                        ) : (
                          <EyeOff size={14} className="text-text-muted" />
                        )}
                        {sec.label}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {sec.desc}
                      </div>
                    </div>

                    <div
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isVisible ? "bg-teal" : "bg-surface-subtle"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                          isVisible ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-surface-subtle pt-5">
          {savedSuccess ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Homepage layout saved</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">
              Save to apply changes to the live website.
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid transition-all"
          >
            <Save size={15} />
            <span>Save layout</span>
          </button>
        </div>
      </form>

      <BoardMemberEditorModal
        initialMember={boardEditorMember}
        isOpen={isBoardEditorOpen}
        onClose={() => { setIsBoardEditorOpen(false); setBoardEditorMember(null); }}
        onSave={(member) => {
          const boardMembers = formData.boardMembers.some((entry) => entry.id === member.id)
            ? formData.boardMembers.map((entry) => entry.id === member.id ? member : entry)
            : [...formData.boardMembers, member];
          const nextLayout = { ...formData, boardMembers };
          setFormData(nextLayout);
          onSaveLayout(nextLayout);
          setIsBoardEditorOpen(false);
          setBoardEditorMember(null);
        }}
      />

      {boardDeleteMember && (
        <ConfirmDeleteDialog
          isOpen
          title="Confirm board member deletion"
          description={`Delete \"${boardDeleteMember.name}\" from the executive board?`}
          onCancel={() => setBoardDeleteMember(null)}
          onConfirm={() => {
            const nextLayout = {
              ...formData,
              boardMembers: formData.boardMembers.filter((entry) => entry.id !== boardDeleteMember.id),
            };
            setFormData(nextLayout);
            onSaveLayout(nextLayout);
            setBoardDeleteMember(null);
          }}
        />
      )}

      {/* Partner logo editor modal */}
      {logoEditorOpen && logoEditing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setLogoEditorOpen(false); setLogoEditing(null); } }}
        >
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-surface-subtle bg-surface-base p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-text-primary">
              {formData.partnerLogos?.some((p) => p.id === logoEditing.id) ? "Edit partner" : "Add partner"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Partner name *</label>
                <input
                  type="text"
                  required
                  value={logoEditing.name}
                  onChange={(e) => setLogoEditing({ ...logoEditing, name: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:border-teal focus:outline-none"
                  placeholder="e.g. Chulalongkorn University"
                />
              </div>

              {/* ── Logo upload (drag-drop OR click) ── */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Logo file <span className="text-text-muted font-normal">(SVG, PNG, JPG, WebP — stored in R2)</span>
                </label>
                <div
                  className="rounded-lg border-2 border-dashed border-border-subtle bg-surface-raised p-4 text-center transition hover:border-teal"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      handleLogoFileUpload(file);
                    }
                  }}
                >
                  {logoEditing.logoUrl ? (
                    <div className="space-y-2">
                      {/* Mirrors the live strip: fixed HEIGHT, width follows
                          the logo's own aspect ratio. (A fixed-width box
                          here would make the preview disagree with what
                          visitors actually see.) */}
                      <div
                        className="mx-auto flex items-center overflow-x-auto rounded border border-surface-subtle bg-white"
                        style={{
                          height: `${logoEditing.displaySize ?? 200}px`,
                          maxWidth: "100%",
                        }}
                      >
                        <img
                          src={logoEditing.logoUrl}
                          alt=""
                          className="block h-full w-auto max-w-none flex-shrink-0 px-2"
                        />
                      </div>
                      <p className="text-[10px] text-text-muted">
                        Preview at {logoEditing.displaySize ?? 200}px height — width follows the
                        logo&apos;s aspect ratio, same as on the live site
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <UploadCloud size={28} className="mx-auto text-text-muted" />
                      <p className="text-xs text-text-secondary font-semibold">Drop logo here</p>
                      <p className="text-[10px] text-text-muted">or use the buttons below</p>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-text-secondary transition hover:border-teal hover:text-teal">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFileUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <UploadCloud size={14} />
                    {logoUploading ? "Uploading…" : logoEditing.logoUrl ? "Replace logo" : "Upload logo"}
                  </label>
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => {
                      const url = window.prompt("Paste logo URL (https://…)");
                      if (url) {
                        setLogoEditing({ ...logoEditing, logoUrl: url.trim() });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-text-secondary transition hover:border-teal hover:text-teal"
                  >
                    Paste URL
                  </button>
                  {logoEditing.logoUrl && (
                    <button
                      type="button"
                      disabled={logoUploading}
                      onClick={() =>
                        setLogoEditing({
                          ...logoEditing,
                          logoUrl: "",
                          sizeBytes: undefined,
                          mimeType: undefined,
                          uploadedAt: undefined,
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-text-muted transition hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                {/* Hidden logo URL input still editable for paste case */}
                <input
                  type="url"
                  value={logoEditing.logoUrl}
                  onChange={(e) => setLogoEditing({ ...logoEditing, logoUrl: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-text-secondary focus:border-teal focus:outline-none"
                  placeholder="https://example.org/logo.png"
                />

                {/* Asset summary (same pattern as Hero scene / History) */}
                {logoEditing.sizeBytes !== undefined && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "0.4rem 0.7rem",
                      padding: "0.55rem 0.7rem",
                      marginTop: "0.5rem",
                      border: "1px solid var(--admin-green)",
                      background: "color-mix(in oklch, var(--admin-green) 6%, var(--admin-surface))",
                      color: "var(--admin-ink)",
                      fontSize: "0.7rem",
                      lineHeight: 1.4,
                      borderRadius: "0.5rem",
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: "var(--admin-green)" }} />
                    <strong style={{ fontSize: "0.7rem", fontWeight: 800 }}>Asset summary</strong>
                    <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Size</span>
                    <span>
                      <strong>{formatHistoryBytes(logoEditing.sizeBytes)}</strong>
                      {logoEditing.uploadedAt && (
                        <small style={{ display: "block", color: "var(--admin-muted)" }}>
                          uploaded {historyTimeAgo(logoEditing.uploadedAt)}
                        </small>
                      )}
                    </span>
                    <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Type</span>
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                      {logoEditing.mimeType}
                    </span>
                    <span style={{ color: "var(--admin-muted)", fontWeight: 700 }}>Storage</span>
                    <span>
                      Cloudflare R2 <code style={{ fontSize: "0.6rem" }}>{logoEditing.logoUrl.split("/").pop()}</code>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Display size (CSS height) for this logo
                </label>
                <div className="flex flex-wrap gap-2">
                  {([80, 100, 120, 160, 200] as const).map((sz) => {
                    const active = (logoEditing.displaySize ?? 200) === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setLogoEditing({ ...logoEditing, displaySize: sz })}
                        style={{
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--admin-line)",
                          background: active ? "var(--admin-green)" : "var(--admin-surface)",
                          color: active ? "white" : "var(--admin-ink)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {sz}px
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  The global selector above sets this for every logo at once.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Website URL (optional)</label>
                <input
                  type="url"
                  value={logoEditing.websiteUrl ?? ""}
                  onChange={(e) => setLogoEditing({ ...logoEditing, websiteUrl: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:border-teal focus:outline-none"
                  placeholder="https://partner.org"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  If set, clicking the logo in the marquee opens this link in a new tab.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setLogoEditorOpen(false); setLogoEditing(null); }}
                className="flex-1 rounded-xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!logoEditing.name.trim() || !logoEditing.logoUrl.trim()}
                onClick={() => saveLogo(logoEditing)}
                className="flex-1 rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={14} className="inline mr-1" />
                {formData.partnerLogos?.some((p) => p.id === logoEditing.id) ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/* ── Hero helpers ──────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--admin-line)",
  background: "var(--admin-surface)",
  color: "var(--admin-ink)",
  padding: "0.55rem 0.7rem",
  fontSize: "0.78rem",
};

/* Generic labelled field — used by the Home sections, Footer, Organization,
   and Library categories tabs. */
function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: "0.3rem",
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <span
        style={{
          color: "var(--admin-muted)",
          fontSize: "0.7rem",
          fontWeight: 750,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryChip({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.35rem 0.7rem 0.35rem 0.55rem",
        border: "1px solid var(--admin-line)",
        background: "var(--admin-surface)",
        color: "var(--admin-ink)",
        fontSize: "0.7rem",
        fontWeight: 700,
      }}
    >
      <span
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: "1.4rem",
          height: "1.4rem",
          borderRadius: "999px",
          background: "var(--admin-green-soft)",
          color: "var(--admin-green)",
        }}
      >
        {icon}
      </span>
      <span style={{ color: "var(--admin-muted)", fontWeight: 800 }}>{label}</span>
      <strong style={{ fontWeight: 800 }}>{value}</strong>
    </span>
  );
}

function formatTotalBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatHistoryBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function historyTimeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
    return `${Math.floor(diff / 86_400_000)} d ago`;
  } catch {
    return "";
  }
}
