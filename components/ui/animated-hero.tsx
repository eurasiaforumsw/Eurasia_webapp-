"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Globe2, MoveRight } from "lucide-react";

/* ── Motion tokens — mirror the site's spring physics ────────────────────── */
const dramatic = { type: "spring" as const, stiffness: 280, damping: 20, mass: 1.0 };
const natural  = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };
const snappy   = { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 };

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
} as const;

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: dramatic },
} as const;

const heroItemSoft = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: natural },
} as const;

const heroMeta = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.65, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

/* Cycling words that reflect the EFSW mission */
const CYCLING_WORDS = ["connects", "empowers", "advocates", "transforms", "unites"];

function AnimatedHero() {
  const reducedMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);

  /* Scroll-driven parallax — identical physics to the original page */
  const { scrollY } = useScroll();
  const rm = reducedMotion ?? false;

  const rawBlobY    = useTransform(scrollY, [0, 800], rm ? [0, 0] : [0, -200]);
  const rawOrbitY   = useTransform(scrollY, [0, 800], rm ? [0, 0] : [0,   90]);
  const rawContentY = useTransform(scrollY, [0, 800], rm ? [0, 0] : [0,  -55]);

  const yBlobs   = useSpring(rawBlobY,    { stiffness: 55, damping: 18, mass: 1.1 });
  const yOrbit   = useSpring(rawOrbitY,   { stiffness: 50, damping: 20, mass: 1.0 });
  const yContent = useSpring(rawContentY, { stiffness: 80, damping: 24, mass: 1.0 });

  /* Cycle through words every 2.2 s */
  useEffect(() => {
    const id = setTimeout(() => {
      setWordIndex((prev) =>
        prev === CYCLING_WORDS.length - 1 ? 0 : prev + 1
      );
    }, 2200);
    return () => clearTimeout(id);
  }, [wordIndex]);

  return (
    <section className="efsw-hero" aria-labelledby="hero-title">
      {/* Parallax mesh-gradient blobs */}
      <motion.div className="efsw-hero__wash" aria-hidden="true" style={{ y: yBlobs }} />
      <motion.div className="efsw-hero__orbit" aria-hidden="true" style={{ y: yOrbit }} />

      {/* Hero copy */}
      <motion.div
        className="efsw-hero__content"
        id="top"
        variants={heroContainer}
        initial="hidden"
        animate="visible"
        style={{ y: yContent }}
      >
        {/* Eyebrow */}
        <motion.p className="efsw-kicker" variants={heroItem}>
          <Globe2 size={15} aria-hidden="true" />
          International social work across Eurasia
        </motion.p>

        {/* Headline — line 2 cycles through words */}
        <motion.h1 id="hero-title" variants={heroItem}>
          Social work
          {/* Animated word slot */}
          <span className="efsw-hero__word-slot" aria-live="polite">
            {CYCLING_WORDS.map((word, index) => (
              <motion.span
                key={word}
                className="efsw-hero__word-item"
                initial={{ opacity: 0, y: "-100%" }}
                transition={{ type: "spring", stiffness: 50 }}
                animate={
                  wordIndex === index
                    ? { y: 0, opacity: 1 }
                    : {
                        y: wordIndex > index ? "-150%" : "150%",
                        opacity: 0,
                      }
                }
              >
                {word}.
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Sub-headline / lede */}
        <motion.p className="efsw-hero__lede" variants={heroItemSoft}>
          The Eurasia Forum for Social Workers connects people, practice, and
          research so communities can move forward with more care.
        </motion.p>

        {/* CTAs */}
        <motion.div className="efsw-hero__actions" variants={heroItemSoft}>
          <motion.a
            href="/about"
            className="efsw-button efsw-button--dark"
            whileHover={{ scale: 1.04, transition: snappy }}
            whileTap={{ scale: 0.97, transition: snappy }}
          >
            About EFSW <ArrowUpRight size={17} aria-hidden="true" />
          </motion.a>
          <a href="#voices" className="efsw-text-link">
            Read the voices <MoveRight size={17} aria-hidden="true" />
          </a>
        </motion.div>
      </motion.div>

      {/* Bottom meta bar */}
      <motion.div
        className="efsw-hero__meta"
        variants={heroMeta}
        initial="hidden"
        animate="visible"
      >
        <span>Connect · Empower · Advocate</span>
        <span className="efsw-scroll-cue">
          <ArrowDownRight size={16} aria-hidden="true" /> Scroll to listen
        </span>
      </motion.div>
    </section>
  );
}

export { AnimatedHero };
