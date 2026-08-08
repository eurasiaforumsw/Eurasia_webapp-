"use client";

import { useState } from "react";

interface MissionCardProps {
  id: string;
  letter: string;
  title: string;
  titleTh: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

export default function MissionCard({
  letter,
  title,
  titleTh,
  description,
  color,
  icon,
}: MissionCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      className="mission-card relative group cursor-pointer"
      onMouseMove={handleMouseMove}
      style={{
        // @ts-ignore
        "--mouse-x": `${mousePosition.x}%`,
        "--mouse-y": `${mousePosition.y}%`,
      }}
    >
      <div className="glass-card p-xl h-full flex flex-col spotlight-hover transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
        {/* Icon circle */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}
          >
            <span className="text-3xl font-bold">{letter}</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4 text-center">
          <h3 className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}>
            {title}
          </h3>
          <p className="text-text-secondary text-sm">{titleTh}</p>
        </div>

        {/* Description */}
        <p className="text-text-secondary leading-relaxed text-sm flex-1">
          {description}
        </p>

        {/* Decorative icon */}
        <div className="mt-6 w-16 h-16 mx-auto text-surface-subtle opacity-30 transition-opacity group-hover:opacity-50">
          {icon}
        </div>

        {/* Hover glow effect */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-lg bg-gradient-to-br ${color} blur-xl -z-10`}
        />
      </div>
    </div>
  );
}
