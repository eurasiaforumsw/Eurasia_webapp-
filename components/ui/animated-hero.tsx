"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import type { AdminHeroScene } from "@/lib/admin-data";
import {
  ArrowDown,
  ArrowUpRight,
  MoveRight,
} from "lucide-react";

/* ── Motion tokens — mirror the site's spring physics ────────────────────── */
const dramatic = { type: "spring" as const, stiffness: 280, damping: 20, mass: 1.0 };
const natural  = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };
const snappy   = { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 };

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.085, delayChildren: 0.1 } },
} as const;

const heroItem = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0, transition: dramatic },
} as const;

const heroItemSoft = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: natural },
} as const;

const heroMeta = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

/* Cycling words that reflect the EFSW mission */
const CYCLING_WORDS = ["connects", "empowers", "advocates", "transforms", "unites"];

interface AnimatedHeroProps {
  headline?: string;
  subheadline?: string;
  tagline?: string;
  ctaText?: string;
  ctaLink?: string;
  /** Multi-scene carousel — when at least one scene is provided, the
   *  background cycles through them. Image scenes advance after
   *  `durationSec`; video scenes advance when playback ends. */
  scenes?: AdminHeroScene[];
  /** Optional ambient background video + poster (legacy — from the
   *  admin layout, used as a single-scene fallback). */
  bgVideoUrl?: string;
  bgPosterUrl?: string;
  /** Optional announcement bar — when provided, replaces the default hero copy
      with a featured announcement (image/video bg + message + detail link). */
  announcementTitle?: string;
  announcementSummary?: string;
  announcementLink?: string;
  announcementLinkLabel?: string;
}

