"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Globe2, MoveRight, Quote } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";

/** Sections tracked by the side progress indicator. */
const pageSections = [
  { id: "top", label: "Introduction" },
  { id: "voices", label: "Featured voices" },
  { id: "about", label: "About EFSW" },
  { id: "news", label: "Newsroom" },
  { id: "footer", label: "Contact" },
];

/* ── Motion design tokens ─────────────────────────────────────────────────
   Physics-based springs: values chosen by feel, not arbitrary tweens.
   Stiffness controls how quickly energy returns; damping how fast it settles.

   dramatic  — hero headline, slight overshoot → alive, editorial
   natural   — body copy / lede, smooth settle → readable, calm
   snappy    — CTA buttons, instant feedback → decisive
────────────────────────────────────────────────────────────────────────── */
const dramatic: Parameters<typeof motion.div>[0]["transition"] = {
  type: "spring", stiffness: 280, damping: 20, mass: 1.0,
};
const natural: Parameters<typeof motion.div>[0]["transition"] = {
  type: "spring", stiffness: 220, damping: 26, mass: 0.9,
};
const snappy: Parameters<typeof motion.div>[0]["transition"] = {
  type: "spring", stiffness: 400, damping: 28, mass: 0.8,
};

// Stagger container — children spring in 90 ms apart
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
} as const;

// Each hero item rises from below with the dramatic spring
const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: dramatic },
} as const;

// Lede / body text: subtler, natural spring
const heroItemSoft = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: natural },
} as const;

// Meta bar: drifts up late, no spring needed — just a clean fade
const heroMeta = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.65, duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
} as const;

// Scroll-reveal cards: spring in from below once 20 % is visible
const cardItem = (i: number) => ({
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1, y: 0,
    transition: { ...natural, delay: i * 0.08 },
  },
} as const);

type FeaturedVoice = {
  number: string;
  label: string;
  attribution: string;
  quote: string;
  note: string;
};

const featuredVoices: FeaturedVoice[] = [
  {
    number: "01",
    label: "Dean's message",
    attribution: "Reserved for the Dean's institutional address",
    quote: "The official message from the Dean will appear here once EFSW confirms the text. This space is held for an authoritative institutional voice.",
    note: "Approved institutional voice",
  },
  {
    number: "02",
    label: "Practitioner's perspective",
    attribution: "A voice from the field across Eurasia",
    quote: "Stories from real practice should cross borders, so that communities can learn from one another and carry those lessons forward.",
    note: "Regional practice voice",
  },
  {
    number: "03",
    label: "A shared principle",
    attribution: "EFSW / Connect · Empower · Advocate",
    quote: "Social change has no borders, and meaningful collaboration always begins with the willingness to listen.",
    note: "EFSW editorial perspective",
  },
];

const newsItems = [
  {
    number: "01",
    category: "Platform update",
    title: "A trilingual platform for regional exchange",
    body: "EFSW connects English, Korean, and Thai resources so professional knowledge can move more freely across Eurasia.",
    link: "Read the platform brief",
  },
  {
    number: "02",
    category: "Membership",
    title: "A network for professionals, students, and institutions",
    body: "Three membership pathways make room for practitioners, emerging social workers, universities, NGOs, and public partners.",
    link: "Explore membership",
  },
  {
    number: "03",
    category: "Resources",
    title: "Research and practice belong in the same conversation",
    body: "The resource hub brings research papers, case studies, field manuals, and regional learning into one shared place.",
    link: "Visit the resource hub",
  },
];

