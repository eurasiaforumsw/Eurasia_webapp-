# Scroll Animations Implementation Guide

## 🎯 Overview

เว็บไซต์นี้ใช้ **3 ไลบรารีหลัก** สำหรับ scroll animations:

1. **Lenis** - Smooth scrolling แบบ buttery smooth
2. **GSAP ScrollTrigger** - Advanced scroll-driven animations
3. **Framer Motion** - Component-level animations และ micro-interactions

## 📦 ไลบรารีที่ติดตั้ง

```json
{
  "lenis": "^1.1.0",
  "gsap": "^3.12.5",
  "@gsap/react": "^2.1.1",
  "framer-motion": "^11.2.0"
}
```

## 🚀 การใช้งาน

### 1. Lenis Smooth Scrolling

เปิดใช้งาน smooth scrolling ทั้งเว็บ:

```tsx
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export default function Page() {
  useSmoothScroll(); // เรียกครั้งเดียวใน root page
  
  return <main>...</main>;
}
```

**ตั้งค่า Lenis:**
- Duration: 1.2s (ความเร็วการเลื่อน)
- Smooth wheel: เปิด
- Smooth touch: ปิด (เพื่อประสบการณ์ดีขึ้นบนมือถือ)

### 2. GSAP ScrollTrigger - Auto Animations

ใช้ class names เพื่อให้ elements มี scroll animations อัตโนมัติ:

#### Basic Reveal (Fade Up)
```tsx
<section className="efsw-reveal">
  {/* Content จะ fade in + slide up เมื่อ scroll ถึง */}
</section>
```

#### Staggered Cards
```tsx
<div className="efsw-reveal-group">
  <div className="efsw-home-news-card">Card 1</div>
  <div className="efsw-home-news-card">Card 2</div>
  <div className="efsw-home-news-card">Card 3</div>
  {/* Cards จะ appear ทีละตัวแบบ stagger */}
</div>
```

#### Section Labels
```tsx
<div className="efsw-section-label">01 / About</div>
{/* Label จะ slide in จากซ้าย */}
```

### 3. ScrollReveal Components

Import และใช้ components สำเร็จรูป:

```tsx
import { ScrollReveal, Parallax, StaggerReveal } from "@/components/ui/scroll-reveal";

// Reveal ทิศทางต่างๆ
<ScrollReveal direction="up" delay={0.2} duration={0.8}>
  <h2>This will fade up</h2>
</ScrollReveal>

// Parallax effect
<Parallax speed={0.5}>
  <img src="/hero.jpg" alt="Background" />
</Parallax>

// Stagger multiple children
<StaggerReveal stagger={0.15} direction="up">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</StaggerReveal>
```

### 4. Custom GSAP Animations

สำหรับ advanced cases, ใช้ utility functions:

```tsx
import { 
  createParallaxLayers, 
  pinSection, 
  horizontalScroll 
} from "@/lib/scroll-animations";

useEffect(() => {
  // Parallax layers
  createParallaxLayers(".background-layer", 0.3);
  
  // Pin section while scrolling
  pinSection("#features-section", 2);
  
  // Horizontal scroll gallery
  horizontalScroll("#gallery-container", ".gallery-item");
  
  return () => cleanupScrollAnimations();
}, []);
```

## 🎨 Animation Patterns

### Hero Section
- ✅ Staggered entrance animations (Framer Motion)
- ✅ Parallax background layers (GSAP + Framer Motion)
- ✅ Fade out on scroll (GSAP ScrollTrigger)
- ✅ Smooth scrolling (Lenis)

### Content Sections
- ✅ Fade up on scroll (GSAP)
- ✅ Section labels slide from left (GSAP)
- ✅ Cards stagger reveal (GSAP)

### News Cards
- ✅ Spring animation on enter (Framer Motion)
- ✅ Staggered timing (GSAP)

## ⚙️ Performance Tips

1. **Reduced Motion**: ระบบตรวจจับ `prefers-reduced-motion` อัตโนมัติ
2. **Cleanup**: ใช้ `cleanupScrollAnimations()` เมื่อ component unmount
3. **Scrub**: ใช้ `scrub: true` สำหรับ parallax เพื่อความลื่นไหล
4. **Once**: ใช้ `viewport={{ once: true }}` ใน Framer Motion เพื่อ animate ครั้งเดียว

## 🎯 Best Practices

### ใช้ GSAP เมื่อ:
- ต้องการ scroll-driven animations
- ต้องการ pin/parallax effects
- ต้องการ timeline ที่ซับซ้อน
- ต้องการประสิทธิภาพสูงสุด

### ใช้ Framer Motion เมื่อ:
- Component mounting/unmounting animations
- Hover/tap interactions
- Layout animations
- ต้องการ declarative API

### ใช้ Lenis เมื่อ:
- ต้องการ smooth scrolling ทั้งเว็บ
- รองรับทุก scroll-based animation library

## 📝 Examples

### Example 1: Animated Section

```tsx
<section className="efsw-reveal">
  <div className="efsw-section-label">01 / About</div>
  <h2>Our Mission</h2>
  <div className="efsw-reveal-group">
    {items.map((item, i) => (
      <motion.div
        key={i}
        className="card"
        whileHover={{ scale: 1.05 }}
      >
        {item.content}
      </motion.div>
    ))}
  </div>
</section>
```

### Example 2: Custom Scroll Animation

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CustomSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".title", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 50%",
          scrub: 1,
        },
        x: -100,
        opacity: 0,
      });
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);
  
  return (
    <section ref={sectionRef}>
      <h2 className="title">Custom Animation</h2>
    </section>
  );
}
```

## 🐛 Troubleshooting

### Animations ไม่ทำงาน?
1. ตรวจสอบว่าเรียก `initScrollAnimations()` แล้ว
2. ตรวจสอบ class names ว่าถูกต้อง
3. เช็ค browser console สำหรับ errors

### Smooth scrolling ไม่เกิด?
1. ตรวจสอบว่าเรียก `useSmoothScroll()` ใน root page
2. ลอง disable browser extensions ที่อาจขัดขวาง

### ScrollTrigger ไม่ accurate?
1. เรียก `ScrollTrigger.refresh()` หลังจาก DOM update
2. ตรวจสอบว่า elements มี height ที่ถูกต้อง

## 📚 Resources

- [GSAP ScrollTrigger Docs](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Lenis Smooth Scroll](https://github.com/studio-freight/lenis)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**สร้างเมื่อ:** August 2026  
**อัปเดตล่าสุด:** v2.3.4