function AnimatedHero({
  headline,
  subheadline = "The Eurasia Forum for Social Workers connects practitioners, educators, students, and institutions across continents.",
  tagline = "Bridging practice, policy, and education across Eurasia",
  ctaText = "Join the Network",
  ctaLink = "/member",
  scenes,
  bgVideoUrl,
  bgPosterUrl,
  announcementTitle,
  announcementSummary,
  announcementLink,
  announcementLinkLabel = "More details",
}: AnimatedHeroProps) {
  const reducedMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Scene carousel state ─────────────────────────────────
  const sortedScenes = useMemo(
    () => (scenes ?? []).filter((s) => Boolean(s.url)).slice().sort((a, b) => a.order - b.order),
    [scenes]
  );
  const useScenes = sortedScenes.length > 0;
  const [sceneIndex, setSceneIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const advance = useCallback(() => {
    setSceneIndex((i) => (i + 1) % Math.max(1, sortedScenes.length));
  }, [sortedScenes.length]);

  // Auto-advance image scenes by durationSec; video scenes advance
  // when their `ended` event fires (see <video> onEnded below).
  useEffect(() => {
    if (!useScenes) return;
    const current = sortedScenes[sceneIndex];
    if (!current || current.kind !== "image") return;
    const ms = (current.durationSec ?? 5) * 1000;
    advanceTimer.current = window.setTimeout(advance, ms);
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
    };
  }, [advance, sceneIndex, sortedScenes, useScenes]);

  // Reset the video element when the current scene changes.
  useEffect(() => {
    if (!useScenes) return;
    const current = sortedScenes[sceneIndex];
    if (current?.kind === "video" && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          /* autoplay blocked — show poster and stay on the scene */
        });
      }
    }
  }, [sceneIndex, sortedScenes, useScenes]);

  /* Scroll-driven parallax with Framer Motion (works with Lenis) */
  const { scrollY } = useScroll();
  const rm = reducedMotion ?? false;

  const rawBeamsY    = useTransform(scrollY, [0, 800], rm ? [0, 0] : [0, -160]);
  const rawContentY  = useTransform(scrollY, [0, 800], rm ? [0, 0] : [0, -60]);
  const rawOpacity   = useTransform(scrollY, [0, 480], [1, 0]);

  const yBeams   = useSpring(rawBeamsY,   { stiffness: 55, damping: 18, mass: 1.1 });
  const yContent = useSpring(rawContentY, { stiffness: 80, damping: 24, mass: 1.0 });

  /* Cycle through words every 2.2 s */
  useEffect(() => {
    if (rm) return;
    const id = setTimeout(() => {
      setWordIndex((prev) =>
        prev === CYCLING_WORDS.length - 1 ? 0 : prev + 1
      );
    }, 2200);
    return () => clearTimeout(id);
  }, [wordIndex, rm]);

  /* When an announcement is set, the hero swaps to announcement mode —
     the default cycling-word headline and standard CTAs are hidden. */
  const hasAnnouncement = Boolean(announcementTitle && announcementLink);

  // Per-scene copy overrides fall back to the global defaults so an
  // admin can leave most scenes blank and only override one for impact.
  const activeScene = useScenes ? sortedScenes[sceneIndex] : undefined;
  const activeHeadline = activeScene?.headline?.trim() || headline;
  const activeCtaText = activeScene?.ctaText?.trim() || ctaText;
  const activeCtaLink = activeScene?.ctaLink?.trim() || ctaLink;

  return (
    <section className="efsw-hero" aria-labelledby="hero-title" ref={heroRef}>
      {/* Ambient background: scenes carousel, then aurora beams */}
      <div className="efsw-hero__bg" aria-hidden="true">
        {useScenes ? (
          <SceneCarousel
            scenes={sortedScenes}
            sceneIndex={sceneIndex}
            onSelectScene={setSceneIndex}
            videoRef={videoRef}
            reducedMotion={rm}
          />
        ) : bgVideoUrl && !rm ? (
          <video
            className="efsw-hero__video"
            src={bgVideoUrl}
            poster={bgPosterUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : !bgVideoUrl && bgPosterUrl ? (
          <img
            className="efsw-hero__video efsw-hero__video--image"
            src={bgPosterUrl}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        <motion.div className="efsw-hero__beams" style={{ y: yBeams }}>
          <span className="efsw-hero__beam efsw-hero__beam--one" />
          <span className="efsw-hero__beam efsw-hero__beam--two" />
          <span className="efsw-hero__beam efsw-hero__beam--three" />
        </motion.div>
        <div className="efsw-hero__gridlines" />
        <div className="efsw-hero__noise" />
      </div>

      {/* Hero copy */}
      <motion.div
        className="efsw-hero__content"
        id="top"
        variants={heroContainer}
        // Keep the server-rendered hero readable while Framer Motion hydrates.
        initial={false}
        animate="visible"
        style={{ y: yContent, opacity: rawOpacity }}
      >
        {hasAnnouncement ? (
          /* ── Announcement mode: hero acts as a featured public notice ── */
          <>
            <motion.p className="efsw-hero__kicker" variants={heroItem}>
              <span className="efsw-hero__kicker-dot" aria-hidden="true" />
              Announcement
            </motion.p>

            <motion.h1 id="hero-title" variants={heroItem} className="efsw-hero__announcement-title">
              {announcementTitle}
            </motion.h1>

            {announcementSummary && (
              <motion.p className="efsw-hero__lede" variants={heroItemSoft}>
                {announcementSummary}
              </motion.p>
            )}

            <motion.div className="efsw-hero__actions" variants={heroItemSoft}>
              <motion.a
                href={announcementLink}
                className="efsw-hero__cta"
                whileHover={{ scale: 1.03, transition: snappy }}
                whileTap={{ scale: 0.97, transition: snappy }}
              >
                {announcementLinkLabel}
                <span className="efsw-hero__cta-icon" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </motion.a>
            </motion.div>
          </>
        ) : (
          /* ── Default mode: cycling-word headline + join CTA ── */
          <>
            {/* Eyebrow */}
            <motion.p className="efsw-hero__kicker" variants={heroItem}>
              <span className="efsw-hero__kicker-dot" aria-hidden="true" />
              {tagline}
            </motion.p>

            {/* Headline — line 2 cycles through words */}
            <motion.h1 id="hero-title" variants={heroItem}>
              {activeHeadline ? (
                activeHeadline
              ) : (
                <>
                  Social work that
                  <span className="efsw-hero__word-slot" aria-live="polite">
                    {CYCLING_WORDS.map((word, index) => (
                      <motion.span
                        key={word}
                        className="efsw-hero__word-item"
                        initial={false}
                        transition={{ type: "spring", stiffness: 120, damping: 22 }}
                        animate={
                          wordIndex === index
                            ? { y: 0, opacity: 1 }
                            : {
                                y: wordIndex > index ? "-110%" : "110%",
                                opacity: 0,
                              }
                        }
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                  across Eurasia.
                </>
              )}
            </motion.h1>

            {/* Sub-headline / lede */}
            <motion.p className="efsw-hero__lede" variants={heroItemSoft}>
              {subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div className="efsw-hero__actions" variants={heroItemSoft}>
              <motion.a
                href={activeCtaLink}
                className="efsw-hero__cta"
                whileHover={{ scale: 1.03, transition: snappy }}
                whileTap={{ scale: 0.97, transition: snappy }}
              >
                {activeCtaText}
                <span className="efsw-hero__cta-icon" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </motion.a>
              <a href="#dean" className="efsw-hero__ghost">
                Hear from leadership <MoveRight size={16} aria-hidden="true" />
              </a>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Bottom meta bar */}
      <motion.div
        className="efsw-hero__meta"
        variants={heroMeta}
        initial={false}
        animate="visible"
      >
        <span>Connect · Empower · Advocate</span>
        <a className="efsw-hero__scrollcue" href="#dean">
          <span className="efsw-hero__scrollcue-ring" aria-hidden="true">
            <ArrowDown size={14} />
          </span>
          Explore the forum
        </a>
      </motion.div>
    </section>
  );
}

export { AnimatedHero };

/* ────────────────────────────────────────────────────────────
   SceneCarousel — multi-scene background for the hero. Renders
   every scene as an absolutely-positioned layer; only the active
   scene is opaque. Image scenes use plain <img>, video scenes
   use a single shared <video> element that re-targets the src
   when the index changes (so playback restarts cleanly).
   ──────────────────────────────────────────────────────────── */

interface SceneCarouselProps {
  scenes: AdminHeroScene[];
  sceneIndex: number;
  onSelectScene: (index: number) => void;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  reducedMotion: boolean;
}

function SceneCarousel({
  scenes,
  sceneIndex,
  onSelectScene,
  videoRef,
  reducedMotion,
}: SceneCarouselProps) {
  return (
    <>
      {scenes.map((scene, index) => {
        const isActive = index === sceneIndex;
        return (
          <div
            key={scene.id}
            className="efsw-hero__scene"
            data-active={isActive ? "true" : "false"}
            aria-hidden={!isActive}
          >
            {scene.kind === "image" ? (
              <img
                className="efsw-hero__video efsw-hero__video--image"
                src={scene.url}
                alt=""
                loading={isActive ? "eager" : "lazy"}
              />
            ) : (
              <video
                ref={index === sceneIndex ? videoRef : undefined}
                className="efsw-hero__video"
                src={scene.url}
                poster={scene.posterUrl}
                autoPlay={isActive && !reducedMotion}
                muted
                playsInline
                onEnded={() => {
                  if (isActive) onSelectScene((sceneIndex + 1) % scenes.length);
                }}
              />
            )}
          </div>
        );
      })}

      {/* Scene dot indicators */}
      {scenes.length > 1 && (
        <div className="efsw-hero__scenes-dots" role="tablist" aria-label="Hero scenes">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              role="tab"
              aria-selected={index === sceneIndex}
              aria-label={`Show scene ${index + 1}`}
              className={`efsw-hero__scenes-dot ${index === sceneIndex ? "is-active" : ""}`}
              onClick={() => onSelectScene(index)}
            />
          ))}
        </div>
      )}
    </>
  );
}