export default function HomePage() {
  const reducedMotion = useReducedMotion();

  // ── Scroll-driven parallax ───────────────────────────────────────────────
  // Spring-smoothed values create natural deceleration (physics, not tweens).
  // When reduced motion is preferred, all ranges collapse to [0,0] → no movement.
  const { scrollY } = useScroll();
  const rm = reducedMotion ?? false;

  const rawBlobY     = useTransform(scrollY, [0, 800], rm ? [0,   0] : [0, -200]);
  const rawOrbitY    = useTransform(scrollY, [0, 800], rm ? [0,   0] : [0,   90]);
  const rawContentY  = useTransform(scrollY, [0, 800], rm ? [0,   0] : [0,  -55]);

  // Low stiffness = dreamy inertia; higher damping = no oscillation past start
  const yBlobs   = useSpring(rawBlobY,    { stiffness: 55, damping: 18, mass: 1.1 });
  const yOrbit   = useSpring(rawOrbitY,   { stiffness: 50, damping: 20, mass: 1.0 });
  const yContent = useSpring(rawContentY, { stiffness: 80, damping: 24, mass: 1.0 });

  const [voiceProgress, setVoiceProgress] = useState(0);
  const [isStoryMotionEnabled, setIsStoryMotionEnabled] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(min-width: 40rem) and (prefers-reduced-motion: no-preference)");
    const updateMotionPreference = () => setIsStoryMotionEnabled(motionQuery.matches);
    updateMotionPreference();

    const voices = document.getElementById("voices");
    let frame = 0;

    const updateProgress = () => {
      if (!voices) return;
      const range = voices.offsetHeight - window.innerHeight;
      // Read the section's viewport position so this remains correct if a
      // browser chooses body or documentElement as the scrolling element.
      const progress = range <= 0 ? 0 : -voices.getBoundingClientRect().top / range;
      const nextProgress = Math.min(1, Math.max(0, progress));
      setVoiceProgress((previous) => Math.abs(previous - nextProgress) < 0.002 ? previous : nextProgress);
    };

    const requestProgressUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    document.addEventListener("scroll", requestProgressUpdate, { passive: true, capture: true });
    window.addEventListener("resize", requestProgressUpdate);
    const resizeObserver = voices ? new ResizeObserver(requestProgressUpdate) : null;
    resizeObserver?.observe(voices as Element);
    motionQuery.addEventListener("change", updateMotionPreference);
    return () => {
      window.removeEventListener("scroll", requestProgressUpdate);
      document.removeEventListener("scroll", requestProgressUpdate, true);
      window.removeEventListener("resize", requestProgressUpdate);
      resizeObserver?.disconnect();
      motionQuery.removeEventListener("change", updateMotionPreference);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".efsw-reveal"));
    if (!revealItems.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.14, rootMargin: "0px 0px -10%" },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const activeVoiceIndex = useMemo(
    () => isStoryMotionEnabled
      ? Math.min(featuredVoices.length - 1, Math.floor(voiceProgress * featuredVoices.length))
      : 0,
    [isStoryMotionEnabled, voiceProgress],
  );
  const activeVoice = featuredVoices[activeVoiceIndex];

  return (
    <>
      <SiteNav />
      <ScrollProgress sections={pageSections} />
      <main className="efsw-home" id="home">
      <section className="efsw-hero" aria-labelledby="hero-title">
        {/* Parallax blobs — drifts at 2.5× content speed for depth */}
        <motion.div className="efsw-hero__wash" aria-hidden="true" style={{ y: yBlobs }} />
        {/* Orbit ring — moves in opposite direction for layered depth */}
        <motion.div className="efsw-hero__orbit" aria-hidden="true" style={{ y: yOrbit }} />

        <motion.div
          className="efsw-hero__content"
          id="top"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          style={{ y: yContent }}
        >
          <motion.p className="efsw-kicker" variants={heroItem}>
            <Globe2 size={15} /> International social work across Eurasia
          </motion.p>
          <motion.h1 id="hero-title" variants={heroItem}>
            Social change<br /><span>has no borders.</span>
          </motion.h1>
          <motion.p className="efsw-hero__lede" variants={heroItemSoft}>
            The Eurasia Forum for Social Workers connects people, practice, and research so communities can move forward with more care.
          </motion.p>
          <motion.div className="efsw-hero__actions" variants={heroItemSoft}>
            <motion.a
              href="/about"
              className="efsw-button efsw-button--dark"
              whileHover={{ scale: 1.04, transition: snappy }}
              whileTap={{ scale: 0.97, transition: snappy }}
            >
              About EFSW <ArrowUpRight size={17} />
            </motion.a>
            <a href="#voices" className="efsw-text-link">Read the voices <MoveRight size={17} /></a>
          </motion.div>
        </motion.div>

        <motion.div
          className="efsw-hero__meta"
          variants={heroMeta}
          initial="hidden"
          animate="visible"
        >
          <span>Connect · Empower · Advocate</span>
          <span className="efsw-scroll-cue"><ArrowDownRight size={16} /> Scroll to listen</span>
        </motion.div>
      </section>

      <section className="efsw-voices" id="voices" aria-labelledby="voices-title">
        <div className="efsw-voices__sticky">
          <div className="efsw-voices__visual" aria-hidden="true">
            <Quote className="efsw-voices__quote-mark" size={66} strokeWidth={1.2} />
            <div className="efsw-voices__number">{activeVoice.number}</div>
            <div className="efsw-voices__orbit efsw-voices__orbit--outer" />
            <div className="efsw-voices__orbit efsw-voices__orbit--inner" />
            <p>EFSW / FEATURED VOICE</p>
          </div>

          <div className="efsw-voices__copy" aria-live="polite">
            <p className="efsw-kicker">{activeVoice.label}</p>
            <h2 id="voices-title" key={activeVoiceIndex}>“{activeVoice.quote}”</h2>
            <p className="efsw-voices__attribution" key={`attribution-${activeVoiceIndex}`}>{activeVoice.attribution}</p>
            <div className="efsw-voices__note">{activeVoice.note}</div>
            <div className="efsw-voices__progress" aria-label={`Featured voice ${activeVoiceIndex + 1} of ${featuredVoices.length}`}>
              {featuredVoices.map((voice, index) => <span key={voice.number} className={index <= activeVoiceIndex ? "is-active" : ""} />)}
            </div>
          </div>
        </div>
        <div className="efsw-voices__steps" aria-hidden="true">
          {featuredVoices.map((voice) => <div key={voice.number} />)}
        </div>
        <div className="efsw-voices__mobile-list" aria-label="More featured voices">
          {featuredVoices.slice(1).map((voice) => (
            <article className="efsw-voices__mobile-item" key={voice.number}>
              <div className="efsw-voices__mobile-item-top">
                <span>{voice.number}</span>
                <small>{voice.label}</small>
              </div>
              <h3>“{voice.quote}”</h3>
              <p>{voice.attribution}</p>
              <span className="efsw-voices__mobile-note">{voice.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="efsw-about-bridge efsw-reveal" id="about" aria-labelledby="about-bridge-title">
        <div className="efsw-section-label">01 / About EFSW</div>
        <div className="efsw-about-bridge__grid efsw-reveal-group">
          <h2 id="about-bridge-title">A professional network with a human centre.</h2>
          <div>
            <p>We bring social workers, educators, researchers, students, and institutions into one regional conversation about social justice and human wellbeing.</p>
            <a href="/about" className="efsw-button efsw-button--dark">Read about us <ArrowUpRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="efsw-news efsw-reveal" id="news" aria-labelledby="news-title">
        <div className="efsw-section-label">02 / Newsroom</div>
        <div className="efsw-news__head">
          <h2 id="news-title">What is moving<br /><span>the network forward.</span></h2>
          <p>Briefings, platform updates, and resources from the work of connecting social workers across Eurasia.</p>
        </div>
        <div className="efsw-news__grid efsw-reveal-group">
          {newsItems.map((item, index) => (
            <motion.article
              className="efsw-news-card"
              key={item.number}
              variants={cardItem(index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.18 }}
            >
              <div className="efsw-news-card__top"><span>{item.number}</span><small>{item.category}</small></div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a href="/about" className="efsw-text-link">{item.link} <ArrowUpRight size={16} /></a>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="efsw-footer" id="footer">
        <div className="efsw-footer__top">
          <div>
            <a href="#home" className="efsw-brand" aria-label="Back to EFSW home">
              <span className="efsw-brand__mark">E</span>
              <span>Eurasia Forum<br />for Social Workers</span>
            </a>
            <p>Connect · Empower · Advocate</p>
          </div>
          <div className="efsw-footer__links">
            <a href="/about">About</a>
            <a href="/news">News</a>
            <a href="/about#membership">Membership</a>
          </div>
          <div className="efsw-footer__contact">
            <span>Start a conversation</span>
            <a href="mailto:support@eurasiaforumsw.org">support@eurasiaforumsw.org</a>
          </div>
        </div>
        <div className="efsw-footer__bottom"><span>© 2026 EFSW</span><span>English · 한국어 · ไทย</span><a href="#home">Back to top <ArrowUpRight size={15} /></a></div>
      </footer>
      </main>
    </>
  );
}
