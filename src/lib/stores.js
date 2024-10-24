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
 * @prop {FlyParams} [outro] - toast outro fly animation settings
 * @prop {Object<string,string|number>} [theme] - css var overrides
 * @prop {string} [class] - class string applied to toast item
 * @prop {SvelteComponent} [view] - Svelte component used as toast view
 * @prop {any} [_resolve]
 * @prop {any} [_props]
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
    const id = ++count
    let _resolve
    const onpop = new Promise((resolve) => (_resolve = resolve))
    const item = { ...base, ...param, target, id, _resolve }
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
