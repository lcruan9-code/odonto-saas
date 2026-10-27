import type { Config } from "tailwindcss";
import { whiteLabel } from "./src/config/white-label";

// Cores vêm de src/config/white-label.ts. Nomes mantidos por compatibilidade:
// navy = cor principal, primary = secundária (ações), mint = destaque.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: whiteLabel.colors.primary,
        primary: whiteLabel.colors.secondary,
        mint: whiteLabel.colors.accent,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
