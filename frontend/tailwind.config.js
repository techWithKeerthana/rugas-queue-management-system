/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "sans-serif"],
        display: ["Manrope", "Inter", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#e0ebff",
          200: "#bfd5ff",
          300: "#95b8ff",
          400: "#6f97ff",
          500: "#4b77ff",
          600: "#3359f4",
          700: "#2947de",
          800: "#253db2",
          900: "#24398c",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 10px 30px -18px rgba(37, 59, 133, 0.35)",
        lift: "0 16px 34px -20px rgba(20, 39, 102, 0.42)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms ease-out",
      },
    },
  },
  plugins: [],
}

