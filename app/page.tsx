"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";
import { AnimatedHero } from "@/components/ui/animated-hero";

/** Sections tracked by the side progress indicator. */
const pageSections = [
  { id: "home", label: "Introduction" },
  { id: "voices", label: "Featured voices" },
  { id: "about", label: "About EFSW" },
  { id: "news", label: "Newsroom" },
  { id: "footer", label: "Contact" },
];

// Scroll-reveal cards: spring in from below once 20 % is visible
const natural = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };

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
  /** Placeholder portrait — replace with an approved photo once EFSW supplies one. */
  portrait: string;
  portraitAlt: string;
};

const featuredVoices: FeaturedVoice[] = [
  {
    number: "01",
    label: "Dean's message",
    attribution: "Reserved for the Dean's institutional address",
    quote: "The official message from the Dean will appear here once EFSW confirms the text. This space is held for an authoritative institutional voice.",
    note: "Approved institutional voice",
    portrait: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Placeholder portrait representing the Dean's institutional address",
  },
  {
    number: "02",
    label: "Practitioner's perspective",
    attribution: "A voice from the field across Eurasia",
    quote: "Stories from real practice should cross borders, so that communities can learn from one another and carry those lessons forward.",
    note: "Regional practice voice",
    portrait: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Placeholder portrait representing a social work practitioner in the field",
  },
  {
    number: "03",
    label: "A shared principle",
    attribution: "EFSW / Connect · Empower · Advocate",
    quote: "Social change has no borders, and meaningful collaboration always begins with the willingness to listen.",
    note: "EFSW editorial perspective",
    portrait: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Placeholder portrait representing the EFSW editorial perspective",
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

/** Above this scroll speed (px per ms) slides fold away instead of crossfading. */
const FAST_SCROLL_ENTER = 1.1;
/** Hysteresis: settle back to the readable pace only once clearly slow again. */
const FAST_SCROLL_EXIT = 0.45;

export default function HomePage() {
  const [activeVoiceIndex, setActiveVoiceIndex] = useState(0);
  const [isScrollingFast, setIsScrollingFast] = useState(false);
  const [isStoryMotionEnabled, setIsStoryMotionEnabled] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(min-width: 40rem) and (prefers-reduced-motion: no-preference)");
    const voices = document.getElementById("voices");
    let storyMotion = motionQuery.matches;
    let frame = 0;
    let lastScrollY = window.scrollY;
    let lastTimestamp = 0;
    let velocity = 0;
    let fast = false;

    const updateMotionPreference = () => {
      storyMotion = motionQuery.matches;
      setIsStoryMotionEnabled(storyMotion);
      if (!storyMotion) {
        setActiveVoiceIndex(0);
        setIsScrollingFast(false);
      }
    };
    setIsStoryMotionEnabled(storyMotion);

    // Runs on rAF but only commits React state when the active slide or the
    // fast/slow pace actually flips, so scrolling no longer re-renders per frame.
    const measure = (timestamp: number) => {
      frame = 0;
      if (!voices || !storyMotion) return;

      const scrollY = window.scrollY;
      const elapsed = lastTimestamp ? timestamp - lastTimestamp : 0;
      if (elapsed > 0) {
        const sample = Math.abs(scrollY - lastScrollY) / elapsed;
        // Smooth the sample so a single stuttering frame cannot flip the pace.
        velocity = velocity * 0.7 + sample * 0.3;
      }
      lastScrollY = scrollY;
      lastTimestamp = timestamp;

      const nextFast = fast ? velocity > FAST_SCROLL_EXIT : velocity > FAST_SCROLL_ENTER;
      if (nextFast !== fast) {
        fast = nextFast;
        setIsScrollingFast(nextFast);
      }

      const range = voices.offsetHeight - window.innerHeight;
      // Read the section's viewport position so this remains correct if a
      // browser chooses body or documentElement as the scrolling element.
      const progress = range <= 0 ? 0 : -voices.getBoundingClientRect().top / range;
      const clamped = Math.min(1, Math.max(0, progress));
      const nextIndex = Math.min(featuredVoices.length - 1, Math.floor(clamped * featuredVoices.length));
      setActiveVoiceIndex((previous) => (previous === nextIndex ? previous : nextIndex));

      // Keep sampling while the page is still settling so velocity decays to rest.
      if (velocity > FAST_SCROLL_EXIT) requestMeasure();
    };

    const requestMeasure = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    const onScroll = () => requestMeasure();
    const onResize = () => {
      lastTimestamp = 0;
      requestMeasure();
    };

    requestMeasure();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    const resizeObserver = voices ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(voices as Element);
    motionQuery.addEventListener("change", updateMotionPreference);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
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

  const activeVoice = featuredVoices[activeVoiceIndex];

  return (
    <>
      <SiteNav />
      <ScrollProgress sections={pageSections} />
      <main className="efsw-home" id="home">
      <AnimatedHero />

      <section className="efsw-voices" id="voices" aria-label="Featured voices">
        <div className="efsw-voices__sticky">
          <div className={`efsw-voices__visual${isScrollingFast && isStoryMotionEnabled ? " is-folding" : ""}`}>
            {/* All portraits stay mounted and crossfade via CSS, so switching
                voices never triggers a fresh image decode mid-scroll. */}
            {featuredVoices.map((voice, index) => (
              <div
                key={voice.number}
                className="efsw-voices__portrait"
                data-state={index === activeVoiceIndex ? "active" : index < activeVoiceIndex ? "past" : "upcoming"}
                aria-hidden={index !== activeVoiceIndex}
              >
                <Image
                  src={voice.portrait}
                  alt={index === activeVoiceIndex ? voice.portraitAlt : ""}
                  sizes="(max-width: 64rem) 90vw, 34rem"
                  priority={index === 0}
                  fill
                />
              </div>
            ))}
            <div className="efsw-voices__scrim" aria-hidden="true" />
            <Quote className="efsw-voices__quote-mark" size={34} strokeWidth={1.6} aria-hidden="true" />
            <div className="efsw-voices__number" aria-hidden="true">{activeVoice.number}</div>
            <p aria-hidden="true">EFSW / FEATURED VOICE</p>
          </div>

          <div className="efsw-voices__copy" aria-live="polite">
            {/* Fast scroll: the quote folds away to a compact label. Slow scroll:
                it opens up so each person's words are actually readable. */}
            <AnimatePresence initial={false} mode="wait">
              {isScrollingFast && isStoryMotionEnabled ? (
                <motion.div
                  key="folded"
                  className="efsw-voices__folded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <p className="efsw-kicker">{activeVoice.label}</p>
                  <p className="efsw-voices__attribution">{activeVoice.attribution}</p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeVoiceIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="efsw-kicker">{activeVoice.label}</p>
                  <h2>“{activeVoice.quote}”</h2>
                  <p className="efsw-voices__attribution">{activeVoice.attribution}</p>
                  <div className="efsw-voices__note">{activeVoice.note}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="efsw-voices__progress" aria-label={`Featured voice ${activeVoiceIndex + 1} of ${featuredVoices.length}`}>
              {featuredVoices.map((voice, index) => (
                <button
                  key={voice.number}
                  type="button"
                  onClick={() => {
                    const voicesElement = document.getElementById("voices");
                    if (voicesElement) {
                      const stepHeight = (voicesElement.offsetHeight - window.innerHeight) / (featuredVoices.length - 1);
                      window.scrollTo({ top: voicesElement.offsetTop + stepHeight * index, behavior: "smooth" });
                    }
                  }}
                  className={index <= activeVoiceIndex ? "is-active" : ""}
                  aria-label={`Go to voice ${voice.number}`}
                />
              ))}
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
                <Image
                  className="efsw-voices__avatar"
                  src={voice.portrait}
                  alt={voice.portraitAlt}
                  width={44}
                  height={44}
                />
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
              <a href="/news" className="efsw-text-link">{item.link} <ArrowUpRight size={16} /></a>
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
