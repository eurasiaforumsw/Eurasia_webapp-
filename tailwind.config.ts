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
        // Surface tonal ladder (dark mode primary)
        surface: {
          deep: "hsl(210, 45%, 4%)",
          base: "hsl(210, 40%, 8%)",
          raised: "hsl(210, 35%, 12%)",
          subtle: "hsl(210, 25%, 18%)",
          canvas: "hsl(210, 15%, 96%)",
        },
        // Brand accents from EFSW logo
        navy: {
          DEFAULT: "hsl(210, 70%, 18%)",
          deep: "hsl(210, 65%, 12%)",
        },
        teal: {
          DEFAULT: "hsl(187, 62%, 30%)",
          vivid: "hsl(187, 62%, 30%)",
          light: "hsl(187, 45%, 85%)",
        },
        green: {
          growth: "hsl(122, 35%, 46%)",
        },
        gold: {
          laurel: "hsl(43, 54%, 50%)",
        },
        ember: {
          warm: "hsl(24, 65%, 58%)",
        },
        // Text colors
        text: {
          primary: "hsl(210, 15%, 95%)",
          secondary: "hsl(210, 10%, 70%)",
          muted: "hsl(210, 8%, 50%)",
          "on-light": "hsl(210, 25%, 15%)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Fluid typography via clamp()
        hero: "clamp(3.5rem, 8vw, 7rem)",
        xl: "clamp(2.5rem, 5vw, 4.5rem)",
        lg: "clamp(1.75rem, 3vw, 2.5rem)",
        base: "clamp(1rem, 2vw, 1.125rem)",
        sm: "clamp(0.875rem, 1.5vw, 1rem)",
        xs: "clamp(0.75rem, 1.2vw, 0.875rem)",
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2.5rem",
        xl: "4rem",
        "2xl": "6rem",
      },
      borderRadius: {
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        full: "999px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
