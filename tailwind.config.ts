import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ee6f2c",
          50: "#fef3ec",
          100: "#fde4d3",
          200: "#fbc5a6",
          300: "#f89f6e",
          400: "#f47d42",
          500: "#ee6f2c", // رنگ اصلی
          600: "#df5a1f",
          700: "#ba451b",
          800: "#94381e",
          900: "#77311b",
        },
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;