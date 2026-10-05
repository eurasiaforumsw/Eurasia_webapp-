"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { type MemberProfile } from "@/lib/member-auth";
import { logoutMember } from "@/lib/member-auth";
import { useI18n } from "@/contexts/I18nContext";

/* Member avatar dropdown — top-right of the desktop nav.
 *
 * The button is a 36px circle that mirrors the existing nav pill style:
 * ghost background, soft border, ink-green tint on hover. Clicking reveals
 * a downward-anchored panel with:
 *   • member identity card (avatar / email / name)
 *   • three primary actions (Profile · Messages · Interest)
 *   • divider + Logout
 *
 * The panel springs into place (scale 0.96 → 1, opacity 0 → 1) and uses
 * backdrop-blur so the nav stays legible behind it. Clicking outside,
 * pressing Escape, or navigating closes it without a focus trap because
 * this isn't a modal, just a menu.
 */

type MemberMenuProps = {
  member: MemberProfile;
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase().slice(0, 2);
};

const prefersReducedMotion = () =>
  typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function MemberMenu({ member }: MemberMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  /* Close on outside-click, Escape, and any route change. The route-change
     close prevents stale `open=true` from a profile link click that has
     already moved the user elsewhere. */
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logoutMember();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const primaryName = member.fullName || member.email;
  const avatarLetter = initials(primaryName);

  const menuLinks: Array<{ href: string; icon: LucideIcon; labelKey: string }> = [
    { href: "/user/profile", icon: User, labelKey: "user.menu.profile" },
    { href: "/user/messages", icon: MessageSquare, labelKey: "user.menu.messages" },
    { href: "/user/interest", icon: Heart, labelKey: "user.menu.interest" },
  ];

  return (
    <div ref={containerRef} className="efsw-member-menu" data-open={open}>
      <button
        ref={buttonRef}
        type="button"
        className="efsw-member-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("user.menu.open")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="efsw-member-menu__avatar" aria-hidden="true">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" />
          ) : (
            <span className="efsw-member-menu__initials">{avatarLetter}</span>
          )}
          {/* Subtle ring tightens on open so the user knows the menu is
              active without a hard border swap. */}
          <span className="efsw-member-menu__ring" aria-hidden="true" />
        </span>
        <ChevronDown size={13} strokeWidth={2} className="efsw-member-menu__chev" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reducedMotion.current ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
            animate={reducedMotion.current ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion.current ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="efsw-member-menu__panel"
            role="menu"
            aria-label={t("user.menu.open")}
          >
            <header className="efsw-member-menu__header">
              <div className="efsw-member-menu__identity">
                <div className="efsw-member-menu__avatar efsw-member-menu__avatar--lg" aria-hidden="true">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" />
                  ) : (
                    <span className="efsw-member-menu__initials">{avatarLetter}</span>
                  )}
                </div>
                <div className="efsw-member-menu__identity-meta">
                  <span className="efsw-member-menu__name">{primaryName}</span>
                  <span className="efsw-member-menu__email">{member.email}</span>
                  <span className="efsw-member-menu__role">
                    <Sparkles size={11} strokeWidth={2.2} aria-hidden="true" />
                    {member.membershipType}
                  </span>
                </div>
              </div>
            </header>

            <nav className="efsw-member-menu__nav" aria-label={t("user.menu.open")}>
              {menuLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="efsw-member-menu__item"
                    data-active={pathname.startsWith(link.href) ? "true" : undefined}
                    style={
                      reducedMotion.current
                        ? undefined
                        : {
                            animationDelay: `${idx * 45}ms`,
                          }
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span className="efsw-member-menu__item-icon">
                      <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="efsw-member-menu__item-label">{t(link.labelKey)}</span>
                    <span className="efsw-member-menu__item-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                );
              })}
            </nav>

            <footer className="efsw-member-menu__footer">
              <button
                type="button"
                className="efsw-member-menu__logout"
                onClick={handleLogout}
                role="menuitem"
              >
                <span className="efsw-member-menu__item-icon">
                  <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span>{t("user.menu.logout")}</span>
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MemberMenu;