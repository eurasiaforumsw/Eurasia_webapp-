import { Camera, CheckCircle2, Sparkles } from "lucide-react";
import { MemberProfile } from "@/lib/member-auth";
import { AvatarSettings } from "@/hooks/useProfileEdit";

interface ProfileHeaderProps {
  member: MemberProfile;
  completion: number;
  avatar: AvatarSettings | null;
  onEditAvatar: () => void;
}

const typeLabels = {
  professional: "Professional member",
  student: "Student member",
  institutional: "Institutional member",
};

const statusLabels: Record<string, string> = {
  active: "Active member",
  pending: "Application pending",
  suspended: "Suspended",
};

export function ProfileHeader({
  member,
  completion,
  avatar,
  onEditAvatar,
}: ProfileHeaderProps) {
  const displayName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ") || member.fullName || "Member";

  return (
    <header className="efsw-profile-header">
      {/* Avatar Section */}
      <div className="efsw-profile-avatar-wrapper">
        <button
          type="button"
          onClick={onEditAvatar}
          className="efsw-profile-avatar"
          aria-label="Change profile photo"
        >
          {avatar?.src ? (
            <img
              src={avatar.src}
              alt={displayName}
              style={{
                transform: `scale(${avatar.zoom}) translate(${avatar.offsetX * 50}%, ${avatar.offsetY * 50}%)`,
              }}
            />
          ) : (
            <div className="efsw-profile-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="efsw-profile-avatar-overlay">
            <Camera size={18} />
          </span>
        </button>

        {/* Completion Badge */}
        {completion < 100 && (
          <div className="efsw-profile-completion" title={`Profile ${completion}% complete`}>
            <svg viewBox="0 0 36 36" className="efsw-profile-completion-ring">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.15"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${completion}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span>{completion}%</span>
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="efsw-profile-header-info">
        <div className="efsw-profile-header-title">
          <h1>{displayName}</h1>
          {member.status === "active" && (
            <span className="efsw-profile-badge efsw-profile-badge--verified" title="Verified member">
              <CheckCircle2 size={14} />
              Verified
            </span>
          )}
        </div>

        <div className="efsw-profile-header-meta">
          <span className="efsw-profile-badge efsw-profile-badge--type">
            {typeLabels[member.membershipType as keyof typeof typeLabels] || member.membershipType}
          </span>
          {" "}
          <span className="efsw-profile-badge efsw-profile-badge--status">
            {statusLabels[member.status] || member.status}
          </span>
        </div>

        {completion === 100 && (
          <div className="efsw-profile-complete-badge">
            <Sparkles size={14} />
            <span>Profile complete</span>
          </div>
        )}
      </div>
    </header>
  );
}
