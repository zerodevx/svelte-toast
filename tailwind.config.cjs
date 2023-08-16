const { addDynamicIconSelectors } = require('@iconify/tailwind')
const dt = require('tailwindcss/defaultTheme')
const themes = require('daisyui/src/theming/themes')

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', ...dt.fontFamily.sans]
      }
    }
  },
  plugins: [addDynamicIconSelectors(), require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...themes['[data-theme=light]'],
          primary: '#1C75BC',
          'primary-content': 'white'
        }
      },
      {
        dark: {
          ...themes['[data-theme=dark]'],
          primary: '#1C75BC'
        }
      }
    ]
  }
}

module.exports = config
