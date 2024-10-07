<script>
import { fade, fly } from 'svelte/transition'
import { flip } from 'svelte/animate'
import { toast, themeToStyle } from './stores.js'
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
  pausable: false,
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

<ul class="_toastContainer" style={themeToStyle(theme)}>
  {#each items as item (item.id)}
    <li
      class={item.classes?.join(' ')}
      in:fly={item.intro}
      out:fade={item.outro}
      animate:flip={{ duration: 200 }}
    >
      <Controller {item} />
    </li>
  {/each}
</ul>

<style>
._toastContainer {
  top: var(--toastContainerTop, 1.5rem);
  right: var(--toastContainerRight, 2rem);
  bottom: var(--toastContainerBottom, auto);
  left: var(--toastContainerLeft, auto);
  position: fixed;
  margin: 0;
  padding: 0;
  list-style-type: none;
  pointer-events: none;
  z-index: var(--toastContainerZIndex, auto);
}
</style>
