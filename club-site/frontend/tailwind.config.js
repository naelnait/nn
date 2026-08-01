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
        // Semantic conversion tokens, layered on top of the brand primitives
        // above (see DESIGN_TOKENS.md). Used only for ticket/purchase calls
        // to action and scarcity messaging — never for general UI — so the
        // one non-brand color on the site stays meaningful when it appears.
        cta: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        soldout: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "9999px",
      },
      boxShadow: {
        // Solid offset "hard shadow" — no blur — replaces soft drop shadows
        // as the site's one depth cue.
        hard: "6px 6px 0 0 #070f26",
        "hard-sm": "4px 4px 0 0 #070f26",
        "hard-cta": "6px 6px 0 0 #0284c7",
      },
    },
  },
  plugins: [],
};
