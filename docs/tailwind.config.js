const dt = require('tailwindcss/defaultTheme')

module.exports = {
  mode: 'jit',
  purge: [
    './docs/*.{html,js,svelte}'
  ],
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
  variants: {},
  plugins: []
}
