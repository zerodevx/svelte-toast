const dt = require('tailwindcss/defaultTheme')

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', ...dt.fontFamily.sans]
      },
      opacity: {
        97: '.97'
      }
    },
    screens: {
      md: '768px'
    },
    container: {
      center: true
    }
  },
  plugins: []
}

module.exports = config
