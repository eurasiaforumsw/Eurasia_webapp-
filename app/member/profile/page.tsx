"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Globe,
  GraduationCap,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import {
  getSessionMember,
  logoutMember,
  MemberProfile,
  EducationLevel,
  refreshSessionMember,
  updateMember,
} from "@/lib/member-auth";

/* ═══════════════════════════════ options ═══════════════════════════════ */

const typeLabels = {
  professional: "Professional member",
  student: "Student member",
  institutional: "Institutional member",
};
const statusLabels: Record<MemberProfile["status"], string> = {
  pending: "Pending review",
  active: "Active member",
  suspended: "Temporarily suspended",
};

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Cambodia","Cameroon","Canada","Chile","China","Colombia","Croatia","Cuba","Cyprus","Czechia",
  "Denmark","Dominican Republic",
  "Ecuador","Egypt","Estonia","Ethiopia",
  "Fiji","Finland","France",
  "Georgia","Germany","Ghana","Greece",
  "Hong Kong","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lithuania","Luxembourg",
  "Malaysia","Maldives","Mexico","Mongolia","Morocco","Myanmar",
  "Nepal","Netherlands","New Zealand","Nigeria","Norway",
  "Oman",
  "Pakistan","Palestine","Philippines","Poland","Portugal",
  "Qatar",
  "Romania","Russia",
  "Saudi Arabia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Thailand","Turkey","Turkmenistan",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uzbekistan",
  "Vietnam",
  "Yemen",
];

const EDUCATION_LEVELS: Array<{ value: EducationLevel; label: string; description: string }> = [
  { value: "high-school", label: "High School", description: "Secondary education" },
  { value: "diploma", label: "Diploma / Vocational", description: "Vocational or technical training" },
  { value: "bachelor", label: "Bachelor's Degree", description: "Undergraduate degree" },
  { value: "master", label: "Master's Degree", description: "Postgraduate degree" },
  { value: "doctorate", label: "Doctorate / PhD", description: "Doctoral or research degree" },
];

type TargetGroupKey =
  | "children" | "family" | "health" | "clinical" | "offenders"
  | "disabilities" | "older" | "schools" | "mental" | "substance"
  | "lgbtq" | "informal" | "ethnic" | "violence" | "stateless"
  | "migrants" | "homeless" | "low-income" | "other";

const TARGET_GROUPS: Array<{ key: TargetGroupKey; label: string }> = [
  { key: "children", label: "Children & Youth" },
  { key: "family", label: "Families & Communities" },
  { key: "health", label: "Health & Well-Being" },
  { key: "clinical", label: "Clinical Practice" },
  { key: "offenders", label: "Offenders & Corrections" },
  { key: "disabilities", label: "Persons with Disabilities" },
  { key: "older", label: "Older Adults & Aging" },
  { key: "schools", label: "School Social Work" },
  { key: "mental", label: "Mental Health & Psychiatry" },
  { key: "substance", label: "Substance Abuse & Addictions" },
  { key: "lgbtq", label: "Gender & Sexual Diversity (LGBTQ+)" },
  { key: "informal", label: "Informal & Migrant Workers" },
  { key: "ethnic", label: "Ethnic & Indigenous Communities" },
  { key: "violence", label: "Survivors of Violence & Abuse" },
  { key: "stateless", label: "Stateless Persons" },
  { key: "migrants", label: "Migrants & Refugees" },
  { key: "homeless", label: "Homelessness" },
  { key: "low-income", label: "Financial Hardship & Poverty" },
  { key: "other", label: "Other" },
];

/* ═══════════════════════════════ helpers ═══════════════════════════════ */

type AvatarSettings = {
  /** Raw uploaded data URL or R2 URL. */
  src: string;
  /** 1.0 → 2.5 zoom factor. */
  zoom: number;
  /** -1.0 (left) → 0 (center) → 1.0 (right). */
  offsetX: number;
  /** -1.0 (up) → 0 (center) → 1.0 (down). */
  offsetY: number;
};

