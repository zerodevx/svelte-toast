export { default as SvelteToast } from './SvelteToast.svelte'
export { toast } from './stores.js'
export const PRESET = {
  /** @param {string} args */
  _p(args) {
    const [t, r, b, l, w, x, y, v] = args.split(';')
    return JSON.parse(
      `{"theme":{"--toastContainerTop":"${t}","--toastContainerRight":"${r}","--toastContainerBottom":"${b}","--toastContainerLeft":"${l}"${w ? `,"--toastWidth":"${w}"` : ''}},"intro":{${x ? `"x":"${x}"` : `"y":"${y}"`}},"reversed":${v}}`
    )
  },
  /** @returns {SvelteToastOptions} - Top-right positioning preset */
  get TOP_RIGHT() {
    return this._p('1.5rem;2rem;auto;auto;;256;;true')
  },
  /** @returns {SvelteToastOptions} - Bottom-right positioning preset */
  get BOTTOM_RIGHT() {
    return this._p('auto;2rem;1.5rem;auto;;256;;false')
  },
  /** @returns {SvelteToastOptions} - Bottom-left positioning preset */
  get BOTTOM_LEFT() {
    return this._p('auto;auto;1.5rem;2rem;;-256;;false')
  },
  /** @returns {SvelteToastOptions} - Top-left positioning preset */
  get TOP_LEFT() {
    return this._p('1.5rem;auto;auto;2rem;;-256;;true')
  },
  /** @returns {SvelteToastOptions} - Top-center positioning preset */
  get TOP_CENTER() {
    return this._p('1.5rem;auto;auto;calc(50vw - var(--toastWidth)/2);16rem;;-64;true')
  },
  /** @returns {SvelteToastOptions} - Bottom-center positioning preset */
  get BOTTOM_CENTER() {
    return this._p('auto;auto;1.5rem;calc(50vw - var(--toastWidth)/2);16rem;;64;false')
  }
}

/**
 * @typedef {import('./stores.js').SvelteToastOptions} SvelteToastOptions
 */
