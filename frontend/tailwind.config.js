/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#007AFF",
          soft: "#3A93FF",
        },
        success: "#34C759",
        warning: "#FF9F0A",
        danger: "#FF453A",
        ink: {
          DEFAULT: "#111827",
          soft: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "28px",
      },
      backdropBlur: {
        12: "12px",
        20: "20px",
        30: "30px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.12)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.18)",
        soft: "0 2px 10px rgba(0,0,0,0.06)",
      },
      transitionDuration: {
        fast: "120ms",
        std: "180ms",
        slow: "240ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 180ms ease-out",
      },
    },
  },
  plugins: [],
};
