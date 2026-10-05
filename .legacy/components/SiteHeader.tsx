"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Clock3, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/axion-data";
import { ArrowButton } from "./ArrowButton";

function LondonClock() {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="clock-readout">
      <Clock3 size={14} strokeWidth={1.8} aria-hidden="true" />
      {time} in London
    </span>
  );
}

export function SiteHeader({ subpage = false }: { subpage?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <header className={"site-header " + (subpage ? "site-header--subpage" : "")}>
        <a className="brand" href="/" aria-label="Axion Studio home">
          <span className="brand__mark">AX</span>
          <span className="brand__name">Axion Studio</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div className="nav-item" key={item.href}>
                <a href={item.href} aria-current={active ? "page" : undefined}>
                  {item.label}
                  {"children" in item && <ChevronDown size={13} aria-hidden="true" />}
                </a>
                {"children" in item && (
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        aria-current={pathname === child.href ? "page" : undefined}
                      >
                        <span>{child.label}</span>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="header-actions">
          <LondonClock />
          <a className="header-cta" href="/projects">
            <span>See selected work</span>
            <span className="header-cta__icon" aria-hidden="true">
              <ArrowUpRight size={15} strokeWidth={1.8} />
            </span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className="mobile-menu-backdrop" data-open={menuOpen} onClick={() => setMenuOpen(false)} />
      <aside className="mobile-menu" id="mobile-menu" data-open={menuOpen} aria-hidden={!menuOpen}>
        <div className="mobile-menu__top">
          <span>Menu</span>
          <LondonClock />
        </div>
        <nav aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <div className="mobile-nav-group" key={item.href}>
              <a href={item.href} onClick={() => setMenuOpen(false)}>
                <span>0{index + 1}</span>
                {item.label}
              </a>
              {"children" in item && (
                <div className="mobile-submenu">
                  {item.children.map((child) => (
                    <a href={child.href} key={child.href} onClick={() => setMenuOpen(false)}>
                      {child.label}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <ArrowButton href="/projects" dark>Explore our work</ArrowButton>
      </aside>
    </>
  );
}
