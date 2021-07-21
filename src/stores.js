import { writable } from 'svelte/store'

const createToast = () => {
  const { subscribe, update } = writable([])
  let count = 0
  let defaults = {}
  const push = (msgOrComponent, opts = {}) => {
    let msg, component
    if (typeof (msgOrComponent) === 'string') {
      msg = msgOrComponent
    } else {
      component = msgOrComponent
    };
    const entry = {
      id: ++count,
      msg: msg,
      component: component,
      ...defaults,
      ...opts,
      theme: {
        ...defaults.theme, ...opts.theme
      }
    }
    update(n => entry.reversed ? [...n, entry] : [entry, ...n])
    return count
  }
  const pop = id => {
    update(n => id ? n.filter(i => i.id !== id) : n.splice(1))
  }
  const set = (id, obj) => {
    update(n => {
      const idx = n.findIndex(i => i.id === id)
      if (idx > -1) {
        n[idx] = { ...n[idx], ...obj }
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
