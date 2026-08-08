"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Add backdrop blur when scrolled past hero
      setIsScrolled(currentScrollY > 100);

      // Hide nav on scroll down, show on scroll up (Headroom pattern)
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#membership", label: "Membership" },
    { href: "#resources", label: "Resources" },
    { href: "#events", label: "Events" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-surface-deep/80 backdrop-blur-xl border-b border-surface-subtle/20" : "bg-transparent"
      }`}
      initial={{ y: 0 }}
      animate={{ y: isHidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="max-w-7xl mx-auto px-lg py-md">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-vivid to-green-growth rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-text-primary font-display font-bold text-lg hidden md:block">
              EFSW
            </span>
          </a>

          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-lg">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative text-text-secondary hover:text-teal-vivid text-sm font-medium transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-vivid transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <button className="btn btn-primary">
              Join EFSW
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
