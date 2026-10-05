"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, CalendarDays, MapPin, User, ImageIcon } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ScrollProgress } from "@/components/efsw/ScrollProgress";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { DeanMessage } from "@/components/efsw/DeanMessage";
import { EventHeroSlider } from "@/components/efsw/EventHeroSlider";
import { LogoMarquee } from "@/components/efsw/LogoMarquee";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  { id: "events", label: "Events" },
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
  const [events, setEvents] = useState<AdminContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync admin data
  useEffect(() => {
    const syncData = () => {
      setIsLoading(true);
      setLayout(getAdminLayout());
      setNews(getPublishedAdminContent("news"));
      setEvents(getPublishedAdminContent("event"));
      // Remove artificial delay - data is ready immediately
      setIsLoading(false);
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

  const fallbackEvents = initialContent.filter((item: AdminContentItem) => item.kind === "event");
  const publishedEvents = events.length > 0 ? events : fallbackEvents;
  // Sort events by start date ascending — upcoming first.
  const displayedEvents = [...publishedEvents]
    .sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""))
    .slice(0, 3);

  const formatEventDate = (item: AdminContentItem) => {
    if (!item.startsAt) return "";
    try {
      const start = new Date(item.startsAt);
      const end = item.endsAt ? new Date(item.endsAt) : null;
      const startStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(start);
      if (!end) return startStr;
      if (start.toDateString() === end.toDateString()) {
        const timeEnd = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end);
        return `${startStr} · ${timeEnd}`;
      }
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      const endStr = sameMonth
        ? new Intl.DateTimeFormat("en-US", { day: "numeric", year: "numeric" }).format(end)
        : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(end);
      return `${startStr} – ${endStr}`;
    } catch {
      return "";
    }
  };

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
            scenes={layout.heroScenes}
            bgVideoUrl={layout.heroBgVideoUrl}
            bgPosterUrl={layout.heroBgPosterUrl}
            announcementTitle={layout.heroAnnouncementTitle}
            announcementSummary={layout.heroAnnouncementSummary}
            announcementLink={layout.heroAnnouncementLink}
            announcementLinkLabel={layout.heroAnnouncementLinkLabel}
          />
        )}

        {/* Dean Message - Live sync with Admin Layout configuration */}
        {(layout.sectionVisibility?.deanMessage !== false) && layout.deanProfiles && layout.deanProfiles.length > 0 && (
          <div id="dean">
            <DeanMessage profiles={layout.deanProfiles} autoPlayInterval={3500} />
          </div>
        )}

        {/* Partner logo marquee — CSS-only infinite scroll */}
        {(layout.sectionVisibility?.partnerLogos !== false) && (
          <LogoMarquee />
        )}

        {(layout.sectionVisibility?.about !== false) && (
          <section className="efsw-about-bridge efsw-reveal" id="about" aria-labelledby="about-bridge-title">
            <div className="efsw-about-bridge__grid efsw-reveal-group">
              <h2 id="about-bridge-title">{layout.homeAboutBridgeTitle}</h2>
              <div>
                <p>{layout.homeAboutBridgeBody}</p>
                <Button variant="secondary" size="lg" className="mt-4" asChild>
                  <a href="/about">
                    {layout.homeAboutBridgeCtaText} <ArrowUpRight size={17} />
                  </a>
                </Button>
              </div>
            </div>
          </section>
        )}

        {(layout.sectionVisibility?.events !== false) && (
          <section className="efsw-home-events efsw-reveal" id="events" aria-labelledby="events-title">
            <div className="efsw-home-news__head">
              <h2 id="events-title">{layout.homeEventsTitle}<br /><span>comes together.</span></h2>
              <p>{layout.homeEventsSubtitle}</p>
            </div>
            {/* Hero slider: full-bleed image band with timed slide. Placed at
                the top of the events section so first-time visitors meet the
                events as an exhibition, not a grid. */}
            <EventHeroSlider events={displayedEvents} />
            <div className="efsw-home-events__grid">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`skeleton-event-${index}`} className="efsw-home-event-card is-loading">
                    <div className="efsw-home-event-card__media" />
                    <div className="efsw-home-event-card__body">
                      <div className="skeleton-badge" />
                      <div className="skeleton-title" />
                      <div className="skeleton-summary" />
                    </div>
                  </div>
                ))
              ) : (
                displayedEvents.map((item: AdminContentItem, index: number) => (
                  <motion.article
                    key={item.id}
                    variants={cardItem(index)}
                    initial={false}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.18 }}
                    className="efsw-home-event-card"
                  >
                    <a href={`/events/${item.id}`} className="efsw-home-event-card__link">
                      <div className="efsw-home-event-card__media">
                        {item.coverImage ? (
                          <img src={item.coverImage} alt={item.imageCaption || item.title} loading="lazy" />
                        ) : (
                          <div className="efsw-home-event-card__placeholder">
                            <CalendarDays size={32} />
                            <span>EFSW Event</span>
                          </div>
                        )}
                        <Badge className="efsw-home-event-card__badge">{item.category}</Badge>
                        {item.format && (
                          <span className="efsw-home-event-card__format">{item.format}</span>
                        )}
                      </div>
                      <div className="efsw-home-event-card__body">
                        <div className="efsw-home-event-card__meta">
                          {item.startsAt && (
                            <span>
                              <Calendar size={13} />
                              <time dateTime={item.startsAt}>{formatEventDate(item)}</time>
                            </span>
                          )}
                          {item.venue && (
                            <span>
                              <MapPin size={13} />
                              <span>{item.venue}</span>
                            </span>
                          )}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <span className="efsw-home-event-card__cta">
                          View details <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </a>
                  </motion.article>
                ))
              )}
            </div>
            <div className="efsw-home-news__footer">
              <Button variant="secondary" size="lg" asChild>
                <a href="/events">
                  {layout.homeEventsCtaText} <ArrowUpRight size={17} />
                </a>
              </Button>
            </div>
          </section>
        )}

        {(layout.sectionVisibility?.news !== false) && (
          <section className="efsw-home-news efsw-reveal" id="news" aria-labelledby="news-title">
            <div className="efsw-home-news__head">
              <h2 id="news-title">{layout.homeNewsTitle}<br /><span>the network forward.</span></h2>
              <p>{layout.homeNewsSubtitle}</p>
            </div>
            <div className="efsw-home-news__grid">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="efsw-home-news-card is-loading">
                    <div className="efsw-home-news-card__media" />
                    <div className="efsw-home-news-card__body">
                      <div className="skeleton-badge" />
                      <div className="skeleton-title" />
                      <div className="skeleton-summary" />
                    </div>
                  </div>
                ))
              ) : (
                displayedNews.map((item: AdminContentItem, index: number) => (
                  <motion.article
                    key={item.id}
                    variants={cardItem(index)}
                    initial={false}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.18 }}
                    className="efsw-home-news-card"
                  >
                    <a href={`/news/${item.id}`} className="efsw-home-news-card__link">
                      <div className="efsw-home-news-card__media">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.imageCaption || item.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="efsw-home-news-card__placeholder">
                            <ImageIcon size={32} />
                            <span>EFSW News</span>
                          </div>
                        )}
                        <Badge className="efsw-home-news-card__badge">{item.category}</Badge>
                      </div>
                      <div className="efsw-home-news-card__body">
                        {item.updatedAt && (
                          <div className="efsw-home-news-card__meta">
                            <Calendar size={13} />
                            <span>{new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {item.author && (
                              <>
                                <User size={13} />
                                <span>{item.author}</span>
                              </>
                            )}
                          </div>
                        )}
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <span className="efsw-home-news-card__cta">
                          Read story <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </a>
                  </motion.article>
                ))
              )}
            </div>
            <div className="efsw-home-news__footer">
              <Button variant="secondary" size="lg" asChild>
                <a href="/news">
                  {layout.homeNewsCtaText} <ArrowUpRight size={17} />
                </a>
              </Button>
            </div>
          </section>
        )}

        <footer className="efsw-footer" id="footer">
          <div className="efsw-footer__top">
            <div>
              <a href="#home" className="efsw-brand" aria-label="Back to EFSW home">
                <span className="efsw-brand__mark">
                  <img src="/efsw-logo-cream.png" alt="" width={64} height={64} />
                </span>
                <span>Eurasia Forum<br />for Social Workers</span>
              </a>
              <p>{layout.footerTagline}</p>
            </div>
            <div className="efsw-footer__links">
              <a href="/about">About</a>
              <a href="/events">Events</a>
              <a href="/news">News</a>
              <a href="/about#membership">Membership</a>
              <a href="/admin" className="efsw-footer__admin-link">{layout.footerAdminLinkLabel}</a>
            </div>
            <div className="efsw-footer__contact">
              <span>{layout.footerEmailLabel}</span>
              <a href={`mailto:${layout.footerEmail}`}>{layout.footerEmail}</a>
            </div>
          </div>
          <div className="efsw-footer__bottom"><span>{layout.footerCopyright}</span><a href="#home">Back to top <ArrowUpRight size={15} /></a></div>
        </footer>
      </main>
    </>
  );
}
