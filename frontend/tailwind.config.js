/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFBF5",
        "paper-raised": "#FFFFFF",
        ink: "#241B3A",
        "ink-soft": "#665D80",
        "ink-faint": "#9C93B0",
        line: "#E9E1F5",
        error: "#E5484D",

        amber: "#FFB020",
        "amber-soft": "#FFF1D6",
        teal: "#00BFA6",
        "teal-soft": "#D6F7F1",
        violet: "#7C5CFC",
        "violet-soft": "#EDE6FF",
        coral: "#FF5C7A",
        "coral-soft": "#FFE0E7",
        sky: "#3AA0FF",
        "sky-soft": "#DDEEFF",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Source Sans 3", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "20px",
        xl: "28px",
      },
      boxShadow: {
        playful: "0 4px 14px rgba(124, 92, 252, 0.15)",
        "playful-lg": "0 10px 30px rgba(124, 92, 252, 0.2)",
      },
    },
  },
  plugins: [],
};