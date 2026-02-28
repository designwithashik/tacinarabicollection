/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#5B1414",
        ink: "#F8F5F2",
        accent: "#C47A5A",
        card: "#6A1A1A",
        muted: "#D9C7C0",
        charcoal: "#3E0E0E",
        gold: "#E5A184",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        display: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
