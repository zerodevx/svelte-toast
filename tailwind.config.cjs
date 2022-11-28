const dt = require('tailwindcss/defaultTheme')

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...dt.fontFamily.sans]
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
