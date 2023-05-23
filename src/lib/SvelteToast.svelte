<script>
import { fade, fly } from 'svelte/transition'
import { flip } from 'svelte/animate'
import { toast } from './stores'
import ToastItem from './ToastItem.svelte'

/** @type {import('./stores').SvelteToastOptions} */
export let options = {}
/** @type {(string|'default')} */
export let target = 'default'

/** @type {import('./stores').SvelteToastOptions[]} */
let items = []

/** @param {Object<string,string|number>} [theme] */
function getCss(theme) {
  return theme ? Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, '') : undefined
}

$: toast._init(target, options)

$: items = $toast.filter((i) => i.target === target)
</script>

<ul class="_toastContainer mt-4 overflow-hidden">
  {#each items as item (item.id)}
    <li
      class={item.classes?.join(' ')}
      in:fly={item.intro}
      out:fade
      animate:flip={{ duration: 200 }}
      style={getCss(item.theme)}
    >
      <ToastItem {item} />
    </li>
  {/each}
</ul>

<style>
._toastContainer {
  position: absolute;
  width: 100%;
  overflow-y: hidden;
  margin: 2rem 0 0 0;
  padding: 0;
  list-style-type: none;
  pointer-events: none;
  z-index: var(--toastContainerZIndex, 9999);
}
</style>
