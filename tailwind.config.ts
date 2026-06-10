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
        bg: {
          base: "#0D1117",
          surface: "#161B22",
          elevated: "#1C2128",
        },
        border: {
          DEFAULT: "#30363D",
        },
        text: {
          primary: "#E6EDF3",
          secondary: "#8B949E",
          muted: "#6E7681",
        },
        accent: {
          DEFAULT: "#6366F1",
          dim: "#3730A3",
        },
        status: {
          green: "#3FB950",
          amber: "#D29922",
          red: "#F85149",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
