/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        background: {
          light: '#F3F4F6',
          dark: '#1F2937'
        }
      }
    },
  },
  plugins: [],
}
