import { writable } from 'svelte/store'

/**
 * @typedef {import('svelte').ComponentType} SvelteComponent
 */

/**
 * @typedef {import('svelte/transition').FlyParams} FlyParams
 */

/**
 * @typedef {Object} SvelteToastPushed
 * @prop {number} id - toast id
 * @prop {Promise<any>} onpop - promise that resolves to value when toast closed
 */

/**
 * @typedef {Object} SvelteToastPop
 * @prop {number} [id] - remove toast with specified id
 * @prop {any} [value] - onpop resolve value
 * @prop {string} [target] - remove all toasts from target container
 */

/**
 * @typedef {Object} SvelteToastOptions
 * @prop {number} [id] - unique id generated for each toast
 * @prop {string} [target] - container target name to send toast to
 * @prop {string} [msg] - toast message
 * @prop {boolean} [unsafe] - allow unsafe html in toast message
 * @prop {number} [duration] - duration of progress bar tween from initial to next
 * @prop {number} [initial] - initial progress bar value
 * @prop {number} [next] - next progress bar value
 * @prop {'none'|'hover'|'hidden'|'both'} [pausable] - pause the progress bar tween
 * @prop {boolean} [dismissable] - allow dismiss with close button
 * @prop {boolean} [reversed] - display toasts in reverse order
 * @prop {FlyParams} [intro] - toast intro fly animation settings
 * @prop {FlyParams} [outro] - toast outro fade animation settings
 * @prop {Object<string,string|number>} [theme] - css var overrides
 * @prop {string[]} [classes] - user-defined classes
 * @prop {SvelteComponent} [component] - send custom Svelte Component as a message
 * @prop {any} [_resolve]
 */

function createToast() {
  /** @type {import('svelte/store').Writable<SvelteToastOptions[]>} */
  const { subscribe, update } = writable(new Array())

  /** @type {Object<string,SvelteToastOptions>} */
  const defaults = {}
  let count = 0

  function _init(target = 'default', opts = {}) {
    defaults[target] = opts
  }

  /**
   * Send a new toast
   * @param {string|SvelteToastOptions} msg
   * @param {SvelteToastOptions} [opts]
   * @returns {SvelteToastPushed}
   */
  function push(msg, opts) {
    const param = typeof msg === 'object' ? msg : { ...opts, msg }
    const target = param.target || 'default'
    const base = defaults[target] || {}
    const classes = [...(base.classes || []), ...(param.classes || [])]
    const id = ++count
    let _resolve
    const onpop = new Promise((resolve) => (_resolve = resolve))
    const item = { ...base, ...param, target, classes, id, _resolve }
    update((n) => [...n, item])
    return { id, onpop }
  }

  /**
   * Remove toast(s)
   * - toast.pop() // remove the lastest toast
   * - toast.pop(0) // remove all toasts
   * - toast.pop(id) // remove toast with specified id
   * - toast.pop({ target: 'foo' }) // remove all toasts from target `foo`
   * @param {number|SvelteToastPop} [id]
   * @param {SvelteToastPop} [opts]
   */
  function pop(id, opts) {
    update((n) => {
      if (!n.length) return n
      const { id: _id, target, value } = typeof id === 'object' ? id : { ...opts, id }
      const resolve = (/** @type {any[]} */ items) => items.forEach((i) => i._resolve(value))
      const val = _id || target
      if (val) {
        const key = _id ? 'id' : 'target'
        resolve(n.filter((i) => i[key] === val))
        return n.filter((i) => i[key] !== val)
      }
      resolve(_id === 0 ? n : n.slice(-1))
      return _id === 0 ? [] : n.slice(0, -1)
    })
  }

  /**
   * Update an existing toast
   * @param {(number|SvelteToastOptions)} id
   * @param {SvelteToastOptions} [opts]
   */
  function set(id, opts) {
    const param = typeof id === 'object' ? id : { ...opts, id }
    update((n) => {
      const idx = n.findIndex((i) => i.id === param.id)
      if (idx > -1) {
        n[idx] = { ...n[idx], ...param }
      }
      return n
    })
  }

  return { subscribe, push, pop, set, _init }
}

export const toast = createToast()

/** @param {Object<string,string|number>} [theme] */
export function themeToStyle(theme) {
  return theme ? Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, '') : undefined
}

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
