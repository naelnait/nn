/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2fb",
          100: "#d7e0f4",
          200: "#aec0e9",
          300: "#7f9cda",
          400: "#4f74c4",
          500: "#2f54a8",
          600: "#1f3d84",
          700: "#172d61",
          800: "#111f42",
          900: "#0b1f4b",
          950: "#070f26",
        },
        accent: {
          300: "#a9c2f2",
          400: "#7ea6ea",
          500: "#3f65c4",
          600: "#2748a0",
          700: "#1e3f8f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Barlow Condensed'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
