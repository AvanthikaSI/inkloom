/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          blue: '#3B82F6',
          slate: '#64748B',
          canvas: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
