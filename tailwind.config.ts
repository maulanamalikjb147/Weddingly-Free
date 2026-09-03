import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ovo: ["var(--font-ovo)", "serif"],
        legan: ["var(--font-legan)", "serif"],
        wonder: ["var(--font-wonder)", "sans-serif"],
        thesignature: ["var(--font-thesignature)", "serif"],
        andika: ["var(--font-andika)", "sans-serif"],
        dancingscript: ["var(--font-dancing-script)", "cursive"],
        courgette: ["var(--font-courgette)", "cursive"],
        notonaskharabic: ["var(--font-noto-naskh-arabic)", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        upDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        upDown: "upDown 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
