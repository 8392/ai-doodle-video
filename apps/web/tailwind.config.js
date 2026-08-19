/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#f4efe4",
        cobalt: "#2f5de8",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Noto Sans SC", "sans-serif"],
        display: ["Noto Serif SC", "serif"],
      },
    },
  },
  plugins: [],
};
