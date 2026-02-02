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
        azyr: {
          black: 'oklch(0.15 0 0)',
          charcoal: 'oklch(0.25 0 0)',
          cream: 'oklch(0.97 0.01 85)',
          warmWhite: 'oklch(0.99 0 0)',
          gold: 'oklch(0.70 0.12 85)',
          taupe: 'oklch(0.65 0.02 85)',
          sage: 'oklch(0.70 0.03 145)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
