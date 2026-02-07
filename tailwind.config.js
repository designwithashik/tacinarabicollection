/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#f2e8df",
        ink: "#111111",
        accent: "#8a4b3c",
        card: "#ffffff",
        muted: "#6b5f57",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 17, 17, 0.08)",
      },
    },
  },
  plugins: [],
};
