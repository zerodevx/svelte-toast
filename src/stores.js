import { writable } from 'svelte/store'

const createToast = () => {
  const { subscribe, update } = writable([])
  let count = 0
  let defaults = {}
  const _obj = obj => typeof obj === 'object'
  const push = (msg, opts = {}) => {
    opts = _obj(msg) ? { ...msg } : { ...opts, msg }
    const entry = { ...defaults, ...opts, id: ++count, theme: { ...defaults.theme, ...opts.theme } }
    update(n => entry.reversed ? [...n, entry] : [entry, ...n])
    return count
  }
  const pop = id => {
    update(n => {
      if (n.length === 0 || id === 0) return []
      const target = id || Math.max(...n.map(i => i.id))
      return n.filter(i => i.id !== target)
    })
  }
  const set = (id, opts = {}) => {
    opts = _obj(id) ? { ...id } : { ...opts, id }
    update(n => {
      const idx = n.findIndex(i => i.id === opts.id)
      if (idx > -1) {
        n[idx] = { ...n[idx], ...opts }
      }
      return n
    })
  }
  const _opts = (obj = {}) => {
    defaults = { ...defaults, ...obj, theme: { ...defaults.theme, ...obj.theme } }
    return defaults
  }
  return { subscribe, push, pop, set, _opts }
}

export const toast = createToast()
