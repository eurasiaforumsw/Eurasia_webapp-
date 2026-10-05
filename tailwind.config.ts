import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface tonal ladder (RGB channels — supports Tailwind alpha like bg-surface-base/80)
        surface: {
          deepest: "rgb(var(--surface-deepest) / <alpha-value>)",
          deep: "rgb(var(--surface-deep) / <alpha-value>)",
          base: "rgb(var(--surface-base) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
        },
        // Text hierarchy (RGB channels)
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },

        // Brand colors from EFSW logo
        navy: {
          DEFAULT: "hsl(210, 70%, 18%)",
          deep: "hsl(210, 65%, 12%)",
        },
        teal: {
          DEFAULT: "hsl(187, 62%, 50%)",
          vivid: "hsl(187, 62%, 50%)",
          light: "hsl(187, 45%, 85%)",
          dark: "hsl(187, 62%, 30%)",
        },

        // Accent system (RGB channels)
        accent: {
          primary: "rgb(var(--accent-primary) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
        },

        // Semantic colors
        success: "hsl(155, 62%, 50%)",
        warning: "hsl(43, 90%, 60%)",
        error: "hsl(0, 72%, 58%)",
        info: "hsl(210, 90%, 60%)",

        // Support colors
        green: {
          growth: "hsl(122, 35%, 46%)",
        },
        gold: {
          laurel: "hsl(43, 54%, 50%)",
        },
        ember: {
          warm: "hsl(24, 65%, 58%)",
        },

        // Border system (RGB channels)
        border: {
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          base: "rgb(var(--border-base) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Bricolage Grotesque", "Noto Sans Thai", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "Noto Sans Thai", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
      },
      fontSize: {
        // Fluid typography via clamp() - fully responsive
        hero: "clamp(3.5rem, 8vw, 7rem)",
        "display-lg": "clamp(2.5rem, 5vw, 4.5rem)",
        "display-md": "clamp(1.75rem, 3vw, 2.5rem)",
        "display-sm": "clamp(1.5rem, 2.5vw, 2rem)",
        xl: "clamp(1.25rem, 2vw, 1.5rem)",
        lg: "clamp(1.125rem, 1.8vw, 1.25rem)",
        base: "clamp(1rem, 1.5vw, 1.125rem)",
        sm: "clamp(0.875rem, 1.3vw, 1rem)",
        xs: "clamp(0.75rem, 1.2vw, 0.875rem)",
        "2xs": "clamp(0.6875rem, 1vw, 0.8125rem)",
      },
      lineHeight: {
        tight: "1.15",
        snug: "1.35",
        normal: "1.5",
        relaxed: "1.65",
        loose: "1.85",
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.03em",
        normal: "0",
        wide: "0.02em",
        wider: "0.05em",
        widest: "0.1em",
      },
      spacing: {
        // Semantic spacing scale
        xs: "var(--space-xs, 0.5rem)",
        sm: "var(--space-sm, 1rem)",
        md: "var(--space-md, 1.5rem)",
        lg: "var(--space-lg, 2.5rem)",
        xl: "var(--space-xl, 4rem)",
        "2xl": "var(--space-2xl, 6rem)",
        "3xl": "8rem",
        "4xl": "12rem",
      },
      borderRadius: {
        sm: "var(--radius-sm, 0.5rem)",
        DEFAULT: "var(--radius-md, 1rem)",
        md: "var(--radius-md, 1rem)",
        lg: "var(--radius-lg, 1.5rem)",
        xl: "2rem",
        "2xl": "3rem",
        full: "var(--radius-full, 999px)",
      },
      boxShadow: {
        // Elevated shadow system
        subtle: "0 1px 2px 0 var(--shadow-soft, rgba(0, 0, 0, 0.05))",
        base: "0 2px 8px -2px var(--shadow, rgba(0, 0, 0, 0.1)), 0 4px 12px -4px var(--shadow-soft, rgba(0, 0, 0, 0.05))",
        md: "0 4px 16px -4px var(--shadow, rgba(0, 0, 0, 0.15)), 0 8px 24px -8px var(--shadow-soft, rgba(0, 0, 0, 0.1))",
        lg: "0 8px 32px -8px var(--shadow, rgba(0, 0, 0, 0.2)), 0 16px 48px -16px var(--shadow-soft, rgba(0, 0, 0, 0.15))",
        xl: "0 16px 64px -16px var(--shadow, rgba(0, 0, 0, 0.25)), 0 32px 96px -32px var(--shadow-soft, rgba(0, 0, 0, 0.2))",
        glow: "0 0 24px -4px var(--accent-primary, hsl(187, 62%, 50%))",
        "glow-lg": "0 0 48px -8px var(--accent-primary, hsl(187, 62%, 50%))",
        inner: "inset 0 2px 4px 0 var(--shadow-soft, rgba(0, 0, 0, 0.06))",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
      },
      transitionDuration: {
        "50": "50ms",
        "150": "150ms",
        "250": "250ms",
        "350": "350ms",
        "450": "450ms",
        short: "var(--dur-short, 220ms)",
        med: "var(--dur-med, 500ms)",
        long: "var(--dur-long, 800ms)",
      },
      transitionTimingFunction: {
        smooth: "var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1))",
        expo: "var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        spring: "var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))",
        "expo-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        // Enhanced animation system
        "fade-in": "fadeIn 0.6s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "fade-out": "fadeOut 0.4s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "slide-up": "slideUp 0.8s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "slide-down": "slideDown 0.8s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "slide-in-left": "slideInLeft 0.6s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "slide-in-right": "slideInRight 0.6s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "scale-in": "scaleIn 0.4s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))",
        "scale-out": "scaleOut 0.3s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "ripple": "ripple 0.6s var(--ease-expo, cubic-bezier(0.19, 1, 0.22, 1))",
        "bounce-soft": "bounceSoft 0.6s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
