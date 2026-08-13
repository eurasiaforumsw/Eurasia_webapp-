"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { DeanMessage } from "@/components/efsw/DeanMessage";

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

// Dean profiles for carousel - multiple people
const deanProfiles = [
  {
    name: "Emily Peterson",
    title: "Senior General Dentist",
    quote: "Dr. Emily Peterson has over 10 years of experience, specializing in personalized care. She focuses on individualized treatment in a calm environment and emphasizes prevention and oral hygiene.",
    specializations: ["Cavity Treatment", "Endodontics", "Tooth Restoration"],
    portrait: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Dr. Emily Peterson, Senior General Dentist",
    textPosition: "both" as const, // Show text on both sides
  },
  {
    name: "Michael Chen",
    title: "Chief Medical Officer",
    quote: "With 15 years of experience in healthcare leadership, Dr. Chen focuses on innovation and patient-centered care delivery across multiple disciplines.",
    specializations: ["Healthcare Leadership", "Medical Innovation", "Patient Care"],
    portrait: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Dr. Michael Chen, Chief Medical Officer",
    textPosition: "left" as const, // Text on right side only
  },
  {
    name: "Sarah Williams",
    title: "Dean of Social Work",
    quote: "Building bridges across communities through evidence-based practice and compassionate leadership in social work education.",
    specializations: ["Community Development", "Social Policy", "Clinical Practice"],
    portrait: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&h=1100&q=80",
    portraitAlt: "Dr. Sarah Williams, Dean of Social Work",
    textPosition: "both" as const, // Name/Title/Spec left | Portrait center | Quote right
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
      <main className="efsw-home" id="home">
      <AnimatedHero />

      {/* Dean Message - New clean white design with auto-carousel */}
      <DeanMessage profiles={deanProfiles} autoPlayInterval={3000} />

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
