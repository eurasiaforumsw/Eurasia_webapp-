"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Float } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { motion } from "framer-motion";

function NetworkGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.8, 64, 64]}>
        <meshStandardMaterial 
          color="#1E8B8B"
          wireframe={true}
          transparent
          opacity={0.15}
        />
      </Sphere>
      <Sphere args={[1.75, 32, 32]}>
        <meshBasicMaterial 
          color="#0a192f"
          transparent
          opacity={0.8}
        />
      </Sphere>
    </Float>
  );
}

export function Hero3D() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-element", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out",
        delay: 0.2
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-surface-deep">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} color="#f26522" />
          <directionalLight position={[-10, -10, -5]} intensity={1} color="#008080" />
          <NetworkGlobe />
        </Canvas>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
        <motion.div 
          className="hero-element inline-block mb-6 px-4 py-1.5 rounded-full border border-surface-subtle bg-surface-raised/50 backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-sm font-medium tracking-wide text-gold-laurel uppercase">A Premier International Platform</span>
        </motion.div>
        
        <h1 ref={titleRef} className="hero-element text-5xl md:text-7xl lg:text-[5.5rem] font-display font-extrabold tracking-tight text-text-primary mb-6 leading-[1.1]">
          <span className="block text-text-primary mb-2">Eurasia Forum for</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-light via-teal to-gold-laurel">
            Social Workers
          </span>
        </h1>
        
        <p className="hero-element text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-body">
          Connect · Empower · Advocate. Bridging communities and advancing knowledge across the Eurasian region.
        </p>
        
        <div className="hero-element flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <a href="#about" className="w-full sm:w-auto px-8 py-4 bg-teal rounded-full text-white font-medium hover:bg-teal-vivid transition-all hover:scale-105 shadow-[0_0_20px_rgba(30,139,139,0.4)] text-center">
            Discover EFSW
          </a>
          <a href="#membership" className="w-full sm:w-auto px-8 py-4 bg-surface-raised border border-surface-subtle rounded-full text-text-primary hover:bg-surface-subtle transition-all hover:scale-105 text-center">
            Join the Network
          </a>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hero-element flex flex-col items-center">
        <span className="text-xs text-text-muted mb-2 tracking-widest uppercase">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-text-muted to-transparent"></div>
      </div>
    </section>
  );
}