type Draft = {
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

type SectionKey =
  | "identity"
  | "location"
  | "education"
  | "expertise"
  | "targets"
  | "bio";

const SECTIONS: Array<{ key: SectionKey; icon: typeof UserCircle2; title: string; subtitle: string }> = [
  { key: "identity", icon: UserCircle2, title: "Identity", subtitle: "Your name and credentials" },
  { key: "location", icon: MapPin, title: "Location", subtitle: "Where you're based" },
  { key: "education", icon: GraduationCap, title: "Education & Credentials", subtitle: "Degrees, licenses, experience" },
  { key: "expertise", icon: Briefcase, title: "Professional Practice", subtitle: "Organization and role" },
  { key: "targets", icon: Heart, title: "Target Groups", subtitle: "Communities you serve" },
  { key: "bio", icon: BookOpen, title: "About You", subtitle: "Public-facing introduction" },
];

const toDraft = (m: MemberProfile): Draft => ({
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
  // Convert existing labels back to keys if needed (defensive)
  targetGroups: (m.targetGroups ?? []).map((t) => {
    const found = TARGET_GROUPS.find((g) => g.label === t);
    return found?.key ?? (t as TargetGroupKey);
  }),
  avatar: m.avatarUrl
    ? { src: m.avatarUrl, zoom: 1, offsetX: 0, offsetY: 0 }
    : null,
});

const toLabel = (key: TargetGroupKey) => TARGET_GROUPS.find((g) => g.key === key)?.label ?? key;

const computeCompletion = (d: Draft): number => {
  const checks = [
    Boolean(d.firstName.trim()),
    Boolean(d.lastName.trim()),
    Boolean(d.country.trim()),
    Boolean(d.avatar),
    Boolean(d.educationLevel),
    Boolean(d.experienceYears.trim()),
    d.targetGroups.length > 0,
    Boolean(d.bio.trim()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

/**
 * Fallback when /api/upload fails: compress the file client-side and return a
 * data URL so the avatar still renders. Max width 800px keeps the data URL
 * small enough to survive a localStorage write.
 */
const compressImageToDataUrl = (
  file: File,
  maxWidth = 800,
  quality = 0.85,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image format is not supported."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not available."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Could not encode the image."));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Apply zoom + offset settings to the original image and return a square
 * 480×480 JPEG data URL. Used both for the live preview in the editor and
 * as the final image sent to /api/upload.
 */
const renderCroppedAvatar = (
  settings: AvatarSettings,
  outputSize = 480,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Source rectangle (from the original, after zoom).
      const srcSize = Math.min(img.width, img.height) / settings.zoom;
      const srcCenterX = img.width / 2 + settings.offsetX * (img.width / 2 - srcSize / 2);
      const srcCenterY = img.height / 2 + settings.offsetY * (img.height / 2 - srcSize / 2);
      const srcX = Math.max(0, srcCenterX - srcSize / 2);
      const srcY = Math.max(0, srcCenterY - srcSize / 2);
      const srcW = Math.min(srcSize, img.width - srcX);
      const srcH = Math.min(srcSize, img.height - srcY);

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not available."));
        return;
      }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not encode the photo."));
      }
    };
    img.onerror = () => reject(new Error("Image format is not supported."));
    img.src = settings.src;
  });
};

/* ═══════════════════════════════ page ═══════════════════════════════ */

