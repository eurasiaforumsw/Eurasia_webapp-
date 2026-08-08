"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export function StorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    
    const ctx = gsap.context(() => {
      // Pin the section
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1,
      });

      // Animate text elements
      textRefs.current.forEach((el, index) => {
        if (!el) return;
        
        gsap.fromTo(el, 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: `top+=${index * 100}% top`,
              end: `top+=${(index + 0.5) * 100}% top`,
              scrub: 1,
              toggleActions: "play reverse play reverse",
            }
          }
        );

        gsap.to(el, {
          opacity: 0,
          y: -50,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top+=${(index + 0.6) * 100}% top`,
            end: `top+=${(index + 1) * 100}% top`,
            scrub: 1,
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const missions = [
    {
      title: "Connect",
      description: "Build a robust and secure community for social workers, policymakers, and academics across nations to exchange insights and best practices."
    },
    {
      title: "Empower",
      description: "Strengthen the capacity and professional recognition of social workers through specialized training, resources, and collaborative projects."
    },
    {
      title: "Advocate",
      description: "Champion social justice, human rights, and the welfare of vulnerable groups in Eurasia by amplifying the impact of local initiatives globally."
    }
  ];

  return (
    <section ref={sectionRef} id="about" className="relative h-screen w-full bg-surface-base overflow-hidden flex items-center justify-center">
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full border border-teal-light animate-[spin_60s_linear_infinite]" />
        <div className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full border border-gold-laurel border-dashed animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {missions.map((mission, idx) => (
          <div 
            key={idx} 
            ref={(el) => { textRefs.current[idx] = el }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full"
            style={{ opacity: 0 }}
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-teal mb-6">
              {mission.title}
            </h2>
            <p className="text-xl md:text-2xl text-text-primary leading-relaxed">
              {mission.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
