import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        brand: {
          violet: "#7C5CFC",
          blue:   "#3B9BF5",
          green:  "#10B981",
          coral:  "#E5725C",
          amber:  "#F59E0B",
        },
        surface: {
          base: "#050508",
          card: "rgba(10,10,14,0.85)",
          glass: "rgba(255,255,255,0.04)",
        },
      },
      borderRadius: {
        input:  "12px",
        card:   "16px",
        "2xl":  "1rem",
        "3xl":  "1.5rem",
        "4xl":  "2rem",
      },
      boxShadow: {
        card: "0 4px 32px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset",
        glow: "0 0 40px rgba(124,92,252,0.15)",
        "glow-blue": "0 0 40px rgba(59,155,245,0.12)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.32,0.72,0,1) forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "typing": "typing 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(2rem)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        typing: {
          "0%,100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
