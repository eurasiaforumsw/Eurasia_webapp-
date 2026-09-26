"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Globe2,
  MoveRight,
  Users,
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

/* Live network facts — gives the hero a useful, glanceable purpose */
const HERO_STATS = [
  { icon: Users,        value: "15+",          label: "Member countries" },
  { icon: Globe2,       value: "3",            label: "Working languages" },
  { icon: CalendarDays, value: "2026",         label: "Regional summit" },
  { icon: BookOpen,     value: "120+",         label: "Shared resources" },
];

interface AnimatedHeroProps {
  headline?: string;
  subheadline?: string;
  tagline?: string;
  ctaText?: string;
  ctaLink?: string;
  /** Optional ambient background video + poster (from the admin layout). */
  bgVideoUrl?: string;
  bgPosterUrl?: string;
}

function AnimatedHero({
  headline,
  subheadline = "The Eurasia Forum for Social Workers connects practitioners, educators, students, and institutions across continents.",
  tagline = "Bridging practice, policy, and education across Eurasia",
  ctaText = "Join the Network",
  ctaLink = "/member",
  bgVideoUrl,
  bgPosterUrl,
}: AnimatedHeroProps) {
  const reducedMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="efsw-hero" aria-labelledby="hero-title" ref={heroRef}>
      {/* Ambient background: video (if provided) under aurora beam layers */}
      <div className="efsw-hero__bg" aria-hidden="true">
        {bgVideoUrl && !rm && (
          <video
            className="efsw-hero__video"
            src={bgVideoUrl}
            poster={bgPosterUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
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
        {/* Eyebrow */}
        <motion.p className="efsw-hero__kicker" variants={heroItem}>
          <span className="efsw-hero__kicker-dot" aria-hidden="true" />
          {tagline}
        </motion.p>

        {/* Headline — line 2 cycles through words */}
        <motion.h1 id="hero-title" variants={heroItem}>
          {headline ? headline : (
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
            href={ctaLink}
            className="efsw-hero__cta"
            whileHover={{ scale: 1.03, transition: snappy }}
            whileTap={{ scale: 0.97, transition: snappy }}
          >
            {ctaText}
            <span className="efsw-hero__cta-icon" aria-hidden="true">
              <ArrowUpRight size={16} />
            </span>
          </motion.a>
          <a href="#dean" className="efsw-hero__ghost">
            Hear from leadership <MoveRight size={16} aria-hidden="true" />
          </a>
        </motion.div>

        {/* Network facts — glanceable proof of value */}
        <motion.ul className="efsw-hero__stats" variants={heroItemSoft}>
          {HERO_STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="efsw-hero__stat">
              <Icon size={17} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </li>
          ))}
        </motion.ul>
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
