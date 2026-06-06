import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#05080d",
        obsidian: "#0a0e14",
        panel: "#101822",
        glass: "rgba(16, 24, 34, 0.72)",
        line: "rgba(148, 163, 184, 0.16)",
        ink: "#e8eef7",
        muted: "#8b9aaf",
        route: "#22c8e8",
        emerald: "#22c55e",
        alert: "#f59e0b",
        danger: "#ef4444",
        signal: "#2563eb",
        violet: "#8b5cf6"
      },
      boxShadow: {
        surface: "0 18px 60px rgba(0, 0, 0, 0.35)",
        glow: "0 0 42px rgba(34, 200, 232, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
