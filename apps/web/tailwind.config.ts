import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1f2a24",
        panel: "#fffaf0",
        line: "rgba(74, 68, 57, 0.16)",
        clay: "#b86f52",
        moss: "#5f7c5a",
        oat: "#f4ead8"
      },
      boxShadow: {
        premium: "0 24px 60px rgba(54, 43, 31, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
