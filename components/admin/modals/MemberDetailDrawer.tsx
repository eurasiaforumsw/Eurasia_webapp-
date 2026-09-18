"use client";

import { memo, useState } from "react";
import {
  X,
  UserCheck,
  Building,
  Mail,
  Phone,
  Globe2,
  Calendar,
  Check,
  Ban,
  Trash2,
  Save,
  MessageSquare,
} from "lucide-react";
import { AdminMember } from "@/lib/admin-data";

interface MemberDetailDrawerProps {
  member: AdminMember | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: AdminMember["status"], reviewNote: string) => void;
  onDeleteMember: (id: string) => void;
}

export const MemberDetailDrawer = memo(function MemberDetailDrawer({
  member,
  onClose,
  onUpdateStatus,
  onDeleteMember,
}: MemberDetailDrawerProps) {
  if (!member) return null;

  const [note, setNote] = useState(member.reviewNote || "");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveNote = () => {
    setIsSavingNote(true);
    onUpdateStatus(member.id, member.status, note);
    setTimeout(() => setIsSavingNote(false), 1000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(iso));
    } catch {
      return "-";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-surface-subtle bg-surface-deep p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-subtle pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal/15 text-teal-light font-bold text-base">
                  {member.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold font-display text-text-primary truncate">
                    {member.fullName}
                  </h2>
                  <div className="text-xs text-text-muted">{member.email}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:bg-surface-raised hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-surface-subtle bg-surface-raised p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Membership type
                  </div>
                  <div className="text-xs font-bold text-teal-light mt-1 capitalize">
                    {member.membershipType}
                  </div>
                </div>

                <div className="rounded-xl border border-surface-subtle bg-surface-raised p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Account status
                  </div>
                  <div className="text-xs font-bold text-text-primary mt-1">
                    {member.status === "active"
                      ? "Approved"
                      : member.status === "pending"
                      ? "Pending review"
                      : "Suspended"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-surface-subtle bg-surface-raised p-4">
                <div className="flex items-center gap-2.5 text-text-secondary">
                  <Globe2 size={16} className="text-text-muted flex-shrink-0" />
                  <span>Country: <strong className="text-text-primary">{member.country || "-"}</strong></span>
                </div>

                <div className="flex items-center gap-2.5 text-text-secondary">
                  <Building size={16} className="text-text-muted flex-shrink-0" />
                  <span>Organisation: <strong className="text-text-primary">{member.organization || member.university || "-"}</strong></span>
                </div>

                {member.position && (
                  <div className="flex items-center gap-2.5 text-text-secondary">
                    <UserCheck size={16} className="text-text-muted flex-shrink-0" />
                    <span>Position: <strong className="text-text-primary">{member.position}</strong></span>
                  </div>
                )}

                {member.expertise && (
                  <div className="flex items-center gap-2.5 text-text-secondary">
                    <Check size={16} className="text-text-muted flex-shrink-0" />
                    <span>Expertise: <strong className="text-text-primary">{member.expertise}</strong></span>
                  </div>
                )}

                {member.bio && (
                  <div className="mt-2 text-text-secondary text-[11px] leading-relaxed border-t border-surface-subtle pt-2">
                  <span className="font-bold text-text-muted block mb-1">Bio:</span>
                    <p className="text-text-primary">{member.bio}</p>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-text-secondary">
                  <Calendar size={16} className="text-text-muted flex-shrink-0" />
                  <span>Joined: <strong className="text-text-primary">{formatDate(member.joinedAt)}</strong></span>
                </div>
              </div>

              {/* Review Notes */}
              <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <MessageSquare size={15} className="text-teal" />
                    <span>Admin note</span>
                  </div>
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal hover:underline disabled:opacity-50"
                  >
                    <Save size={12} />
                    {isSavingNote ? "Saving..." : "Save note"}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a review note or approval rationale..."
                  className="w-full rounded-xl border border-surface-subtle bg-surface-base p-3 text-xs text-text-primary focus:border-teal focus:outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-surface-subtle pt-4 mt-6 space-y-2">
            <div className="flex items-center gap-2">
              {member.status !== "active" && (
                <button
                  onClick={() => onUpdateStatus(member.id, "active", note)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 transition-all"
                >
                  <Check size={15} />
                  <span>Approve member</span>
                </button>
              )}

              {member.status === "active" && (
                <button
                  onClick={() => onUpdateStatus(member.id, "suspended", note)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition-all"
                >
                  <Ban size={15} />
                  <span>Suspend temporarily</span>
                </button>
              )}

              <button
                onClick={() => onDeleteMember(member.id)}
                title="Delete member"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
