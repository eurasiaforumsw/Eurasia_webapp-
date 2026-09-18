"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate title text on load
      gsap.from(".hero-title", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3,
      });

      gsap.from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.6,
      });

      gsap.from(".hero-cta", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.9,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[200vh]"
    >
      <motion.div
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden hero-gradient"
        style={{ opacity, scale }}
      >
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(hsl(187, 62%, 30%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(187, 62%, 30%) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        {/* Logo card with tree of hands */}
        <motion.div
          className="absolute top-20 right-10 glass-card p-8 w-80 h-80 flex items-center justify-center"
          style={{ y }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Placeholder for logo - replace with actual EFSW logo */}
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-growth via-teal-vivid to-gold-laurel opacity-80 animate-float" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-48 h-48 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="relative z-10 max-w-5xl mx-auto px-lg text-center">
          <motion.div
            className="mb-6 inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-teal-vivid text-sm font-semibold uppercase tracking-wider">
              An international forum for social workers across Eurasia
            </span>
          </motion.div>

          <h1 className="hero-title text-display text-hero text-text-primary mb-6">
            <span className="block">Eurasia Forum</span>
            <span className="block text-gradient">for Social Workers</span>
          </h1>

          <p className="hero-subtitle text-lg text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Premier international platform dedicated to bridging communities, advancing knowledge,
            and empowering social work professionals across the Eurasian region and beyond.
          </p>

          <div className="hero-cta flex items-center justify-center gap-4 flex-wrap">
            <button className="btn btn-primary text-base px-8 py-4">
              <span>Become a Member</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
            <button className="btn btn-secondary text-base px-8 py-4">
              Learn More
            </button>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-6 h-10 border-2 border-teal-vivid rounded-full flex justify-center p-1">
              <motion.div
                className="w-1.5 h-1.5 bg-teal-vivid rounded-full"
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>

        {/* Ambient light effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-teal-vivid/10 rounded-full blur-3xl" />
      </motion.div>
    </section>
  );
}
