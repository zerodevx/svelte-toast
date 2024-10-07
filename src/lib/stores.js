import { writable } from 'svelte/store'

/**
 * @typedef {import('svelte').ComponentType} SvelteComponent
 */

/**
 * @typedef {import('svelte/transition').FlyParams} FlyParams
 */

/**
 * @callback SvelteToastOnPopCallback
 * @param {number} [id] - optionally get the toast id if needed
 * @param {object} [details]
 */

/**
 * @typedef {Object} SvelteToastOptions
 * @prop {number} [id] - unique id generated for every toast
 * @prop {string} [target] - container target name to send toast to
 * @prop {string} [msg] - toast message
 * @prop {number} [duration] - duration of progress bar tween from initial to next
 * @prop {number} [initial] - initial progress bar value
 * @prop {number} [next] - next progress bar value
 * @prop {boolean} [pausable] - pause progress bar tween on mouse hover
 * @prop {boolean} [dismissable] - allow dissmiss with close button
 * @prop {boolean} [reversed] - display toasts in reverse order
 * @prop {FlyParams} [intro] - toast intro fly animation settings
 * @prop {Object<string,string|number>} [theme] - css var overrides
 * @prop {string[]} [classes] - user-defined classes
 * @prop {SvelteToastOnPopCallback} [onpop] - callback that runs on toast dismiss
 * @prop {SvelteComponent} [component] - send custom Svelte Component as a message
 */

function createToast() {
  const { subscribe, update } = writable(new Array())
  /** @type {Object<string,SvelteToastOptions>} */
  const options = {}
  let count = 0

  /** @param {any} obj */
  function _obj(obj) {
    return obj instanceof Object
  }

  function _init(target = 'default', opts = {}) {
    options[target] = opts
  }

  /**
   * Send a new toast
   * @param {(string|SvelteToastOptions)} msg
   * @param {SvelteToastOptions} [opts]
   * @returns {number}
   */
  function push(msg, opts) {
    const param = {
      target: 'default',
      ...(_obj(msg) ? /** @type {SvelteToastOptions} */ (msg) : { ...opts, msg })
    }
    const conf = options[param.target] || {}
    const entry = {
      ...conf,
      ...param,
      theme: { ...conf.theme, ...param.theme },
      classes: [...(conf.classes || []), ...(param.classes || [])],
      id: ++count
    }
    update((n) => (entry.reversed ? [...n, entry] : [entry, ...n]))
    return count
  }

  /**
   * Remove toast(s)
   * - toast.pop() // removes the last toast
   * - toast.pop(0) // remove all toasts
   * - toast.pop(id) // removes the toast with specified `id`
   * - toast.pop({ target: 'foo' }) // remove all toasts from target `foo`
   * @param {(number|Object<'target',string>)} [id]
   */
  function pop(id) {
    update((n) => {
      if (!n.length || id === 0) return []
      // Filter function is deprecated; shim added for backward compatibility
      if (typeof id === 'function') return n.filter((i) => id(i))
      if (_obj(id))
        return n.filter(/** @type {SvelteToastOptions[]} i */ (i) => i.target !== id.target)
      const found = id || Math.max(...n.map((i) => i.id))
      return n.filter((i) => i.id !== found)
    })
  }

  /**
   * Update an existing toast
   * @param {(number|SvelteToastOptions)} id
   * @param {SvelteToastOptions} [opts]
   */
  function set(id, opts) {
    /** @type {any} */
    const param = _obj(id) ? id : { ...opts, id }
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
