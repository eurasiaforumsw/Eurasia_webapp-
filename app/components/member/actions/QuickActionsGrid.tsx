'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Mail,
  Edit,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  type LucideIcon
} from 'lucide-react';

interface Action {
  label: string;
  href?: string;
  onClick?: string;
  icon: string;
  badge?: boolean;
  description?: string;
}

interface QuickActionsGridProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  onEditProfile?: () => void;
  onLogout?: () => void;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Mail,
  Edit,
  Settings,
  Bell,
  HelpCircle,
  LogOut
};

const actions: Record<string, Action> = {
  dashboard: {
    label: 'Dashboard',
    href: '/member/dashboard',
    icon: 'LayoutDashboard',
    description: 'View your overview'
  },
  messages: {
    label: 'Messages',
    href: '/member/messages',
    icon: 'Mail',
    badge: true,
    description: 'Check your inbox'
  },
  editProfile: {
    label: 'Edit Profile',
    onClick: 'toggleEditMode',
    icon: 'Edit',
    description: 'Update your info'
  },
  settings: {
    label: 'Settings',
    href: '/member/settings',
    icon: 'Settings',
    description: 'Manage preferences'
  },
  notifications: {
    label: 'Notifications',
    href: '/member/notifications',
    icon: 'Bell',
    badge: true,
    description: 'View updates'
  },
  help: {
    label: 'Help',
    href: '/member/help',
    icon: 'HelpCircle',
    description: 'Get support'
  },
  logout: {
    label: 'Logout',
    onClick: 'handleLogout',
    icon: 'LogOut',
    description: 'Sign out'
  }
};

export function QuickActionsGrid({
  unreadMessages = 0,
  unreadNotifications = 0,
  onEditProfile,
  onLogout,
  className = ''
}: QuickActionsGridProps) {
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  const handleAction = (actionKey: string) => {
    setIsAnimating(actionKey);
    setTimeout(() => setIsAnimating(null), 300);

    if (actionKey === 'editProfile' && onEditProfile) {
      onEditProfile();
    } else if (actionKey === 'logout' && onLogout) {
      onLogout();
    }
  };

  const getBadgeCount = (actionKey: string): number => {
    if (actionKey === 'messages') return unreadMessages;
    if (actionKey === 'notifications') return unreadNotifications;
    return 0;
  };

  return (
    <>
      <style jsx>{`
        .quick-actions-grid {
          --surface-1: #05070C;
          --surface-2: #0A0D12;
          --surface-3: #0F131C;
          --surface-4: #161D2B;
          --surface-5: #1E2636;
          --accent: #38BDF8;
          --accent-hover: #7DD3FC;
          --text-primary: #F8FAFC;
          --text-secondary: #CBD5E1;
          --text-muted: #64748B;
          --spacing-xs: clamp(0.25rem, 0.5vw, 0.5rem);
          --spacing-sm: clamp(0.5rem, 1vw, 0.75rem);
          --spacing-md: clamp(0.75rem, 1.5vw, 1rem);
          --spacing-lg: clamp(1rem, 2vw, 1.5rem);
          --spacing-xl: clamp(1.5rem, 3vw, 2rem);
          --radius-full: 999px;
          --radius-lg: 16px;
          --radius-md: 12px;
          --font-display: system-ui, -apple-system, sans-serif;
          --font-body: system-ui, -apple-system, sans-serif;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--surface-2);
          border-radius: var(--radius-lg);
          font-family: var(--font-body);
        }

        @media (min-width: 640px) {
          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .quick-actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .action-card {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto;
          gap: var(--spacing-sm) var(--spacing-md);
          align-items: start;
          padding: var(--spacing-lg);
          background: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
        }

        .action-card:hover {
          background: var(--surface-4);
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .action-card:active {
          transform: translateY(0);
        }

        .action-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .action-card.animating {
          animation: pulse 0.3s ease;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }

        .action-icon-wrapper {
          grid-row: 1 / 2;
          grid-column: 1 / 2;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(2.5rem, 5vw, 3rem);
          height: clamp(2.5rem, 5vw, 3rem);
          background: var(--surface-4);
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .action-card:hover .action-icon-wrapper {
          background: var(--accent);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
        }

        .action-icon {
          width: clamp(1.25rem, 2.5vw, 1.5rem);
          height: clamp(1.25rem, 2.5vw, 1.5rem);
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }

        .action-card:hover .action-icon {
          color: var(--surface-1);
        }

        .action-content {
          grid-row: 1 / 2;
          grid-column: 2 / 3;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .action-label {
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .action-description {
          font-size: clamp(0.75rem, 1.2vw, 0.875rem);
          color: var(--text-muted);
          line-height: 1.4;
        }

        .badge-wrapper {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
        }

        .notification-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: clamp(1.25rem, 2.5vw, 1.5rem);
          height: clamp(1.25rem, 2.5vw, 1.5rem);
          padding: 0 var(--spacing-xs);
          background: var(--accent);
          color: var(--surface-1);
          font-size: clamp(0.625rem, 1vw, 0.75rem);
          font-weight: 700;
          border-radius: var(--radius-full);
          box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
        }
      `}</style>

      <div className={`quick-actions-grid ${className}`} role="navigation" aria-label="Quick actions menu">
        {Object.entries(actions).map(([key, action]) => {
          const Icon = iconMap[action.icon];
          const badgeCount = action.badge ? getBadgeCount(key) : 0;
          const isAction = !!action.onClick;

          const cardContent = (
            <>
              <div className="action-icon-wrapper">
                <Icon className="action-icon" />
              </div>
              <div className="action-content">
                <span className="action-label">{action.label}</span>
                {action.description && (
                  <span className="action-description">{action.description}</span>
                )}
              </div>
              {badgeCount > 0 && (
                <div className="badge-wrapper">
                  <span className="notification-badge" aria-label={`${badgeCount} unread`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                </div>
              )}
            </>
          );

          if (isAction) {
            return (
              <button
                key={key}
                type="button"
                className={`action-card ${isAnimating === key ? 'animating' : ''}`}
                onClick={() => handleAction(key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAction(key);
                  }
                }}
                aria-label={action.label}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <Link
              key={key}
              href={action.href!}
              className={`action-card ${isAnimating === key ? 'animating' : ''}`}
              onClick={() => handleAction(key)}
              aria-label={action.label}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </>
  );
}
