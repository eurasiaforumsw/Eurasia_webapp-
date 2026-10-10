"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Lock, UserPlus, X } from "lucide-react";
import BubbleButton from "@/components/ui/BubbleButton";

interface RegistrationSettings {
  registrationEnabled: boolean;
  registrationStartsAt: string | null;
  registrationEndsAt: string | null;
  maxAttendees: number | null;
  currentRegistrations: number;
}

interface RegistrationButtonProps {
  eventId: string;
  onOpenModal?: () => void;
  className?: string;
}

type ButtonState =
  | "loading"
  | "not-logged-in"
  | "registration-closed"
  | "registration-not-started"
  | "registration-ended"
  | "event-full"
  | "already-registered"
  | "can-register";

/**
 * Event registration button with multiple states
 * - Shows different UI based on auth status, registration settings, and user registration status
 * - Integrates with BubbleButton for consistent EFSW styling
 * - Displays tooltip with registration period information
 */
export default function RegistrationButton({
  eventId,
  onOpenModal,
  className = "",
}: RegistrationButtonProps) {
  const [state, setState] = useState<ButtonState>("loading");
  const [settings, setSettings] = useState<RegistrationSettings | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        // Check auth status
        const authRes = await fetch("/api/auth/status");
        const authData = await authRes.json();
        setIsLoggedIn(authData.authenticated);

        // Fetch registration settings
        const settingsRes = await fetch(`/api/events/${eventId}/registration-settings`);
        if (!settingsRes.ok) {
          setState("registration-closed");
          return;
        }

        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        // Check if user is already registered (only if logged in)
        if (authData.authenticated) {
          const registrationRes = await fetch(`/api/events/${eventId}/registration-status`);
          if (registrationRes.ok) {
            const regData = await registrationRes.json();
            if (regData.registered) {
              setState("already-registered");
              return;
            }
          }
        }

        // Determine button state based on settings
        if (!settingsData.registrationEnabled) {
          setState("registration-closed");
        } else if (settingsData.registrationStartsAt) {
          const startsAt = new Date(settingsData.registrationStartsAt);
          if (startsAt > new Date()) {
            setState("registration-not-started");
            return;
          }
        }

        if (settingsData.registrationEndsAt) {
          const endsAt = new Date(settingsData.registrationEndsAt);
          if (endsAt < new Date()) {
            setState("registration-ended");
            return;
          }
        }

        if (
          settingsData.maxAttendees &&
          settingsData.currentRegistrations >= settingsData.maxAttendees
        ) {
          setState("event-full");
          return;
        }

        if (!authData.authenticated) {
          setState("not-logged-in");
        } else {
          setState("can-register");
        }
      } catch (error) {
        console.error("Failed to check registration status:", error);
        setState("registration-closed");
      }
    }

    checkStatus();
  }, [eventId]);

  const handleClick = () => {
    if (state === "not-logged-in") {
      // Redirect to login with return URL
      window.location.href = `/login?returnTo=/events/${eventId}`;
    } else if (state === "can-register" && onOpenModal) {
      onOpenModal();
    }
  };

  const getTooltipContent = () => {
    if (!settings) return null;

    const parts: string[] = [];

    if (settings.registrationStartsAt) {
      const startsAt = new Date(settings.registrationStartsAt);
      parts.push(`Opens: ${formatDate(startsAt)}`);
    }

    if (settings.registrationEndsAt) {
      const endsAt = new Date(settings.registrationEndsAt);
      parts.push(`Closes: ${formatDate(endsAt)}`);
    }

    if (settings.maxAttendees) {
      parts.push(
        `${settings.currentRegistrations}/${settings.maxAttendees} registered`
      );
    }

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  const renderButton = () => {
    switch (state) {
      case "loading":
        return (
          <BubbleButton disabled className={className}>
            <Clock className="w-4 h-4 inline-block mr-2" />
            Loading...
          </BubbleButton>
        );

      case "not-logged-in":
        return (
          <BubbleButton
            variant="primary"
            onClick={handleClick}
            className={className}
          >
            <Lock className="w-4 h-4 inline-block mr-2" />
            Login to Register
          </BubbleButton>
        );

      case "registration-closed":
        return (
          <BubbleButton disabled className={className}>
            <X className="w-4 h-4 inline-block mr-2" />
            Registration Closed
          </BubbleButton>
        );

      case "registration-not-started":
        return (
          <BubbleButton disabled className={className}>
            <Clock className="w-4 h-4 inline-block mr-2" />
            Registration Opens Soon
          </BubbleButton>
        );

      case "registration-ended":
        return (
          <BubbleButton disabled className={className}>
            <X className="w-4 h-4 inline-block mr-2" />
            Registration Ended
          </BubbleButton>
        );

      case "event-full":
        return (
          <BubbleButton disabled className={className}>
            <X className="w-4 h-4 inline-block mr-2" />
            Event Full
          </BubbleButton>
        );

      case "already-registered":
        return (
          <BubbleButton variant="success" disabled className={className}>
            <Check className="w-4 h-4 inline-block mr-2" />
            You are Registered
          </BubbleButton>
        );

      case "can-register":
        return (
          <BubbleButton
            variant="primary"
            onClick={handleClick}
            className={className}
          >
            <UserPlus className="w-4 h-4 inline-block mr-2" />
            Register Now
          </BubbleButton>
        );

      default:
        return null;
    }
  };

  const tooltipContent = getTooltipContent();

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {renderButton()}
      </div>

      {showTooltip && tooltipContent && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0A0D12] text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          {tooltipContent}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #0A0D12",
            }}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