export default function MemberProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("identity");
  const [status, setStatus] = useState<"" | "saving" | "success" | "error">("");
  const [avatarEditor, setAvatarEditor] = useState<{ src: string; open: boolean }>({ src: "", open: false });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [engagementStats, setEngagementStats] = useState<{
    totalLikes: number;
    totalSaves: number;
    totalViews: number;
    totalShares: number;
    recentActivity: Array<{
      action_type: string;
      content_id: string | null;
      created_at: string;
      metadata: any;
    }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = getSessionMember();
    if (!current) {
      window.location.href = "/member/login";
      return;
    }
    setMember(current);
    setDraft(toDraft(current));

    // Fetch engagement stats
    setStatsLoading(true);
    fetch(`/api/engagement/stats?memberId=${current.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setEngagementStats(data.stats);
        }
      })
      .catch(err => console.error('Failed to load engagement stats:', err))
      .finally(() => setStatsLoading(false));

    refreshSessionMember()
      .then((fresh) => {
        if (fresh) {
          setMember(fresh);
          setDraft(toDraft(fresh));
        }
      })
      .catch(() => undefined);
  }, []);

  const completion = useMemo(() => (draft ? computeCompletion(draft) : 0), [draft]);

  /* ---------- avatar upload (file picker → editor with zoom/position) ---------- */
  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (JPG, PNG, WebP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAvatarError("");

    // Always open the editor with a local data URL first so the user can preview
    // and adjust without any server round-trip. If /api/upload succeeds when they
    // press Save, the data URL is replaced with the R2 URL.
    try {
      const dataUrl = await compressImageToDataUrl(file, 1600, 0.9);
      setAvatarEditor({ src: dataUrl, open: true });
    } catch (compressErr) {
      setAvatarError(
        compressErr instanceof Error ? compressErr.message : "Could not read the image.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------- avatar editor save (try R2 first, fall back to data URL) ---------- */
  const handleAvatarEditorSave = async (settings: AvatarSettings) => {
    setAvatarUploading(true);
    setAvatarError("");

    let finalSrc = settings.src;
    // Render the cropped image to a canvas using the user's zoom/offset.
    let finalDataUrl = "";
    try {
      finalDataUrl = await renderCroppedAvatar(settings);
    } catch (renderErr) {
      setAvatarUploading(false);
      setAvatarError(
        renderErr instanceof Error ? renderErr.message : "Could not render the photo.",
      );
      return;
    }

    // Try R2 upload of the cropped result.
    let uploadedUrl = "";
    try {
      const blob = await (await fetch(finalDataUrl)).blob();
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        uploadedUrl = body.url;
        finalSrc = body.url;
      } else {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
    } catch (uploadErr) {
      // Fallback: keep the cropped data URL so the avatar still shows.
      finalSrc = finalDataUrl;
      setAvatarError(
        `R2 upload failed — saved locally instead (${uploadErr instanceof Error ? uploadErr.message : "unknown error"}).`,
      );
    }

    const avatar: AvatarSettings = {
      src: finalSrc,
      zoom: settings.zoom,
      offsetX: settings.offsetX,
      offsetY: settings.offsetY,
    };
    setDraft((current) => (current ? { ...current, avatar } : current));
    setAvatarEditor({ src: "", open: false });
    setAvatarUploading(false);
  };

  const handleAvatarEditorCancel = () => {
    setAvatarEditor({ src: "", open: false });
  };

  /* ---------- validation ---------- */
  const validateForm = (): boolean => {
    if (!draft) return false;

    const newErrors: Record<string, string> = {};

    if (!draft.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!draft.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!draft.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- save ---------- */
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!member || !draft) return;

    if (!validateForm()) {
      setStatus("error");
      setTimeout(() => setStatus(""), 3200);
      return;
    }

    setStatus("saving");

    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || member.fullName;
    const experienceYears =
      draft.experienceYears.trim() === ""
        ? undefined
        : Math.max(0, Math.min(80, Number(draft.experienceYears) || 0));

    const updates: Partial<MemberProfile> = {
      fullName,
      firstName,
      lastName,
      country: draft.country,
      city: draft.city.trim(),
      organization: draft.organization.trim(),
      position: draft.position.trim(),
      expertise: draft.expertise.trim(),
      university: draft.university.trim(),
      faculty: draft.faculty.trim(),
      contactPosition: draft.contactPosition.trim(),
      bio: draft.bio.trim(),
      educationLevel: draft.educationLevel || undefined,
      degree: draft.degree.trim(),
      license: draft.license.trim(),
      experienceYears,
      targetGroups: draft.targetGroups.map(toLabel),
      avatarUrl: draft.avatar?.src || "",
    };

    try {
      const updated = updateMember(updates);
      setMember(updated);
      setStatus("success");
      setTimeout(() => setStatus(""), 2400);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(""), 3200);
    }
  };

  const handleLogout = () => {
    logoutMember();
    window.location.href = "/member/login";
  };

  const toggleTargetGroup = (key: TargetGroupKey) => {
    if (!draft) return;
    setDraft({
      ...draft,
      targetGroups: draft.targetGroups.includes(key)
        ? draft.targetGroups.filter((t) => t !== key)
        : [...draft.targetGroups, key],
    });
  };

  const educationLabel = (value?: string) =>
    EDUCATION_LEVELS.find((e) => e.value === value)?.label ?? "—";

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    const el = document.getElementById(`profile-section-${key}`);
    if (el) {
      const offset = 120;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (!member || !draft) {
    return (
      <main className="efsw-profile">
        <div className="efsw-profile__loading">
          <div className="efsw-profile__loading-dot" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  const displayName = [draft.firstName, draft.lastName].filter(Boolean).join(" ") || member.fullName;
  const avatarInitial = (displayName || member.email).charAt(0).toUpperCase();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase() || avatarInitial;

  return (
    <main className="efsw-profile">
      {/* ─── Hero / Cover ─── */}
      <section className="efsw-profile__cover">
        <div className="efsw-profile__cover-bg" aria-hidden="true">
          <div className="efsw-profile__cover-grid" />
          <div className="efsw-profile__cover-glow" />
        </div>

        <div className="efsw-profile__topbar">
          <a href="/" className="efsw-profile__topbar-back">
            <ArrowUpRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to home
          </a>
          <div className="efsw-profile__topbar-actions">
            <a href="/admin" className="efsw-profile__topbar-link">
              <ShieldCheck size={14} /> Admin console
            </a>
            <button type="button" onClick={handleLogout} className="efsw-profile__topbar-logout">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        <div className="efsw-profile__hero">
          {/* Avatar with hover editor + zoom/position controls */}
          <div className="efsw-profile__avatar">
            <div className="efsw-profile__avatar-stage">
              <div className="efsw-profile__avatar-frame">
                {draft.avatar ? (
                  <img
                    src={draft.avatar.src}
                    alt={displayName}
                    style={{
                      transform: `translate(${draft.avatar.offsetX * 30}%, ${draft.avatar.offsetY * 30}%) scale(${draft.avatar.zoom})`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : (
                  <span className="efsw-profile__avatar-initials">{initials}</span>
                )}
                <button
                  type="button"
                  className="efsw-profile__avatar-edit"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  aria-label="Change profile photo"
                >
                  {avatarUploading ? (
                    <span className="efsw-profile__avatar-spinner" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleAvatarFileChange}
                hidden
              />
              {avatarError && (
                <p className="efsw-profile__avatar-error">{avatarError}</p>
              )}
            </div>
            {draft.avatar && (
              <div className="efsw-profile__avatar-controls">
                <button
                  type="button"
                  className="efsw-profile__avatar-reposition"
                  onClick={() => setAvatarEditor({ src: draft.avatar!.src, open: true })}
                  aria-label="Reposition profile photo"
                >
                  <Pencil size={14} /> Adjust crop &amp; position
                </button>
                <button
                  type="button"
                  className="efsw-profile__avatar-reposition is-danger"
                  onClick={() => setDraft({ ...draft, avatar: null })}
                  aria-label="Remove profile photo"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}
          </div>

          <div className="efsw-profile__hero-meta">
            <div className="efsw-profile__hero-eyebrow">
              <span className={`efsw-profile__status efsw-profile__status--${member.status}`}>
                <span className="efsw-profile__status-dot" />
                {statusLabels[member.status]}
              </span>
              <span className="efsw-profile__hero-type">
                {typeLabels[member.membershipType]}
              </span>
            </div>

            <h1 className="efsw-profile__hero-name">
              {displayName || <span className="efsw-profile__hero-name-empty">Add your name</span>}
            </h1>
            <p className="efsw-profile__hero-email">
              <Mail size={14} /> {member.email}
            </p>

            <div className="efsw-profile__hero-stats">
              <div>
                <span className="efsw-profile__hero-stat-label">Member ID</span>
                <span className="efsw-profile__hero-stat-value">{member.id.slice(0, 12)}…</span>
              </div>
              <div>
                <span className="efsw-profile__hero-stat-label">Joined</span>
                <span className="efsw-profile__hero-stat-value">
                  {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
              <div>
                <span className="efsw-profile__hero-stat-label">Location</span>
                <span className="efsw-profile__hero-stat-value">
                  {[draft.city, draft.country].filter(Boolean).join(", ") || "Not set"}
                </span>
              </div>
              <div>
                <span className="efsw-profile__hero-stat-label">Profile</span>
                <span className="efsw-profile__hero-stat-value">{completion}% complete</span>
              </div>
            </div>

            <div className="efsw-profile__progress" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
              <div className="efsw-profile__progress-bar" style={{ width: `${completion}%` }} />
            </div>

            {/* Engagement Stats Dashboard */}
            <section className="efsw-profile__engagement-stats">
              <header className="efsw-profile__engagement-header">
                <h2>Your Engagement</h2>
                <p>Activity and interactions across the platform</p>
              </header>

              {statsLoading ? (
                <div className="efsw-profile__stats-loading">
                  <div className="efsw-profile__loading-dot" />
                  <span>Loading statistics...</span>
                </div>
              ) : engagementStats ? (
                <div className="efsw-profile__stats-grid">
                  <div className="efsw-profile__stat-card">
                    <div className="efsw-profile__stat-icon efsw-profile__stat-icon--likes">
                      <Heart size={20} />
                    </div>
                    <div className="efsw-profile__stat-content">
                      <span className="efsw-profile__stat-value">{engagementStats.totalLikes}</span>
                      <span className="efsw-profile__stat-label">Content liked</span>
                    </div>
                  </div>

                  <div className="efsw-profile__stat-card">
                    <div className="efsw-profile__stat-icon efsw-profile__stat-icon--saves">
                      <Bookmark size={20} />
                    </div>
                    <div className="efsw-profile__stat-content">
                      <span className="efsw-profile__stat-value">{engagementStats.totalSaves}</span>
                      <span className="efsw-profile__stat-label">Items saved</span>
                    </div>
                  </div>

                  <div className="efsw-profile__stat-card">
                    <div className="efsw-profile__stat-icon efsw-profile__stat-icon--views">
                      <Eye size={20} />
                    </div>
                    <div className="efsw-profile__stat-content">
                      <span className="efsw-profile__stat-value">{engagementStats.totalViews}</span>
                      <span className="efsw-profile__stat-label">Content viewed</span>
                    </div>
                  </div>

                  <div className="efsw-profile__stat-card">
                    <div className="efsw-profile__stat-icon efsw-profile__stat-icon--shares">
                      <Share2 size={20} />
                    </div>
                    <div className="efsw-profile__stat-content">
                      <span className="efsw-profile__stat-value">{engagementStats.totalShares}</span>
                      <span className="efsw-profile__stat-label">Items shared</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="efsw-profile__stats-empty">
                  <Sparkles size={24} opacity={0.3} />
                  <p>No engagement data yet. Start exploring content to see your stats here.</p>
                </div>
              )}

              {engagementStats?.recentActivity && engagementStats.recentActivity.length > 0 && (
                <div className="efsw-profile__recent-activity">
                  <h3>Recent Activity</h3>
                  <ul className="efsw-profile__activity-list">
                    {engagementStats.recentActivity.slice(0, 5).map((activity, idx) => (
                      <li key={idx} className="efsw-profile__activity-item">
                        <span className="efsw-profile__activity-type">
                          {activity.action_type === 'like' && <Heart size={14} />}
                          {activity.action_type === 'save' && <Bookmark size={14} />}
                          {activity.action_type === 'view' && <Eye size={14} />}
                          {activity.action_type === 'share' && <Share2 size={14} />}
                          {activity.action_type.replace('_', ' ')}
                        </span>
                        <span className="efsw-profile__activity-time">
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

          </div>
        </div>
      </section>

      {/* ─── Body grid: side nav + form ─── */}
      <div className="efsw-profile__body">
        <aside className="efsw-profile__sidenav" aria-label="Profile sections">
          <p className="efsw-profile__sidenav-label">Sections</p>
          <ol className="efsw-profile__sidenav-list">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  type="button"
                  className={activeSection === section.key ? "is-active" : ""}
                  onClick={() => scrollToSection(section.key)}
                >
                  <section.icon size={16} />
                  <span>
                    <strong>{section.title}</strong>
                    <small>{section.subtitle}</small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              </li>
            ))}
          </ol>

          <div className="efsw-profile__sidenav-tip">
            <Sparkles size={14} />
            <div>
              <strong>Tip</strong>
              <p>Completing your profile increases visibility in the member directory.</p>
            </div>
          </div>
        </aside>

        <form
          className="efsw-profile__form"
          onSubmit={handleUpdate}
          noValidate
          aria-describedby={Object.keys(errors).length > 0 ? "form-errors" : undefined}
        >
          {Object.keys(errors).length > 0 && (
            <div id="form-errors" role="alert" className="efsw-profile__alert efsw-profile__alert--error">
              <AlertCircle size={14} />
              <div>
                <strong>Please fix the following errors:</strong>
                <ul>
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Identity ── */}
          <section id="profile-section-identity" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><UserCircle2 size={18} /></div>
              <div>
                <h2>Identity</h2>
                <p>How the EFSW community will recognize you.</p>
              </div>
            </header>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="firstName">First name <span className="efsw-profile__req">*</span></label>
                <input
                  id="firstName"
                  type="text"
                  value={draft.firstName}
                  onChange={(e) => {
                    setDraft({ ...draft, firstName: e.target.value });
                    if (errors.firstName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.firstName;
                        return next;
                      });
                    }
                  }}
                  required
                  placeholder="e.g. Aisha"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                />
                <span className="efsw-profile__field-hint">As shown on your professional documents</span>
                {errors.firstName && (
                  <p id="firstName-error" role="alert" className="efsw-profile__field-error">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="lastName">Last name <span className="efsw-profile__req">*</span></label>
                <input
                  id="lastName"
                  type="text"
                  value={draft.lastName}
                  onChange={(e) => {
                    setDraft({ ...draft, lastName: e.target.value });
                    if (errors.lastName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.lastName;
                        return next;
                      });
                    }
                  }}
                  required
                  placeholder="e.g. Karimova"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                />
                {errors.lastName && (
                  <p id="lastName-error" role="alert" className="efsw-profile__field-error">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
            {avatarError && (
              <div className="efsw-profile__alert efsw-profile__alert--error">
                <AlertCircle size={14} /> {avatarError}
              </div>
            )}
          </section>

          {/* ── Location ── */}
          <section id="profile-section-location" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><MapPin size={18} /></div>
              <div>
                <h2>Location</h2>
                <p>Where you live and practice.</p>
              </div>
            </header>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="country">Country <span className="efsw-profile__req">*</span></label>
                <select
                  id="country"
                  value={draft.country}
                  onChange={(e) => {
                    setDraft({ ...draft, country: e.target.value });
                    if (errors.country) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.country;
                        return next;
                      });
                    }
                  }}
                  required
                  aria-invalid={!!errors.country}
                  aria-describedby={errors.country ? "country-error" : "country-hint"}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span id="country-hint" className="efsw-profile__field-hint">Used for regional working groups</span>
                {errors.country && (
                  <p id="country-error" role="alert" className="efsw-profile__field-error">
                    {errors.country}
                  </p>
                )}
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  placeholder="e.g. Bangkok"
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "city-error" : undefined}
                />
                {errors.city && (
                  <p id="city-error" role="alert" className="efsw-profile__field-error">
                    {errors.city}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Education & credentials ── */}
          <section id="profile-section-education" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><GraduationCap size={18} /></div>
              <div>
                <h2>Education & credentials</h2>
                <p>Your academic and professional qualifications.</p>
              </div>
            </header>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="educationLevel">Education level</label>
                <select
                  id="educationLevel"
                  value={draft.educationLevel}
                  onChange={(e) => {
                    setDraft({ ...draft, educationLevel: e.target.value as Draft["educationLevel"] });
                    if (errors.educationLevel) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.educationLevel;
                        return next;
                      });
                    }
                  }}
                  aria-invalid={!!errors.educationLevel}
                  aria-describedby={errors.educationLevel ? "educationLevel-error" : undefined}
                >
                  <option value="">Select level...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} — {level.description}
                    </option>
                  ))}
                </select>
                {errors.educationLevel && (
                  <p id="educationLevel-error" role="alert" className="efsw-profile__field-error">
                    {errors.educationLevel}
                  </p>
                )}
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="degree">Degree / qualification</label>
                <input
                  id="degree"
                  type="text"
                  value={draft.degree}
                  onChange={(e) => {
                    setDraft({ ...draft, degree: e.target.value });
                    if (errors.degree) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.degree;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Master of Social Work"
                  aria-invalid={!!errors.degree}
                  aria-describedby={errors.degree ? "degree-error" : undefined}
                />
                {errors.degree && (
                  <p id="degree-error" role="alert" className="efsw-profile__field-error">
                    {errors.degree}
                  </p>
                )}
              </div>
            </div>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="license">Professional license</label>
                <input
                  id="license"
                  type="text"
                  value={draft.license}
                  onChange={(e) => {
                    setDraft({ ...draft, license: e.target.value });
                    if (errors.license) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.license;
                        return next;
                      });
                    }
                  }}
                  placeholder="License number or registration"
                  aria-invalid={!!errors.license}
                  aria-describedby={errors.license ? "license-error" : "license-hint"}
                />
                <span id="license-hint" className="efsw-profile__field-hint">If applicable in your jurisdiction</span>
                {errors.license && (
                  <p id="license-error" role="alert" className="efsw-profile__field-error">
                    {errors.license}
                  </p>
                )}
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="experienceYears">Years of experience</label>
                <div className="efsw-profile__stepper">
                  <button
                    type="button"
                    aria-label="Decrease experience"
                    onClick={() => setDraft({
                      ...draft,
                      experienceYears: String(Math.max(0, (Number(draft.experienceYears) || 0) - 1)),
                    })}
                  >−</button>
                  <input
                    id="experienceYears"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    value={draft.experienceYears}
                    onChange={(e) => {
                      setDraft({ ...draft, experienceYears: e.target.value });
                      if (errors.experienceYears) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.experienceYears;
                          return next;
                        });
                      }
                    }}
                    placeholder="0"
                    aria-invalid={!!errors.experienceYears}
                    aria-describedby={errors.experienceYears ? "experienceYears-error" : "experienceYears-hint"}
                  />
                  <button
                    type="button"
                    aria-label="Increase experience"
                    onClick={() => setDraft({
                      ...draft,
                      experienceYears: String(Math.min(80, (Number(draft.experienceYears) || 0) + 1)),
                    })}
                  >+</button>
                </div>
                <span id="experienceYears-hint" className="efsw-profile__field-hint">
                  {draft.experienceYears
                    ? `${draft.experienceYears} ${Number(draft.experienceYears) === 1 ? "year" : "years"} of practice`
                    : "0 – 80 years"}
                </span>
                {errors.experienceYears && (
                  <p id="experienceYears-error" role="alert" className="efsw-profile__field-error">
                    {errors.experienceYears}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Professional practice ── */}
          <section id="profile-section-expertise" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><Briefcase size={18} /></div>
              <div>
                <h2>Professional practice</h2>
                <p>Your organization and area of focus.</p>
              </div>
            </header>
            <div className="efsw-profile__field-grid">
              <div className="efsw-profile__field">
                <label htmlFor="organization">Organization</label>
                <input
                  id="organization"
                  type="text"
                  value={draft.organization}
                  onChange={(e) => {
                    setDraft({ ...draft, organization: e.target.value });
                    if (errors.organization) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.organization;
                        return next;
                      });
                    }
                  }}
                  placeholder="Where you work"
                  aria-invalid={!!errors.organization}
                  aria-describedby={errors.organization ? "organization-error" : undefined}
                />
                {errors.organization && (
                  <p id="organization-error" role="alert" className="efsw-profile__field-error">
                    {errors.organization}
                  </p>
                )}
              </div>
              <div className="efsw-profile__field">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  type="text"
                  value={draft.position}
                  onChange={(e) => {
                    setDraft({ ...draft, position: e.target.value });
                    if (errors.position) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.position;
                        return next;
                      });
                    }
                  }}
                  placeholder="Your role"
                  aria-invalid={!!errors.position}
                  aria-describedby={errors.position ? "position-error" : undefined}
                />
                {errors.position && (
                  <p id="position-error" role="alert" className="efsw-profile__field-error">
                    {errors.position}
                  </p>
                )}
              </div>
            </div>
            <div className="efsw-profile__field">
              <label htmlFor="expertise">Area of expertise</label>
              <input
                id="expertise"
                type="text"
                value={draft.expertise}
                onChange={(e) => {
                  setDraft({ ...draft, expertise: e.target.value });
                  if (errors.expertise) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.expertise;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. Trauma-informed care, child welfare"
                aria-invalid={!!errors.expertise}
                aria-describedby={errors.expertise ? "expertise-error" : "expertise-hint"}
              />
              <span id="expertise-hint" className="efsw-profile__field-hint">Comma-separate multiple specialties</span>
              {errors.expertise && (
                <p id="expertise-error" role="alert" className="efsw-profile__field-error">
                  {errors.expertise}
                </p>
              )}
            </div>

            {member.membershipType === "student" && (
              <div className="efsw-profile__field-grid">
                <div className="efsw-profile__field">
                  <label htmlFor="university">University</label>
                  <input
                    id="university"
                    type="text"
                    value={draft.university}
                    onChange={(e) => {
                      setDraft({ ...draft, university: e.target.value });
                      if (errors.university) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.university;
                          return next;
                        });
                      }
                    }}
                    placeholder="Your institution"
                    aria-invalid={!!errors.university}
                    aria-describedby={errors.university ? "university-error" : undefined}
                  />
                  {errors.university && (
                    <p id="university-error" role="alert" className="efsw-profile__field-error">
                      {errors.university}
                    </p>
                  )}
                </div>
                <div className="efsw-profile__field">
                  <label htmlFor="faculty">Faculty / department</label>
                  <input
                    id="faculty"
                    type="text"
                    value={draft.faculty}
                    onChange={(e) => {
                      setDraft({ ...draft, faculty: e.target.value });
                      if (errors.faculty) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.faculty;
                          return next;
                        });
                      }
                    }}
                    aria-invalid={!!errors.faculty}
                    aria-describedby={errors.faculty ? "faculty-error" : undefined}
                  />
                  {errors.faculty && (
                    <p id="faculty-error" role="alert" className="efsw-profile__field-error">
                      {errors.faculty}
                    </p>
                  )}
                </div>
              </div>
            )}

            {member.membershipType === "institutional" && (
              <div className="efsw-profile__field">
                <label htmlFor="contactPosition">Contact position</label>
                <input
                  id="contactPosition"
                  type="text"
                  value={draft.contactPosition}
                  onChange={(e) => {
                    setDraft({ ...draft, contactPosition: e.target.value });
                    if (errors.contactPosition) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.contactPosition;
                        return next;
                      });
                    }
                  }}
                  placeholder="Your role at this organization"
                  aria-invalid={!!errors.contactPosition}
                  aria-describedby={errors.contactPosition ? "contactPosition-error" : undefined}
                />
                {errors.contactPosition && (
                  <p id="contactPosition-error" role="alert" className="efsw-profile__field-error">
                    {errors.contactPosition}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Target groups ── */}
          <section id="profile-section-targets" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><Heart size={18} /></div>
              <div>
                <h2>Target groups</h2>
                <p>Communities and populations you serve.</p>
              </div>
            </header>

            <div className="efsw-profile__targets">
              {TARGET_GROUPS.map(({ key, label }) => {
                const selected = draft.targetGroups.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`efsw-profile__target ${selected ? "is-selected" : ""}`}
                    onClick={() => toggleTargetGroup(key)}
                    aria-pressed={selected}
                  >
                    <span className="efsw-profile__target-check" aria-hidden="true">
                      {selected ? <Check size={11} /> : null}
                    </span>
                    <span className="efsw-profile__target-label">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="efsw-profile__targets-meta">
              {draft.targetGroups.length === 0
                ? "Pick all that apply — visible in the member directory."
                : `${draft.targetGroups.length} selected · visible in the member directory`}
            </p>
          </section>

          {/* ── Bio ── */}
          <section id="profile-section-bio" className="efsw-profile__card">
            <header className="efsw-profile__card-head">
              <div className="efsw-profile__card-icon"><BookOpen size={18} /></div>
              <div>
                <h2>About you</h2>
                <p>A short introduction visible on your public profile.</p>
              </div>
            </header>
            <div className="efsw-profile__field">
              <label htmlFor="bio">Public bio</label>
              <textarea
                id="bio"
                rows={5}
                value={draft.bio}
                onChange={(e) => {
                  setDraft({ ...draft, bio: e.target.value });
                  if (errors.bio) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.bio;
                      return next;
                    });
                  }
                }}
                placeholder="Tell the community about your work, interests, and what brought you to EFSW..."
                maxLength={500}
                aria-invalid={!!errors.bio}
                aria-describedby={errors.bio ? "bio-error" : "bio-meta"}
              />
              <div id="bio-meta" className="efsw-profile__field-meta">
                <span className="efsw-profile__field-hint">Optional · max 500 characters</span>
                <span className="efsw-profile__counter">{draft.bio.length} / 500</span>
              </div>
              {errors.bio && (
                <p id="bio-error" role="alert" className="efsw-profile__field-error">
                  {errors.bio}
                </p>
              )}
            </div>
          </section>

          {/* ── Sticky save bar ── */}
          <div className="efsw-profile__savebar" role="region" aria-label="Save changes">
            <div className="efsw-profile__savebar-status">
              {status === "saving" && (
                <span className="efsw-profile__savebar-pending">
                  <span className="efsw-profile__savebar-spinner" /> Saving...
                </span>
              )}
              {status === "success" && (
                <span className="efsw-profile__savebar-success">
                  <CheckCircle2 size={16} /> Saved successfully
                </span>
              )}
              {status === "error" && (
                <span className="efsw-profile__savebar-error">
                  <AlertCircle size={16} /> Failed to save changes
                </span>
              )}
              {!status && (
                <span className="efsw-profile__savebar-idle">
                  <Pencil size={14} /> Edits are saved to your profile when you press Save.
                </span>
              )}
            </div>
            <div className="efsw-profile__savebar-actions">
              <button
                type="button"
                className="efsw-profile__btn-ghost"
                onClick={() => setDraft(toDraft(member))}
                disabled={status === "saving"}
              >
                <X size={14} /> Discard
              </button>
              <button
                type="submit"
                className="efsw-profile__btn-primary"
                disabled={status === "saving"}
              >
                <Save size={14} />
                {status === "saving" ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Avatar editor modal ─── */}
      {avatarEditor.open && avatarEditor.src && (
        <AvatarEditor
          src={avatarEditor.src}
          uploading={avatarUploading}
          onSave={handleAvatarEditorSave}
          onCancel={handleAvatarEditorCancel}
        />
      )}
    </main>
  );
}

/* ═══════════════════════════════ avatar editor modal ═══════════════════════════════ */

function AvatarEditor({
  src,
  uploading,
  onSave,
  onCancel,
}: {
  src: string;
  uploading: boolean;
  onSave: (settings: AvatarSettings) => void;
  onCancel: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [preview, setPreview] = useState<string>("");

  // Render the live preview whenever zoom/offset change.
  useEffect(() => {
    let cancelled = false;
    renderCroppedAvatar({ src, zoom, offsetX, offsetY }, 280)
      .then((dataUrl) => {
        if (!cancelled) setPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setPreview("");
      });
    return () => {
      cancelled = true;
    };
  }, [src, zoom, offsetX, offsetY]);

  return (
    <div className="efsw-profile__modal" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
      <div className="efsw-profile__modal-backdrop" onClick={onCancel} />
      <div className="efsw-profile__modal-card">
        <header className="efsw-profile__modal-head">
          <div>
            <h3 id="avatar-editor-title">Adjust profile photo</h3>
            <p>Drag the photo to reposition. Use the slider to zoom in or out.</p>
          </div>
          <button type="button" onClick={onCancel} className="efsw-profile__modal-close" aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className="efsw-profile__editor-grid">
          <div className="efsw-profile__editor-stage">
            <div
              className="efsw-profile__editor-preview"
              onPointerDown={(event) => {
                const target = event.currentTarget as HTMLDivElement;
                target.setPointerCapture(event.pointerId);
                const startX = event.clientX;
                const startY = event.clientY;
                const baseX = offsetX;
                const baseY = offsetY;
                const onMove = (moveEvent: PointerEvent) => {
                  const rect = target.getBoundingClientRect();
                  // Each ~80px drag = 1.0 in offset.
                  const nextX = Math.max(-1, Math.min(1, baseX + (moveEvent.clientX - startX) / (rect.width * 0.6)));
                  const nextY = Math.max(-1, Math.min(1, baseY + (moveEvent.clientY - startY) / (rect.height * 0.6)));
                  setOffsetX(nextX);
                  setOffsetY(nextY);
                };
                const onUp = () => {
                  target.releasePointerCapture(event.pointerId);
                  target.removeEventListener("pointermove", onMove);
                  target.removeEventListener("pointerup", onUp);
                  target.removeEventListener("pointercancel", onUp);
                };
                target.addEventListener("pointermove", onMove);
                target.addEventListener("pointerup", onUp);
                target.addEventListener("pointercancel", onUp);
              }}
            >
              {preview ? (
                <img src={preview} alt="Avatar preview" />
              ) : (
                <span className="efsw-profile__avatar-initials">?</span>
              )}
            </div>
          </div>

          <div className="efsw-profile__editor-controls">
            <div className="efsw-profile__editor-control">
              <label htmlFor="avatar-zoom">
                Zoom <span>{Math.round(zoom * 100)}%</span>
              </label>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <div className="efsw-profile__editor-axis">
                <button type="button" onClick={() => setZoom(Math.max(1, +(zoom - 0.1).toFixed(2)))}>−</button>
                <button type="button" onClick={() => setZoom(Math.min(2.5, +(zoom + 0.1).toFixed(2)))}>+</button>
                <button type="button" className="is-reset" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}>
                  Reset
                </button>
              </div>
            </div>

            <div className="efsw-profile__editor-control">
              <label htmlFor="avatar-x">
                Position <span>{(offsetX * 100).toFixed(0)}, {(offsetY * 100).toFixed(0)}</span>
              </label>
              <div className="efsw-profile__editor-position">
                <div>
                  <span>↔</span>
                  <input
                    id="avatar-x"
                    type="range"
                    min={-1}
                    max={1}
                    step={0.02}
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                  />
                </div>
                <div>
                  <span>↕</span>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.02}
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    aria-label="Vertical position"
                  />
                </div>
              </div>
            </div>

            <p className="efsw-profile__editor-hint">
              Tip: drag the preview to fine-tune the framing.
            </p>
          </div>
        </div>

        <footer className="efsw-profile__modal-foot">
          <button type="button" className="efsw-profile__btn-ghost" onClick={onCancel} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="efsw-profile__btn-primary"
            onClick={() => onSave({ src, zoom, offsetX, offsetY })}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="efsw-profile__savebar-spinner" /> Saving…
              </>
            ) : (
              <>
                <Check size={14} /> Apply
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}