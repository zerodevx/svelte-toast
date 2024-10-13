<script>
import { onMount, onDestroy } from 'svelte'
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast } from './stores.js'

/** @type {import('./stores.js').SvelteToastOptions} */
export let item

/** @type {any} */
let next = item.initial
let prev = next
let paused = false

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

function handler() {
  document.hidden ? ['hidden', 'both'].includes(item.pausable || '') && pause() : resume()
}

function listen() {
  document.addEventListener('visibilitychange', handler)
  handler()
}

function unlisten() {
  document.removeEventListener('visibilitychange', handler)
}

$: if (next !== item.next) {
  next = item.next
  prev = $progress
  paused = false
  progress.set(next).then(autoclose)
}

onMount(listen)
onDestroy(unlisten)
</script>

<div
  role="status"
  class="_toastController"
  on:mouseenter={() => {
    if (['hover', 'both'].includes(item.pausable || '')) pause()
  }}
  on:mouseleave={resume}
>
  <svelte:component this={item.component} {item} {progress} on:close={(e) => close(e.detail)} />
</div>

<style>
:where(._toastController) {
  pointer-events: auto;
}
</style>
