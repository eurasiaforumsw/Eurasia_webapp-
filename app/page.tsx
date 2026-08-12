"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { VoicesGSAP } from "@/components/efsw/VoicesGSAP";

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
  const [isStoryMotionEnabled, setIsStoryMotionEnabled] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(min-width: 40rem) and (prefers-reduced-motion: no-preference)");
    const storyMotion = motionQuery.matches;
    setIsStoryMotionEnabled(storyMotion);

    const updateMotionPreference = () => {
      setIsStoryMotionEnabled(motionQuery.matches);
    };

    motionQuery.addEventListener("change", updateMotionPreference);
    return () => {
      motionQuery.removeEventListener("change", updateMotionPreference);
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

  return (
    <>
      <SiteNav />
      <ScrollProgress sections={pageSections} />
      <main className=”efsw-home” id=”home”>
      <AnimatedHero />

      {isStoryMotionEnabled ? (
        <VoicesGSAP voices={featuredVoices} />
      ) : (
        <section className=”efsw-voices” id=”voices” aria-label=”Featured voices”>
          <div className=”efsw-voices__mobile-list”>
            {featuredVoices.map((voice) => (
              <article className=”efsw-voices__mobile-item” key={voice.number}>
                <div className=”efsw-voices__mobile-item-top”>
                  <Image
                    className=”efsw-voices__avatar”
                    src={voice.portrait}
                    alt={voice.portraitAlt}
                    width={44}
                    height={44}
                  />
                  <span>{voice.number}</span>
                  <small>{voice.label}</small>
                </div>
                <h3>”{voice.quote}”</h3>
                <p>{voice.attribution}</p>
                <span className=”efsw-voices__mobile-note”>{voice.note}</span>
              </article>
            ))}
          </div>
        </section>
      )}

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
