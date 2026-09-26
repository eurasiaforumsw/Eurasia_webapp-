"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, User, ImageIcon } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { DeanMessage } from "@/components/efsw/DeanMessage";
import {
  ADMIN_CONTENT_KEY,
  ADMIN_LAYOUT_KEY,
  AdminContentItem,
  AdminLayoutConfig,
  defaultLayoutConfig,
  getAdminLayout,
  getPublishedAdminContent,
  initialContent,
} from "@/lib/admin-data";
import { initScrollAnimations, cleanupScrollAnimations } from "@/lib/scroll-animations";

/** Sections tracked by the side progress indicator. */
const pageSections = [
  { id: "home", label: "Introduction" },
  { id: "dean", label: "Leadership" },
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

export default function HomePage() {
  const [layout, setLayout] = useState<AdminLayoutConfig>(defaultLayoutConfig);
  const [news, setNews] = useState<AdminContentItem[]>([]);

  // Sync admin data
  useEffect(() => {
    const syncData = () => {
      setLayout(getAdminLayout());
      setNews(getPublishedAdminContent("news"));
    };

    syncData();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_LAYOUT_KEY || event.key === ADMIN_CONTENT_KEY) {
        syncData();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncData();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", syncData);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", syncData);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Initialize GSAP ScrollTrigger animations and IntersectionObserver
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".efsw-reveal");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    // Immediate IntersectionObserver guarantees elements become visible when scrolled to
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 80px 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));

    // Delay for DOM settle before GSAP ScrollTrigger
    const timer = setTimeout(() => {
      initScrollAnimations();
    }, 100);

    // Safety fallback: if anything wasn't revealed within 1.2s, make sure it's visible
    const fallbackTimer = setTimeout(() => {
      revealItems.forEach((item) => {
        if (!item.classList.contains("is-visible")) {
          item.classList.add("is-visible");
        }
      });
    }, 1200);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
      cleanupScrollAnimations();
    };
  }, [layout, news]);

  const fallbackNews = initialContent.filter((item: AdminContentItem) => item.kind === "news");
  const publishedNews = news.length > 0 ? news : fallbackNews;
  const displayedNews = publishedNews.slice(0, 3);

  return (
    <>
      <SiteNav />
      <ScrollProgress sections={pageSections} />
      <main className="efsw-home" id="home">
        {layout.sectionVisibility.hero && (
          <AnimatedHero
            headline={layout.heroHeadline}
            subheadline={layout.heroSubheadline}
            tagline={layout.heroTagline}
            ctaText={layout.heroCtaText}
            ctaLink={layout.heroCtaLink}
            bgVideoUrl={layout.heroBgVideoUrl}
            bgPosterUrl={layout.heroBgPosterUrl}
          />
        )}

        {/* Dean Message - Live sync with Admin Layout configuration */}
        {(layout.sectionVisibility?.deanMessage !== false) && layout.deanProfiles && layout.deanProfiles.length > 0 && (
          <div id="dean">
            <DeanMessage profiles={layout.deanProfiles} autoPlayInterval={3500} />
          </div>
        )}

        {(layout.sectionVisibility?.about !== false) && (
          <section className="efsw-about-bridge efsw-reveal" id="about" aria-labelledby="about-bridge-title">
            <div className="efsw-about-bridge__grid efsw-reveal-group">
              <h2 id="about-bridge-title">A professional network with a human centre.</h2>
              <div>
                <p>We bring social workers, educators, researchers, students, and institutions into one regional conversation about social justice and human wellbeing.</p>
                <a href="/about" className="efsw-button efsw-button--dark">Read about us <ArrowUpRight size={17} /></a>
              </div>
            </div>
          </section>
        )}

        {(layout.sectionVisibility?.news !== false) && (
          <section className="efsw-news efsw-reveal" id="news" aria-labelledby="news-title">
            <div className="efsw-news__head">
              <h2 id="news-title">What is moving<br /><span>the network forward.</span></h2>
              <p>Briefings, platform updates, and resources from the work of connecting social workers across Eurasia.</p>
            </div>
            <div className="efsw-home-news-grid efsw-reveal-group">
              {displayedNews.map((item: AdminContentItem, index: number) => (
                <motion.article
                  className="efsw-home-news-card"
                  key={item.id}
                  variants={cardItem(index)}
                  // Do not hide SSR content while Framer Motion hydrates.
                  initial={false}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.18 }}
                >
                  {item.coverImage && (
                    <div className="efsw-home-news-card__media">
                      <img src={item.coverImage} alt={item.imageCaption || item.title} loading="lazy" />
                      <span className="efsw-home-news-card__tag">{item.category}</span>
                    </div>
                  )}
                  <div className="efsw-home-news-card__content">
                    {!item.coverImage && (
                      <div className="efsw-news-card__top">
                        <span>0{index + 1}</span>
                        <small>{item.category}</small>
                      </div>
                    )}
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <a href="/news" className="efsw-text-link">Read story <ArrowUpRight size={16} /></a>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        )}

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
              <a href="/admin" className="efsw-footer__admin-link">Admin Console</a>
            </div>
            <div className="efsw-footer__contact">
              <span>Start a conversation</span>
              <a href="mailto:support@eurasiaforumsw.org">support@eurasiaforumsw.org</a>
            </div>
          </div>
          <div className="efsw-footer__bottom"><span>© 2026 EFSW</span><span>English · Korean · Thai</span><a href="#home">Back to top <ArrowUpRight size={15} /></a></div>
        </footer>
      </main>
    </>
  );
}
