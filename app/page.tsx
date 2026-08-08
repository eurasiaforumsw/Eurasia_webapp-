"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Globe2,
  LogIn,
  Menu,
  MoveRight,
  Quote,
  UserPlus,
  X,
} from "lucide-react";

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
    attribution: "พื้นที่สำหรับคำกล่าวจากคณบดี",
    quote: "ต้นฉบับคำกล่าวจากคณบดีจะปรากฏตรงนี้ เมื่อ EFSW ยืนยันข้อความอย่างเป็นทางการ",
    note: "Approved institutional voice",
  },
  {
    number: "02",
    label: "Practitioner's perspective",
    attribution: "พื้นที่สำหรับเสียงจากนักสังคมสงเคราะห์",
    quote: "เรื่องราวจากการทำงานจริงควรเดินทางข้ามพรมแดน เพื่อให้ชุมชนต่าง ๆ เรียนรู้จากกันและกันได้",
    note: "Regional practice voice",
  },
  {
    number: "03",
    label: "A shared principle",
    attribution: "EFSW / Connect · Empower · Advocate",
    quote: "การเปลี่ยนแปลงทางสังคมไม่มีพรมแดน และความร่วมมือที่ดีเริ่มต้นจากการรับฟัง",
    note: "EFSW editorial perspective",
  },
];

