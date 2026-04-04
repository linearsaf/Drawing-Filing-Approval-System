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
        brand: "var(--color-brand)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        panel: "var(--color-panel)",
        sage: "var(--color-sage)",
        danger: "var(--color-danger)",
        "danger-strong": "var(--color-danger-strong)",
        graphite: "var(--color-graphite)"
      },
      fontFamily: {
        sans: [
          "\"Google Sans Flex\"",
          "Bahnschrift",
          "\"Segoe UI Variable Text\"",
          "\"Trebuchet MS\"",
          "Tahoma",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel: "0 10px 28px rgba(29, 36, 48, 0.06), 0 2px 10px rgba(29, 36, 48, 0.035)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.7)"
      }
    }
  },
  plugins: []
};

export default config;
