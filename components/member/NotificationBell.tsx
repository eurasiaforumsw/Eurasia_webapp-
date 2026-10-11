'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        const newCount = data.unreadCount || 0;

        // Trigger pulse animation if count increased
        if (newCount > unreadCount) {
          setHasNewMessage(true);
          setTimeout(() => setHasNewMessage(false), 2000);
        }

        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [unreadCount]);

  const handleClick = () => {
    router.push('/user/messages');
  };

  return (
    <button
      onClick={handleClick}
      className="notification-bell-button"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <div className="notification-bell-icon-wrapper">
        <Bell
          className={`notification-bell-icon ${hasNewMessage ? 'notification-bell-pulse' : ''}`}
          size={20}
          strokeWidth={2}
        />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      <style jsx>{`
        .notification-bell-button {
          position: fixed;
          top: clamp(1rem, 3vw, 1.5rem);
          right: clamp(1rem, 3vw, 1.5rem);
          z-index: 1000;
          background: rgba(15, 19, 28, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: clamp(0.625rem, 2vw, 0.75rem);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .notification-bell-button:hover {
          background: rgba(22, 29, 43, 0.98);
          border-color: rgba(56, 189, 248, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(56, 189, 248, 0.15);
        }

        .notification-bell-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .notification-bell-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(1.25rem, 4vw, 1.5rem);
          height: clamp(1.25rem, 4vw, 1.5rem);
        }

        .notification-bell-icon {
          color: rgba(255, 255, 255, 0.9);
          transition: color 0.3s ease;
        }

        .notification-bell-button:hover .notification-bell-icon {
          color: #38BDF8;
        }

        .notification-bell-pulse {
          animation: bellPulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) 3;
        }

        @keyframes bellPulse {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-15deg) scale(1.1);
          }
          50% {
            transform: rotate(15deg) scale(1.1);
          }
          75% {
            transform: rotate(-10deg) scale(1.05);
          }
        }

        .notification-bell-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: clamp(1rem, 3vw, 1.25rem);
          height: clamp(1rem, 3vw, 1.25rem);
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: white;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(0.625rem, 1.5vw, 0.75rem);
          font-weight: 700;
          line-height: 1;
          padding: 0 clamp(0.25rem, 1vw, 0.375rem);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(15, 19, 28, 1);
          animation: badgeAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
        }

        @keyframes badgeAppear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Mobile optimization - ensure touch target is large enough */
        @media (max-width: 640px) {
          .notification-bell-button {
            min-width: 2.75rem;
            min-height: 2.75rem;
            padding: 0.75rem;
          }
        }

        /* Tablet adjustments */
        @media (min-width: 641px) and (max-width: 1024px) {
          .notification-bell-button {
            top: 1.25rem;
            right: 1.25rem;
          }
        }

        /* Prevent layout issues on very small screens */
        @media (max-width: 360px) {
          .notification-bell-button {
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.5rem;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .notification-bell-button {
            border-width: 0.5px;
          }
        }

        /* Dark mode enhancements */
        @media (prefers-color-scheme: dark) {
          .notification-bell-button {
            background: rgba(15, 19, 28, 0.98);
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .notification-bell-button,
          .notification-bell-icon,
          .notification-bell-badge {
            animation: none;
            transition: none;
          }

          .notification-bell-pulse {
            animation: none;
          }
        }
      `}</style>
    </button>
  );
}
