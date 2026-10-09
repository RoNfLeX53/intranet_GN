import type { Config } from "tailwindcss";

/**
 * Jetons de design inspirés du DSFR (Système de Design de l'État).
 * - gend : bleu gendarmerie / marine profond (#00205B)
 * - france : bleu France DSFR (#000091)
 * - marianne : rouge Marianne (#E1000F)
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gend: {
          50: "#F1F4FA",
          100: "#E3E9F5",
          200: "#C5D1EA",
          300: "#8FA3CF",
          500: "#3A5A9C",
          700: "#123A7A",
          800: "#0B2C66",
          900: "#00205B",
          950: "#00143A",
        },
        france: "#000091",
        marianne: { DEFAULT: "#E1000F", dark: "#C9191E", light: "#FEECEC" },
        ink: { DEFAULT: "#161616", soft: "#3A3A3A", mute: "#666666" },
        line: "#DDDDDD",
        surface: { DEFAULT: "#F6F6F6", alt: "#EEEEEE" },
        success: { DEFAULT: "#18753C", light: "#DFFEE6" },
        warning: { DEFAULT: "#B34000", light: "#FFF0E5" },
        info: { DEFAULT: "#0063CB", light: "#E8EDFF" },
      },
      fontFamily: {
        sans: ["Marianne", "Inter", "Segoe UI", "Arial", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
