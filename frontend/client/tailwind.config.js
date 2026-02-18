/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            primary: "#AE7AFF", // Your brand color (Purple)
            secondary: "#121212", // Dark background
        }
    },
  },
  plugins: [],
}