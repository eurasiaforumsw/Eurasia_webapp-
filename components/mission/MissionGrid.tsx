"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MissionCard from "./MissionCard";

gsap.registerPlugin(ScrollTrigger);

export default function MissionGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger animation for mission cards
      gsap.from(".mission-card", {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 75%",
          end: "bottom 25%",
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  const missions = [
    {
      id: "connect",
      letter: "C",
      title: "Connect",
      titleTh: "Connect",
      description:
        "Build a robust and secure community for social workers, policymakers, and academics across nations to exchange insights and best practices.",
      color: "from-teal-vivid to-teal-vivid/70",
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "empower",
      letter: "E",
      title: "Empower",
      titleTh: "Empower",
      description:
        "Strengthen the capacity and professional recognition of social workers through specialized training, resources, and collaborative projects.",
      color: "from-green-growth to-green-growth/70",
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "advocate",
      letter: "A",
      title: "Advocate",
      titleTh: "Advocate",
      description:
        "Champion social justice, human rights, and the welfare of vulnerable groups by amplifying the impact of local and regional social work outcomes on the global stage.",
      color: "from-gold-laurel to-ember-warm",
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-2xl bg-surface-base">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-lg mb-xl text-center">
        <span className="inline-block text-teal-vivid text-sm font-semibold uppercase tracking-wider mb-4">
          Rationale
        </span>
        <h2 className="text-display text-xl md:text-hero text-text-primary mb-6">
          Our mission
        </h2>
        <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
          EFSW believes social change has no borders. Through a multilingual platform,
          we remove communication barriers so essential tools, international research,
          and professional networking opportunities are open to everyone, everywhere.
        </p>
      </div>

      {/* Mission cards grid */}
      <div
        ref={gridRef}
        className="max-w-7xl mx-auto px-lg grid grid-cols-1 md:grid-cols-3 gap-lg"
      >
        {missions.map((mission) => (
          <MissionCard key={mission.id} {...mission} />
        ))}
      </div>

      {/* Supporting text */}
      <div className="max-w-4xl mx-auto px-lg mt-2xl">
        <div className="glass-card p-xl text-center">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            Supporting multilingual practice
          </h3>
          <p className="text-text-secondary leading-relaxed">
            This website supports social workers across three regions with content in English, Korean, and Thai.
            It keeps tools, research, and international networking opportunities accessible to everyone,
            everywhere, as we build the future of global social development together.
          </p>
        </div>
      </div>
    </section>
  );
}
