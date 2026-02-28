/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FFFFFF",
        ink: "#1E1E1E",
        accent: "#C47A5A",
        card: "#FFFFFF",
        muted: "#6E6E6E",
        charcoal: "#5B1414",
        gold: "#C47A5A",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        display: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
