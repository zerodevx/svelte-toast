<script>
import { onMount, onDestroy } from 'svelte'
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast, themeToStyle } from './stores.js'

/** @type {import('./stores.js').SvelteToastOptions} */
export let item

/** @type {any} */
let next = item.initial
let prev = next
let paused = false
/** @type {any} */
let unlisten

const progress = tweened(item.initial, { duration: item.duration, easing: linear })

/** @param {{value:any}|undefined} [detail] */
function close(detail) {
  toast.pop(item.id, detail)
}

function autoclose() {
  if ($progress === 1 || $progress === 0) close()
}

function pause() {
  if (!paused && $progress !== next) {
    progress.set($progress, { duration: 0 })
    paused = true
  }
}

function resume() {
  if (paused) {
    const d = /** @type {any} */ (item.duration)
    const duration = d - d * (($progress - prev) / (next - prev))
    progress.set(next, { duration }).then(autoclose)
    paused = false
  }
}

/** @param {any} prop */
function check(prop, kind = 'undefined') {
  return typeof prop === kind
}

function listen(d = document) {
  if (check(d.hidden)) return
  const handler = () => (d.hidden ? pause() : resume())
  const name = 'visibilitychange'
  d.addEventListener(name, handler)
  unlisten = () => d.removeEventListener(name, handler)
  handler()
}

$: if (next !== item.next) {
  next = item.next
  prev = $progress
  paused = false
  progress.set(next).then(autoclose)
}

onMount(listen)

onDestroy(() => {
  //item.onpop && item.onpop(item.id, { event })
  unlisten && unlisten()
})
</script>

<div
  role="status"
  class="_toastItem"
  class:pe={item.pausable}
  style={themeToStyle(item.theme)}
  on:mouseenter={() => {
    if (item.pausable) pause()
  }}
  on:mouseleave={resume}
>
  <svelte:component this={item.component} {item} {progress} on:close={(e) => close(e.detail)} />
</div>
