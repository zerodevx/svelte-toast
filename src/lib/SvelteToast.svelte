<script>
import { fly } from 'svelte/transition'
import { flip } from 'svelte/animate'
import { toast } from './stores.js'
import Controller from './Controller.svelte'
import View from './View.svelte'

/** @type {import('./stores.js').SvelteToastOptions} */
export let options = {}
/** @type {string|'default'} */
export let target = 'default'

/** @type {import('./stores.js').SvelteToastOptions} */
const defaults = {
  duration: 4000,
  initial: 1,
  next: 0,
  pausable: 'hidden',
  dismissable: true,
  reversed: true,
  intro: { x: 256 },
  component: View
}
/** @type {import('./stores.js').SvelteToastOptions[]} */
let items = []
/** @type {import('./stores.js').SvelteToastOptions} */
let merged
/** @type {Object<string,string|number>|undefined} */
let theme

/** @param {Object<string,string|number>} [obj] */
function toStyles(obj) {
  return obj ? Object.keys(obj).reduce((a, c) => `${a}${c}:${obj[c]};`, '') : undefined
}

$: {
  ;({ theme, ...merged } = { ...defaults, ...options })
  toast._init(target, merged)
}
$: {
  const _items = $toast.filter((i) => i.target === target)
  if (merged.reversed) _items.reverse()
  items = _items
}
</script>

<ul class="_toastContainer" style={toStyles(theme)}>
  {#each items as item (item.id)}
    <li
      class={item.classes?.join(' ')}
      style={toStyles(item.theme)}
      in:fly={item.intro}
      out:fly={item.outro}
      animate:flip={{ duration: 200 }}
    >
      <Controller {item} />
    </li>
  {/each}
</ul>

<style>
:where(._toastContainer) {
  top: var(--toastContainerTop, 1.5rem);
  right: var(--toastContainerRight, 2rem);
  bottom: var(--toastContainerBottom, auto);
  left: var(--toastContainerLeft, auto);
  z-index: var(--toastContainerZIndex, auto);
  position: fixed;
  margin: 0;
  padding: 0;
  list-style-type: none;
  pointer-events: none;
  will-change: contents;
}
</style>
