import { useState } from "react";
import { MemberProfile, EducationLevel, updateMember } from "@/lib/member-auth";

export type TargetGroupKey =
  | "children"
  | "youth"
  | "adults"
  | "elderly"
  | "families"
  | "disabilities"
  | "mental-health"
  | "substance"
  | "refugees"
  | "lgbtq"
  | "trafficking"
  | "domestic-violence";

export type AvatarSettings = {
  src: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type Draft = {
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  organization: string;
  position: string;
  expertise: string;
  university: string;
  faculty: string;
  contactPosition: string;
  bio: string;
  educationLevel: "" | EducationLevel;
  degree: string;
  license: string;
  experienceYears: string;
  targetGroups: TargetGroupKey[];
  avatar: AvatarSettings | null;
};

export type SectionKey =
  | "identity"
  | "location"
  | "education"
  | "expertise"
  | "targets"
  | "bio"
  | "avatar";

/**
 * Custom hook for managing profile edit state
 */
export function useProfileEdit(member: MemberProfile | null) {
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<Draft>(() => memberToDraft(member));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const startEditing = (section: SectionKey) => {
    setEditingSection(section);
    setSaveError("");
    // Reset draft to current member data
    setDraft(memberToDraft(member));
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setSaveError("");
    setDraft(memberToDraft(member));
  };

  const updateDraft = (updates: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const saveSection = async (section: SectionKey): Promise<boolean> => {
    if (!member) return false;

    setSaving(true);
    setSaveError("");

    try {
      const updates = draftToMemberUpdates(draft, section);
      updateMember(updates);
      setEditingSection(null);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    editingSection,
    draft,
    saving,
    saveError,
    startEditing,
    cancelEditing,
    updateDraft,
    saveSection,
  };
}

/**
 * Convert MemberProfile to Draft format
 */
function memberToDraft(m: MemberProfile | null): Draft {
  if (!m) {
    return {
      firstName: "",
      lastName: "",
      country: "",
      city: "",
      organization: "",
      position: "",
      expertise: "",
      university: "",
      faculty: "",
      contactPosition: "",
      bio: "",
      educationLevel: "",
      degree: "",
      license: "",
      experienceYears: "",
      targetGroups: [],
      avatar: null,
    };
  }

  return {
    firstName: m.firstName ?? "",
    lastName: m.lastName ?? "",
    country: m.country ?? "",
    city: m.city ?? "",
    organization: m.organization ?? "",
    position: m.position ?? "",
    expertise: m.expertise ?? "",
    university: m.university ?? "",
    faculty: m.faculty ?? "",
    contactPosition: m.contactPosition ?? "",
    bio: m.bio ?? "",
    educationLevel: m.educationLevel ?? "",
    degree: m.degree ?? "",
    license: m.license ?? "",
    experienceYears: m.experienceYears !== undefined ? String(m.experienceYears) : "",
    targetGroups: (m.targetGroups ?? []) as TargetGroupKey[],
    avatar: m.avatarUrl
      ? { src: m.avatarUrl, zoom: 1, offsetX: 0, offsetY: 0 }
      : null,
  };
}

/**
 * Convert Draft to MemberProfile updates for specific section
 */
function draftToMemberUpdates(draft: Draft, section: SectionKey): Partial<MemberProfile> {
  switch (section) {
    case "identity":
      return {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
      };
    case "location":
      return {
        country: draft.country.trim(),
        city: draft.city.trim(),
      };
    case "education":
      return {
        educationLevel: draft.educationLevel || undefined,
        degree: draft.degree.trim() || undefined,
        university: draft.university.trim() || undefined,
        faculty: draft.faculty.trim() || undefined,
      };
    case "expertise":
      return {
        organization: draft.organization.trim() || undefined,
        position: draft.position.trim() || undefined,
        contactPosition: draft.contactPosition.trim() || undefined,
        expertise: draft.expertise.trim() || undefined,
        license: draft.license.trim() || undefined,
        experienceYears: draft.experienceYears ? parseInt(draft.experienceYears, 10) : undefined,
      };
    case "targets":
      return {
        targetGroups: draft.targetGroups,
      };
    case "bio":
      return {
        bio: draft.bio.trim() || undefined,
      };
    case "avatar":
      return {
        avatarUrl: draft.avatar?.src || undefined,
      };
    default:
      return {};
  }
}
