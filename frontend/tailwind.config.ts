import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slateink: "#131f3c",
        mintline: "#43d8ad",
        cobalt: "#2669ff",
        peach: "#ffb070",
        cloud: "#f3f7ff",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 20px 30px rgba(19, 31, 60, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
