/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./app/**/*.{js,jsx,ts,tsx}", './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'primary': '#8D5C8A', // Main purple color from the logo and buttons
        'secondary': '#F5F5DC', // Light cream background color
        'tertiary': '#DDC6A1', // Light brown for header and footer
        'bg': '#F1F1F1', // Light background for the main content
        'dark': '#3C3C3C', // Dark gray for text and icons
        'accent': '#9B79A1', // Accent color (darker purple for contrast)
        'btn-hover': '#D6C2E1', // Button hover color
        'highlight': '#D0C9EA', // Light background for cards and elements
        'shadow': '#ccc'
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}


