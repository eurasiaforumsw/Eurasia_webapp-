"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, ChevronDown, Globe2, LogIn, Menu, UserPlus, X } from "lucide-react";

const MotionLink = motion(Link);
import { useI18n } from "@/contexts/I18nContext";
import { useClickOutside } from "@/hooks/useClickOutside";

type NavNode = {
  /** Route the label links to. */
  href: string;
  /** Key inside the `navigation` namespace of each locale file. */
  labelKey: string;
  children?: { href: string; labelKey: string }[];
};

const NAV_NODES: NavNode[] = [
  { href: "/", labelKey: "home" },
  {
    href: "/about",
    labelKey: "about",
    children: [
      { href: "/about", labelKey: "overview" },
      { href: "/about/organization", labelKey: "organization" },
    ],
  },
  { href: "/news", labelKey: "news" },
  { href: "/academic-documents", labelKey: "academicDocuments" },
];

const LOCALE_OPTIONS = [
  { code: "en", label: "English", short: "EN" },
  { code: "th", label: "ไทย", short: "TH" },
  { code: "ko", label: "한국어", short: "KO" },
] as const;

const LANGUAGE_KEY = "language";

// Hover intent: a short open delay stops the panel from flashing while the
// pointer travels across the bar, and a longer close delay keeps it stable
// when the pointer clips a corner on the way to an item.
const HOVER_OPEN_DELAY = 70;
const HOVER_CLOSE_DELAY = 220;

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const pendingFocus = useRef<"first" | "last" | null>(null);

  // A single open key is the only source of truth for every panel, so hover,
  // click, and keyboard can never disagree about what is on screen.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileExpandedKey, setMobileExpandedKey] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(false);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const openNow = useCallback((key: string) => {
    clearHoverTimer();
    setOpenKey(key);
  }, [clearHoverTimer]);

  const closeNow = useCallback(() => {
    clearHoverTimer();
    setOpenKey(null);
  }, [clearHoverTimer]);

  const scheduleOpen = useCallback((key: string) => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => setOpenKey(key), HOVER_OPEN_DELAY);
  }, [clearHoverTimer]);

  const scheduleClose = useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => setOpenKey(null), HOVER_CLOSE_DELAY);
  }, [clearHoverTimer]);

  useEffect(() => clearHoverTimer, [clearHoverTimer]);

  // Hover-to-open only belongs on devices with a real pointer. On touch the
  // first tap opens the panel instead, so the trigger never needs two taps.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverCapable(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useClickOutside(headerRef, closeNow, openKey !== null);

  // Any route change leaves the bar in a resting state.
  useEffect(() => {
    setOpenKey(null);
    setSheetOpen(false);
    setMobileExpandedKey(null);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenKey(null);
      setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  // Scroll state and the progress rail share one rAF, and the rail is written
  // straight to the DOM so scrolling never triggers a React render.
  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const offset = window.scrollY;
      setScrolled(offset > 12);

      const range = document.documentElement.scrollHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(1, Math.max(0, offset / range)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const request = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Keyboard entry into a panel has to wait for the open state to commit,
  // because a hidden panel has no focusable items yet.
  useEffect(() => {
    if (!openKey || !pendingFocus.current) return;
    const group = headerRef.current?.querySelector(`[data-group="${openKey}"]`);
    const items = group ? Array.from(group.querySelectorAll<HTMLElement>("[data-menu-item]")) : [];
    const target = pendingFocus.current === "first" ? items[0] : items[items.length - 1];
    pendingFocus.current = null;
    target?.focus();
  }, [openKey]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const handleGroupKeyDown = (key: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const group = event.currentTarget;
    const items = Array.from(group.querySelectorAll<HTMLElement>("[data-menu-item]"));
    const trigger = group.querySelector<HTMLElement>("[data-menu-trigger]");
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape":
        if (openKey !== key) return;
        event.preventDefault();
        closeNow();
        trigger?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (index >= 0) {
          items[Math.min(index + 1, items.length - 1)]?.focus();
        } else if (openKey === key) {
          // Already open (hover or a previous keypress got there first), so
          // `openNow` would be a no-op and the focus effect would never fire.
          // Step into the panel directly instead.
          items[0]?.focus();
        } else {
          pendingFocus.current = "first";
          openNow(key);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (index <= 0) {
          closeNow();
          trigger?.focus();
        } else {
          items[index - 1]?.focus();
        }
        break;
      case "Home":
        if (index < 0) return;
        event.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        if (index < 0) return;
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  };

  // Focus leaving the group closes it, which is what makes Tab feel natural.
  const handleGroupBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    closeNow();
  };

  const hoverProps = (key: string) =>
    hoverCapable
      ? {
          onPointerEnter: (event: React.PointerEvent) => {
            if (event.pointerType === "touch") return;
            scheduleOpen(key);
          },
          onPointerLeave: (event: React.PointerEvent) => {
            if (event.pointerType === "touch") return;
            scheduleClose();
          },
        }
      : {};

  const activeLocale = LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];
  const languageLabel = t("navigation." + LANGUAGE_KEY);
  const loginLabel = t("navigation.login");
  const registerLabel = t("navigation.register");
  const menuLabel = t("navigation.menu");

  return (
    <>
      <header ref={headerRef} className="efsw-nav" data-scrolled={scrolled}>
        <div className="efsw-nav__inner">
          <Link className="efsw-brand efsw-nav__brand" href="/" aria-label="Eurasia Forum for Social Workers — home">
            <span className="efsw-brand__mark" aria-hidden="true">E</span>
            <span className="efsw-nav__brand-text">
              Eurasia Forum
              <br />
              for Social Workers
            </span>
          </Link>

          <nav className="efsw-nav__links" aria-label="Primary">
            {NAV_NODES.map((node) => {
              const label = t("navigation." + node.labelKey);
              const active = isActive(node.href);

              if (!node.children) {
                return (
                  <Link
                    key={node.href}
                    className="efsw-nav__link"
                    href={node.href}
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              }

              const open = openKey === node.labelKey;

              return (
                <div
                  key={node.href}
                  className="efsw-nav__group"
                  data-group={node.labelKey}
                  data-open={open}
                  onKeyDown={handleGroupKeyDown(node.labelKey)}
                  onBlur={handleGroupBlur}
                  {...hoverProps(node.labelKey)}
                >
                  <Link
                    className="efsw-nav__link efsw-nav__trigger"
                    href={node.href}
                    data-menu-trigger
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    aria-expanded={open}
                    onFocus={() => openNow(node.labelKey)}
                    onClick={(event) => {
                      // Without a hover pointer, the first tap reveals the panel
                      // rather than navigating past it.
                      if (hoverCapable) return;
                      event.preventDefault();
                      if (open) closeNow();
                      else openNow(node.labelKey);
                    }}
                  >
                    {label}
                    <ChevronDown className="efsw-nav__chev" size={13} strokeWidth={2.2} aria-hidden="true" />
                  </Link>

                  <div className="efsw-nav__panel-wrap">
                    <div className="efsw-nav__panel">
                      {node.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            data-menu-item
                            data-active={childActive}
                            aria-current={childActive ? "page" : undefined}
                            tabIndex={open ? 0 : -1}
                            onClick={closeNow}
                          >
                            <span>{t("navigation." + child.labelKey)}</span>
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="efsw-nav__actions">
            <div
              className="efsw-nav__group efsw-nav__group--end"
              data-group={LANGUAGE_KEY}
              data-open={openKey === LANGUAGE_KEY}
              onKeyDown={handleGroupKeyDown(LANGUAGE_KEY)}
              onBlur={handleGroupBlur}
            >
              <button
                type="button"
                className="efsw-nav__lang"
                data-menu-trigger
                aria-expanded={openKey === LANGUAGE_KEY}
                aria-label={languageLabel + ": " + activeLocale.label}
                onClick={() => (openKey === LANGUAGE_KEY ? closeNow() : openNow(LANGUAGE_KEY))}
              >
                <Globe2 size={15} strokeWidth={1.9} aria-hidden="true" />
                <span>{activeLocale.short}</span>
                <ChevronDown className="efsw-nav__chev" size={12} strokeWidth={2.2} aria-hidden="true" />
              </button>

              <div className="efsw-nav__panel-wrap">
                <div className="efsw-nav__panel efsw-nav__panel--lang" role="group" aria-label={languageLabel}>
                  {LOCALE_OPTIONS.map((option) => {
                    const selected = option.code === locale;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        data-menu-item
                        data-active={selected}
                        aria-pressed={selected}
                        tabIndex={openKey === LANGUAGE_KEY ? 0 : -1}
                        onClick={() => {
                          setLocale(option.code);
                          closeNow();
                        }}
                      >
                        <span>{option.label}</span>
                        {selected
                          ? <Check size={15} aria-hidden="true" />
                          : <span className="efsw-nav__panel-meta">{option.short}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link className="efsw-nav__login" href="/member/login" aria-label={loginLabel}>
              <LogIn size={15} strokeWidth={1.9} aria-hidden="true" />
              <span className="efsw-nav__login-text">{loginLabel}</span>
            </Link>

            <MotionLink
              className="efsw-nav__join"
              href="/member/register"
              whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 420, damping: 26 } }}
              whileTap={{  scale: 0.96, transition: { type: "spring", stiffness: 500, damping: 30 } }}
            >
              <UserPlus size={15} strokeWidth={1.9} aria-hidden="true" />
              <span>{registerLabel}</span>
              <span className="efsw-nav__join-icon" aria-hidden="true">
                <ArrowUpRight size={15} strokeWidth={2} />
              </span>
            </MotionLink>

            <button
              type="button"
              className="efsw-nav__toggle"
              aria-expanded={sheetOpen}
              aria-controls="efsw-mobile-menu"
              aria-label={menuLabel}
              onClick={() => {
                closeNow();
                const next = !sheetOpen;
                setMobileExpandedKey(next && pathname.startsWith("/about") ? "about" : null);
                setSheetOpen(next);
              }}
            >
              {sheetOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <span className="efsw-nav__progress" aria-hidden="true">
          <span ref={progressRef} />
        </span>
      </header>

      <div className="efsw-sheet" id="efsw-mobile-menu" data-open={sheetOpen}>
        <div className="efsw-sheet__scrim" role="presentation" onClick={() => setSheetOpen(false)} />
        <div
          className="efsw-sheet__panel"
          role="dialog"
          aria-modal="true"
          aria-label={menuLabel}
          data-lenis-prevent
        >
          <p className="efsw-sheet__eyebrow">{menuLabel}</p>

          <nav className="efsw-sheet__nav" aria-label="Mobile">
            {NAV_NODES.map((node, index) => (
              <div className="efsw-sheet__group" key={node.href} data-expanded={mobileExpandedKey === node.labelKey}>
                {node.children ? (
                  <button
                    type="button"
                    aria-expanded={mobileExpandedKey === node.labelKey}
                    aria-controls={`mobile-sub-${node.labelKey}`}
                    onClick={() => setMobileExpandedKey((current) => current === node.labelKey ? null : node.labelKey)}
                  >
                    <span className="efsw-sheet__index">{String(index + 1).padStart(2, "0")}</span>
                    <span>{t("navigation." + node.labelKey)}</span>
                    <ChevronDown className="efsw-sheet__expand" size={19} aria-hidden="true" />
                  </button>
                ) : (
                  <Link href={node.href} data-active={isActive(node.href)} onClick={() => setSheetOpen(false)}>
                    <span className="efsw-sheet__index">{String(index + 1).padStart(2, "0")}</span>
                    <span>{t("navigation." + node.labelKey)}</span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                )}
                {node.children && (
                  <div className="efsw-sheet__sub" id={`mobile-sub-${node.labelKey}`}>
                    {node.children.map((child) => (
                      <Link key={child.href} href={child.href} onClick={() => setSheetOpen(false)}>
                        {t("navigation." + child.labelKey)}
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="efsw-sheet__langs" role="group" aria-label={languageLabel}>
            {LOCALE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                data-active={option.code === locale}
                aria-pressed={option.code === locale}
                onClick={() => setLocale(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="efsw-sheet__actions">
            <Link className="efsw-sheet__login" href="/member/login" onClick={() => setSheetOpen(false)}>
              <LogIn size={17} aria-hidden="true" /> {loginLabel}
            </Link>
            <MotionLink
              className="efsw-nav__join"
              href="/member/register"
              onClick={() => setSheetOpen(false)}
              whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 500, damping: 30 } }}
            >
              <UserPlus size={15} strokeWidth={1.9} aria-hidden="true" />
              <span>{registerLabel}</span>
              <span className="efsw-nav__join-icon" aria-hidden="true">
                <ArrowUpRight size={15} strokeWidth={2} />
              </span>
            </MotionLink>
          </div>
        </div>
      </div>
    </>
  );
}

export default SiteNav;
