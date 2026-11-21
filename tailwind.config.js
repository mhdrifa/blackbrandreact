/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './brand-management.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f8f7f4',
        obsidian: '#090909',
        charcoal: '#181818',
        champagne: '#e4c280',
        'champagne-soft': '#ffdea2',
        'champagne-dark': '#745b23',
        slate: '#747878',
        hairline: '#e6e4de',
        crimson: '#9f1d1d',
        emerald: '#1b6b3a'
      },
      fontFamily: {
        display: ['Oswald', 'Arial Narrow', 'sans-serif'],
        editorial: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};
