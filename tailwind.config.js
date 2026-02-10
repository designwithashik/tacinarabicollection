/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#f8f5ef",
        ink: "#1e1e1e",
        accent: "#c8a96b",
        card: "#ffffff",
        muted: "#6f6860",
        charcoal: "#232323",
        gold: "#c8a96b",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        display: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 34px rgba(35, 35, 35, 0.1)",
      },
    },
  },
  plugins: [],
};
