<script>
import { onMount, onDestroy } from 'svelte'
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast } from './stores.js'

/** @type {import('./stores.js').SvelteToastOptions} */
export let item

let next = item.initial || 0
let prev = next
let paused = false

const progress = tweened(item.initial, { duration: item.duration, easing: linear })

/** @param {CustomEvent} [ev] */
function close(ev) {
  const { value } = ev?.detail || {}
  toast.pop(item.id, { value })
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
    const d = item.duration || 0
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
  next = item.next || 0
  prev = $progress
  paused = false
  progress.set(next).then(autoclose)
}

onMount(listen)
onDestroy(unlisten)
</script>

<div
  role="status"
  on:mouseenter={() => {
    if (['hover', 'both'].includes(item.pausable || '')) pause()
  }}
  on:mouseleave={resume}
>
  <svelte:component this={item.view} {item} {progress} on:close={close} />
</div>
