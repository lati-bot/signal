import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: ['"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      colors: {
        cream: "#faf8f5",
        ink: "#1a1a1a",
        sand: "#e8e2d9",
        warm: {
          50: "#fdf9f3",
          100: "#f5ede0",
          200: "#e8dcc8",
          300: "#d4c5a9",
          400: "#b8a682",
          500: "#9c8860",
          600: "#7d6c4a",
          700: "#5e5138",
          800: "#403728",
          900: "#2a241a",
        },
        accent: {
          DEFAULT: "#c4553a",
          light: "#d4745c",
          dark: "#a3412b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
