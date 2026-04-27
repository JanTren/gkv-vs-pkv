/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A1A',
        'ink-soft': '#3D3D3D',
        amber: '#D4821A',
        'amber-lt': '#F5ECD9',
        'amber-dk': '#A8620F',
        bg: '#F7F5F2',
        border: '#DDDAD4',
        'border-dk': '#C4C0B8',
        muted: '#7A7672',
      },
      fontFamily: {
        display: ['"Lora"', 'Georgia', 'serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
