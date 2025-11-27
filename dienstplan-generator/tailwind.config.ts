import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#e4ecff",
          200: "#c7d7ff",
          300: "#a4bbff",
          400: "#7191ff",
          500: "#4c6cff",
          600: "#3246d6",
          700: "#2535a6",
          800: "#1c2a82",
          900: "#182568"
        }
      }
    }
  },
  plugins: []
};

export default config;
