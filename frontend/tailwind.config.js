/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      transitionProperty: {
        'transform': 'transform',
      },
      colors: {
        // Main background (slightly lighter than pure black)
        background: '#121212',
        
        // Card backgrounds (subtle dark gray)
        'card': '#1E1E1E',
        'card-hover': '#252525',
        
        // Text colors
        'text-primary': '#E1E1E1',   // Bright but not pure white
        'text-secondary': '#A1A1A1', // Muted text
        
        // Accent colors
        'primary': '#6366f1',        // Your existing primary color
        'primary-hover': '#818cf8',
        
        // Border colors
        'border-dark': '#2E2E2E',
      },
    },
  },
  plugins: [],
}