import { addIconSelectors } from '@iconify/tailwind'
import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'
import themes from 'daisyui/src/theming/themes'
import dt from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', ...dt.fontFamily.sans]
      }
    }
  },
  plugins: [addIconSelectors(['mdi']), typography, daisyui],
  daisyui: {
    themes: [
      { light: { ...themes.light, primary: '#1C75BC' } },
      { dark: { ...themes.dark, primary: '#8DC3EE' } }
    ]
  }
}
