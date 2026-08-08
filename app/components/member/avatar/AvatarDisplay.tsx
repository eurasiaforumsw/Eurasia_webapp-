import { useState, useEffect } from 'react';

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  userName?: string;
  size?: number;
  isLoading?: boolean;
}

export function AvatarDisplay({
  avatarUrl,
  userName = 'User',
  size = 48,
  isLoading = false
}: AvatarDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [avatarUrl]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(userName);
  const showImage = avatarUrl && !imageError;

  return (
    <div
      className="avatar-display"
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={`${userName} avatar`}
          className={`avatar-display__image ${imageLoaded ? 'avatar-display__image--loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="avatar-display__fallback">
          <span
            className="avatar-display__initials"
            style={{ fontSize: `${size * 0.4}px` }}
          >
            {initials}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="avatar-display__spinner">
          <svg className="avatar-display__spinner-svg" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        </div>
      )}

      <style jsx>{`
        .avatar-display {
          --surface-02: #0F131C;
          --surface-03: #161D2B;
          --accent: #38BDF8;
          --text-primary: #E5E7EB;
          --text-secondary: #9CA3AF;
          --radius-circle: 50%;

          position: relative;
          border-radius: var(--radius-circle);
          overflow: hidden;
          background: var(--surface-03);
        }

        .avatar-display__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .avatar-display__image--loaded {
          opacity: 1;
        }

        .avatar-display__fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--surface-03) 0%, var(--surface-02) 100%);
        }

        .avatar-display__initials {
          color: var(--accent);
          font-weight: 600;
          letter-spacing: -0.02em;
          user-select: none;
        }

        .avatar-display__spinner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 7, 12, 0.75);
        }

        .avatar-display__spinner-svg {
          width: 40%;
          height: 40%;
          color: var(--accent);
          animation: avatar-spin 1s linear infinite;
        }

        @keyframes avatar-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
