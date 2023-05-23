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

<!-- <div class="relative"> -->
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

<!-- </div> -->

<style>
._toastContainer {
  /* top: var(--toastContainerTop, 0.5rem); */
  /* right: var(--toastContainerRight, 2rem);
  bottom: var(--toastContainerBottom, auto);
  left: var(--toastContainerLeft, auto); */
  /* top: 10px; */
  position: absolute;
  width: 100%;
  overflow-y: hidden;
  /* top: 10rem; */
  /* left: 0;
  right: 0; */
  /* left: 50%;
  transform: translateX(-50%); */
  /* box-sizing: border-box; */
  margin: 2rem 0 0 0;
  padding: 0;
  list-style-type: none;
  pointer-events: none;
  z-index: var(--toastContainerZIndex, 9999);
}
</style>
