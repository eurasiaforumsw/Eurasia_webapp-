import { useState, useEffect } from "react";
import { getSessionMember, MemberProfile, refreshSessionMember } from "@/lib/member-auth";

/**
 * Custom hook for managing member profile data
 * Handles fetching, syncing, and state management
 */
export function useProfileData() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadProfile = () => {
      try {
        setLoading(true);
        setError("");
        const currentMember = getSessionMember();
        setMember(currentMember);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Refresh from remote if available
    refreshSessionMember().then((fresh) => {
      if (fresh) setMember(fresh);
    });

    // Listen for storage events (profile updates from other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "efsw_member_session" || e.key === "efsw_members") {
        loadProfile();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refresh = async () => {
    const updated = await refreshSessionMember();
    if (updated) {
      setMember(updated);
    }
    return updated;
  };

  return { member, loading, error, refresh };
}
