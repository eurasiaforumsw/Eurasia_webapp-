"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const tiers = [
  {
    name: "Professional",
    for: "Certified social workers, practitioners, researchers, and educators.",
    benefits: [
      "Global Networking",
      "Exclusive Resources",
      "Professional Development",
      "Publishing Opportunities"
    ],
    color: "from-teal to-navy",
    accent: "text-teal-vivid"
  },
  {
    name: "Student",
    for: "Undergraduate and postgraduate students in Social Work.",
    benefits: [
      "Mentorship Opportunities",
      "Knowledge Hub Access",
      "Career Advancement",
      "Reduced Rates"
    ],
    color: "from-gold-laurel to-ember-warm",
    accent: "text-gold-laurel"
  },
  {
    name: "Institutional",
    for: "Universities, NGOs, government agencies, and social enterprises.",
    benefits: [
      "Strategic Alliances",
      "Organizational Visibility",
      "Talent & Promotion",
      "Group Access to Forums"
    ],
    color: "from-green-growth to-teal",
    accent: "text-green-growth"
  }
];

function TiltCard({ tier }: { tier: typeof tiers[0] }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-2xl bg-surface-raised border border-surface-subtle p-8 shadow-2xl transition-all duration-300 hover:border-teal-light group cursor-pointer"
    >
      <div 
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tier.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        style={{ transform: "translateZ(-20px)" }}
      />
      
      <div style={{ transform: "translateZ(30px)" }}>
        <h3 className={`text-3xl font-display font-bold ${tier.accent} mb-2`}>{tier.name}</h3>
        <p className="text-text-secondary text-sm mb-6 h-10">{tier.for}</p>
        
        <ul className="space-y-3 mb-8">
          {tier.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start text-text-primary text-sm">
              <svg className={`w-5 h-5 mr-3 mt-0.5 ${tier.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
        
        <button className={`w-full py-3 rounded-lg border border-surface-subtle bg-surface-base text-text-primary font-medium group-hover:bg-opacity-80 transition-colors ${tier.accent.replace('text-', 'hover:bg-').replace('-vivid', '').replace('-laurel', '').replace('-growth', '').replace('-warm', '')} hover:text-white`}>
          Select Tier
        </button>
      </div>
    </motion.div>
  );
}

export function MembershipCards() {
  return (
    <section id="membership" className="py-32 px-6 bg-surface-deep relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-6">
            Membership Tiers
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Choose the membership level that best fits your role and start enjoying the benefits of our global network.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000">
          {tiers.map((tier) => (
            <TiltCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
