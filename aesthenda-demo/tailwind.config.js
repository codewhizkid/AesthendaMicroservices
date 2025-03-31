/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        primary: 'var(--color-primary, #A9A29A)',
        secondary: 'var(--color-secondary, #BEBCBB)',
        accent: 'var(--color-accent, #C0A371)',
        
        // Brand colors
        'brand-gray-dark': '#A9A29A',
        'brand-gray-medium': '#BEBCBB',
        'brand-gray-light': '#D2D0D1',
        'brand-gold': '#C0A371',
        
        // Tenant-specific variables that will be dynamically set
        'tenant-primary': 'var(--tenant-primary, #A9A29A)',
        'tenant-secondary': 'var(--tenant-secondary, #BEBCBB)',
        'tenant-accent': 'var(--tenant-accent, #C0A371)',
        'tenant-bg': 'var(--tenant-bg, #FFFFFF)',
        'tenant-text': 'var(--tenant-text, #333333)',
      },
      fontFamily: {
        'tenant': ['var(--tenant-font-family)', 'Poppins', 'sans-serif'],
        'sans': ['Poppins', 'sans-serif'],
        'serif': ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
} 