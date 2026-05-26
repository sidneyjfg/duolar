import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#080b12",
        panel: "#101522",
        line: "rgba(148, 163, 184, 0.18)"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(2, 6, 23, 0.36)"
      }
    }
  },
  plugins: []
};

export default config;
