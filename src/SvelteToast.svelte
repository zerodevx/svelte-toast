<script>
import { fade, fly } from 'svelte/transition'
import { flip } from 'svelte/animate'
import { toast } from './stores.js'
import ToastItem from './ToastItem.svelte'

export let options = {}
export let namespace = 'default'
export let rootTheme = {}

const defaults = {
  duration: 4000,
  dismissable: true,
  initial: 1,
  progress: 0,
  reversed: false,
  intro: { x: 256 },
  theme: {},
  namespace: 'default'
}
toast._opts(defaults)
$: toast._opts(options)

const getCss = theme => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, '')
const getRootCss = () => Object.keys(rootTheme).reduce((a, c) => `${a}${c}:${rootTheme[c]};`, '')
</script>

<style>
ul {
  top: var(--toastContainerTop,1.5rem);
  right: var(--toastContainerRight,2rem);
  bottom: var(--toastContainerBottom,auto);
  left: var(--toastContainerLeft,auto);
  position: fixed;
  margin: 0;
  padding: 0;
  list-style-type: none;
  pointer-events: auto;
  z-index: 9999;
}
</style>

<ul class="_toastContainer" style={getRootCss()} >
  {#each $toast.filter((i) => i.namespace === namespace) as item (item.id)}
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
