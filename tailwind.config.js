/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      colors: {
        'neo-yellow': '#FFDE00',
        'neo-pink': '#FF90E8',
        'neo-blue': '#00E0FF',
        'neo-green': '#00FF94',
        'neo-red': '#FF5252',
        'neo-off-white': '#FAFAFA',
        'neo-light-yellow': '#FEF08A',
        'neo-light-pink': '#FBCFE8',
        'neo-light-blue': '#BAE6FD',
        'neo-light-green': '#BBF7D0',
      }
    },
  },
  plugins: [],
}
