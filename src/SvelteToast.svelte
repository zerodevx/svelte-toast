<script>
import { fade, fly } from 'svelte/transition'
import { flip } from 'svelte/animate'
import { toast } from './stores.js'
import ToastItem from './ToastItem.svelte'

export let options = {}
const defaults = {
  duration: 4000,
  dismissable: true,
  initial: 1,
  progress: 0,
  reversed: false,
  intro: { x: 256 },
  theme: {}
}
toast._opts(defaults)

$: toast._opts(options)

const getCss = theme => {
  let css = ''
  for (const [key, val] of Object.entries(theme)) {
    css += `${key}:${val};`
  }
  return css || undefined
}
</script>

<style>
ul {
  position: fixed;
  margin: 0;
  padding: 0;
  list-style-type: none;
  z-index: 9999;
  pointer-events: none;
  top: var(--toastContainerTop,1.5rem);
  right: var(--toastContainerRight,2rem);
  bottom: var(--toastContainerBottom,auto);
  left: var(--toastContainerLeft,auto);
}
</style>

<ul>
  {#each $toast as item (item.id)}
  <li
    in:fly={item.intro}
    out:fade
    animate:flip={{ duration: 200 }}
    style={getCss(item.theme)}
    >
    <ToastItem {item} />
  </li>
  {/each}
</ul>
