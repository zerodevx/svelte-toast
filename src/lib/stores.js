import { writable } from 'svelte/store'

const defaults = {
  duration: 4000,
  initial: 1,
  next: 0,
  pausable: false,
  dismissable: true,
  reversed: false,
  intro: { x: 256 }
}

const createToast = () => {
  const { subscribe, update } = writable([])
  let count = 0
  const options = {}
  const _obj = (obj) => obj instanceof Object
  const push = (msg, opts = {}) => {
    const param = { target: 'default', ...(_obj(msg) ? msg : { ...opts, msg }) }
    const conf = options[param.target] || {}
    const entry = {
      ...defaults,
      ...conf,
      ...param,
      theme: { ...conf.theme, ...param.theme },
      classes: [...(conf.classes || []), ...(param.classes || [])],
      id: ++count
    }
    update((n) => (entry.reversed ? [...n, entry] : [entry, ...n]))
    return count
  }
  const pop = (id) => {
    update((n) => {
      if (!n.length || id === 0) return []
      if (_obj(id)) return n.filter((i) => id(i))
      const target = id || Math.max(...n.map((i) => i.id))
      return n.filter((i) => i.id !== target)
    })
  }
  const set = (id, opts = {}) => {
    const param = _obj(id) ? { ...id } : { ...opts, id }
    update((n) => {
      const idx = n.findIndex((i) => i.id === param.id)
      if (idx > -1) {
        n[idx] = { ...n[idx], ...param }
      }
      return n
    })
  }
  const _init = (target = 'default', opts = {}) => {
    options[target] = opts
    return options
  }
  return { subscribe, push, pop, set, _init }
}

export const toast = createToast()
