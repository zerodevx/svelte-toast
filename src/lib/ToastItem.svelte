<script>
import { onMount, onDestroy } from 'svelte'
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast } from './stores'

/** @type {import('./stores').SvelteToastOptions} */
export let item

let next = item.initial
let prev = next
let paused = false
let cprops = {}
let unlisten

const progress = tweened(item.initial, { duration: item.duration, easing: linear })

function close() {
  toast.pop(item.id)
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
    const d = item.duration
    const duration = d - d * (($progress - prev) / (next - prev))
    progress.set(next, { duration }).then(autoclose)
    paused = false
  }
}

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

$: if (item.component) {
  const { props = {}, sendIdTo } = item.component
  cprops = { ...props, ...(sendIdTo && { [sendIdTo]: item.id }) }
}

// `progress` has been renamed to `next`; shim included for backward compatibility, to remove in next major
$: if (!check(item.progress)) {
  item.next = item.progress
}

onMount(listen)

onDestroy(() => {
  if (check(item.onpop, 'function')) {
    item.onpop(item.id)
  }
  unlisten && unlisten()
})
</script>

<div
  class="_toastItem"
  class:pe={item.pausable}
  on:mouseenter={() => {
    if (item.pausable) pause()
  }}
  on:mouseleave={resume}
>
  {#if item.image}
    <img src={item.image} alt="toast" class="_toastImg" />
  {/if}
    <div class="_toastIcon"></div>
  <div role="status" class="_toastMsg" class:pe={item.component}>
    {#if item.component}
      <svelte:component this={item.component.src} {...cprops} />
    {:else}
      {@html item.msg}
    {/if}
  </div>
  {#if item.dismissable}
    <div
      class="_toastBtn pe"
      role="button"
      tabindex="0"
      on:click={close}
      on:keydown={(e) => {
        if (e instanceof KeyboardEvent && ['Enter', ' '].includes(e.key)) close()
      }}
    />
  {/if}
  <progress class="_toastBar" value={$progress} />
</div>

<style>
._toastItem {
  width: var(--toastWidth, 16rem);
  height: var(--toastHeight, auto);
  min-height: var(--toastMinHeight, 3.5rem);
  margin: var(--toastMargin, 0 0 0.5rem 0);
  padding: var(--toastPadding, 0);
  background: var(--toastBackground, rgba(66, 66, 66, 0.9));
  color: var(--toastColor, #fff);
  box-shadow: var(
    --toastBoxShadow,
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06)
  );
  border: var(--toastBorder, none);
  border-radius: var(--toastBorderRadius, 0.125rem);
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  will-change: transform, opacity;
  -webkit-tap-highlight-color: transparent;
}
._toastMsg {
  padding: var(--toastMsgPadding, 0.75rem 0.5rem);
  flex: 1 1 0%;
}

._toastImg {
  height: 100%;
  width: 2rem;
  padding-left: 0.75rem;
}

.pe,
._toastMsg :global(a) {
  pointer-events: auto;
}
._toastBtn {
  width: var(--toastBtnWidth, 2rem);
  height: var(--toastBtnHeight, 100%);
  cursor: pointer;
  outline: none;
}
._toastBtn::after {
  content: var(--toastBtnContent, '✕');
  font: var(--toastBtnFont, 1rem sans-serif);
  display: flex;
  align-items: center;
  justify-content: center;
}

._toastBar {
  top: var(--toastBarTop, auto);
  right: var(--toastBarRight, auto);
  bottom: var(--toastBarBottom, 0);
  left: var(--toastBarLeft, 0);
  height: var(--toastBarHeight, 6px);
  width: var(--toastBarWidth, 100%);
  position: absolute;
  display: block;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  background: transparent;
  pointer-events: none;
}
._toastBar::-webkit-progress-bar {
  background: transparent;
}
/* `--toastProgressBackground` renamed to `--toastBarBackground`; override included for backward compatibility */
._toastBar::-webkit-progress-value {
  background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));
}
._toastBar::-moz-progress-bar {
  background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));
}

._toastIcon::after {
  content: var(--toastIconContent);
  font: var(--toastIconFont, 1rem sans-serif);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--toastIconWidth, 2rem);
  height: var(--toastIconHeight, 100%);
}

</style>