const navLinks = {
  home: { href: "/", label: "หน้าหลัก", english: "Home" },
  about: {
    href: "/about",
    label: "เกี่ยวกับเรา",
    english: "About",
    children: [
      { href: "/about", label: "เกี่ยวกับเรา" },
      { href: "/about/organization", label: "โครงสร้างองค์กร" },
    ],
  },
  news: { href: "/news", label: "ข่าวประชาสัมพันธ์", english: "News" },
  academic: { href: "/academic-documents", label: "เอกสารวิชาการ", english: "Academic documents" },
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const activeVoiceIndex = useMemo(
    () => isStoryMotionEnabled
      ? Math.min(featuredVoices.length - 1, Math.floor(voiceProgress * featuredVoices.length))
      : 0,
    [isStoryMotionEnabled, voiceProgress],
  );
  const activeVoice = featuredVoices[activeVoiceIndex];

  return (
    <main className="efsw-home" id="home">
      <section className="efsw-hero" aria-labelledby="hero-title">
        <div className="efsw-hero__wash" aria-hidden="true" />
        <div className="efsw-hero__orbit" aria-hidden="true" />
        <nav className="efsw-nav" aria-label="Main navigation">
          <a href="#home" className="efsw-brand" aria-label="EFSW home">
            <span className="efsw-brand__mark">E</span>
            <span>Eurasia Forum<br />for Social Workers</span>
          </a>

          <div className="efsw-nav__links">
            <a href={navLinks.home.href}>
              <span>{navLinks.home.label}</span>
              <small>{navLinks.home.english}</small>
            </a>
            <div className="efsw-nav__dropdown">
              <button
                type="button"
                className="efsw-nav__dropdown-trigger"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                onClick={() => setAboutOpen((open) => !open)}
              >
                <span>{navLinks.about.label}</span>
                <small>{navLinks.about.english}</small>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              <div className={`efsw-nav__dropdown-menu ${aboutOpen ? "is-open" : ""}`}>
                {navLinks.about.children.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setAboutOpen(false)}>{link.label}<ArrowUpRight size={15} /></a>
                ))}
              </div>
            </div>
            <a href={navLinks.news.href}>
              <span>{navLinks.news.label}</span>
              <small>{navLinks.news.english}</small>
            </a>
            <a href={navLinks.academic.href}>
              <span>{navLinks.academic.label}</span>
              <small>{navLinks.academic.english}</small>
            </a>
          </div>

          <div className="efsw-nav__actions">
            <a href="/member/login" className="efsw-nav__login"><LogIn size={15} /> เข้าสู่ระบบ</a>
            <a href="/member/register" className="efsw-nav__join"><UserPlus size={15} /> สมัครสมาชิก <ArrowUpRight size={16} /></a>
            <button
              type="button"
              className="efsw-menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </nav>

        <div className="efsw-hero__content" id="top">
          <p className="efsw-kicker"><Globe2 size={15} /> International social work across Eurasia</p>
          <h1 id="hero-title">Social change<br /><span>has no borders.</span></h1>
          <p className="efsw-hero__lede">
            The Eurasia Forum for Social Workers connects people, practice, and research so communities can move forward with more care.
          </p>
          <div className="efsw-hero__actions">
            <a href="/about" className="efsw-button efsw-button--dark">เกี่ยวกับเรา <ArrowUpRight size={17} /></a>
            <a href="#voices" className="efsw-text-link">อ่านคำกล่าว <MoveRight size={17} /></a>
          </div>
        </div>

        <div className="efsw-hero__meta">
          <span>Connect · Empower · Advocate</span>
          <span className="efsw-scroll-cue"><ArrowDownRight size={16} /> Scroll to listen</span>
        </div>
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

      <section className="efsw-about-bridge efsw-reveal" aria-labelledby="about-bridge-title">
        <div className="efsw-section-label">01 / เกี่ยวกับเรา · About EFSW</div>
        <div className="efsw-about-bridge__grid efsw-reveal-group">
          <h2 id="about-bridge-title">A professional network with a human centre.</h2>
          <div>
            <p>We bring social workers, educators, researchers, students, and institutions into one regional conversation about social justice and human wellbeing.</p>
            <a href="/about" className="efsw-button efsw-button--dark">อ่านเกี่ยวกับเรา <ArrowUpRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="efsw-news efsw-reveal" id="news" aria-labelledby="news-title">
        <div className="efsw-section-label">02 / ข่าวสารประชาสัมพันธ์ · Newsroom</div>
        <div className="efsw-news__head">
          <h2 id="news-title">What is moving<br /><span>the network forward.</span></h2>
          <p>Briefings, platform updates, and resources from the work of connecting social workers across Eurasia.</p>
        </div>
        <div className="efsw-news__grid efsw-reveal-group">
          {newsItems.map((item) => (
            <article className="efsw-news-card" key={item.number}>
              <div className="efsw-news-card__top"><span>{item.number}</span><small>{item.category}</small></div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a href="/about" className="efsw-text-link">{item.link} <ArrowUpRight size={16} /></a>
            </article>
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
            <a href="/about">เกี่ยวกับเรา</a>
            <a href="/news">ข่าวสารประชาสัมพันธ์</a>
            <a href="/about#membership">สมาชิก</a>
          </div>
          <div className="efsw-footer__contact">
            <span>Start a conversation</span>
            <a href="mailto:support@eurasiaforumsw.org">support@eurasiaforumsw.org</a>
          </div>
        </div>
        <div className="efsw-footer__bottom"><span>© 2026 EFSW</span><span>English · 한국어 · ไทย</span><a href="#home">Back to top <ArrowUpRight size={15} /></a></div>
      </footer>

      <div className={`efsw-mobile-sheet ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="efsw-mobile-sheet__inner">
          <span className="efsw-section-label">Navigate EFSW</span>
          <a href={navLinks.home.href} onClick={() => setMenuOpen(false)}>{navLinks.home.label}<ArrowUpRight size={18} /></a>
          <div className="efsw-mobile-sheet__group">
            <a href={navLinks.about.href} onClick={() => setMenuOpen(false)}>{navLinks.about.label}<ArrowUpRight size={18} /></a>
            {navLinks.about.children.slice(1).map((link) => <a className="efsw-mobile-sheet__sub-link" key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<ArrowUpRight size={16} /></a>)}
          </div>
          <a href={navLinks.news.href} onClick={() => setMenuOpen(false)}>{navLinks.news.label}<ArrowUpRight size={18} /></a>
          <a href={navLinks.academic.href} onClick={() => setMenuOpen(false)}>{navLinks.academic.label}<ArrowUpRight size={18} /></a>
          <a href="/member/login" onClick={() => setMenuOpen(false)}>{"เข้าสู่ระบบสมาชิก"}<LogIn size={18} /></a>
          <a href="/member/register" onClick={() => setMenuOpen(false)} className="efsw-button efsw-button--dark"><UserPlus size={17} /> สมัครสมาชิก <ArrowUpRight size={17} /></a>
        </div>
      </div>
    </main>
  );
}
