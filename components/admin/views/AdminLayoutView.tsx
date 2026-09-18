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
} from "lucide-react";
import { AdminBoardMember, AdminHistoryItem, AdminLayoutConfig, AdminLeaderProfile } from "@/lib/admin-data";
import { compressImageFile } from "@/lib/image-utils";
import { BoardMemberEditorModal } from "@/components/admin/modals/BoardMemberEditorModal";
import { ConfirmDeleteDialog } from "@/components/admin/modals/ConfirmDeleteDialog";

export type LayoutTab = "hero" | "dean" | "board" | "history" | "sections";

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
  const [formData, setFormData] = useState<AdminLayoutConfig>(layout);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [boardEditorMember, setBoardEditorMember] = useState<AdminBoardMember | null>(null);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [boardDeleteMember, setBoardDeleteMember] = useState<AdminBoardMember | null>(null);
  const [historyCompressingId, setHistoryCompressingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-subtle pb-4">
        {(
          [
            { id: "hero", label: "Banner & Hero Section" },
            { id: "dean", label: `Leadership (${formData.deanProfiles.length})` },
            { id: "board", label: `Executive Board (${formData.boardMembers.length})` },
            { id: "history", label: `Organization history (${formData.historyItems.length})` },
            { id: "sections", label: "Section visibility" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-teal text-white shadow-sm"
                : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: Hero Settings */}
        {activeTab === "hero" && (
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Banner and hero content
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                The first message visitors see when they arrive on the website.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Main headline
                </label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroHeadline: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="Where social work finds its regional voice."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.heroTagline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroTagline: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="International social work across Eurasia"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  CTA button text
                </label>
                <input
                  type="text"
                  value={formData.heroCtaText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroCtaText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="Join the Network"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  CTA target link
                </label>
                <input
                  type="text"
                  value={formData.heroCtaLink}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroCtaLink: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="/member"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Background video URL
                </label>
                <input
                  type="text"
                  value={formData.heroBgVideoUrl || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroBgVideoUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Video poster image URL
                </label>
                <input
                  type="text"
                  value={formData.heroBgPosterUrl || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroBgPosterUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Supporting copy
                </label>
                <textarea
                  rows={3}
                  value={formData.heroSubheadline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, heroSubheadline: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base p-4 text-xs text-text-primary focus:border-teal focus:outline-none"
                  placeholder="The Eurasia Forum for Social Workers connects..."
                />
              </div>
            </div>
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
                            const image = await compressImageFile(file, { maxWidth: 1400, maxHeight: 900, quality: 0.82, outputFormat: "image/webp" });
                            setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, image } : entry) }));
                          } finally {
                            setHistoryCompressingId(null);
                          }
                        }} />
                        <UploadCloud size={14} />
                        {historyCompressingId === item.id ? "Processing..." : item.image ? "Replace image" : "Upload image"}
                      </label>
                      {item.image && <button type="button" onClick={() => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.map((entry) => entry.id === item.id ? { ...entry, image: "" } : entry) }))} className="text-xs font-bold text-text-muted hover:text-red-400">Remove image</button>}
                      <button type="button" onClick={() => setFormData((prev) => ({ ...prev, historyItems: prev.historyItems.filter((entry) => entry.id !== item.id) }))} aria-label={`Delete ${item.year} milestone`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:border-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {item.image && <img src={item.image} alt="" className="mt-4 h-28 w-full rounded-xl object-cover" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Section Visibility */}
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
    </div>
  );
});
