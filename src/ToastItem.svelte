<script>
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast } from './stores.js'

export let item

const progress = tweened(item.initial, { duration: item.duration, easing: linear })
const autoclose = () => {
  if ($progress === 1 || $progress === 0) {
    toast.pop(item.id)
  }
}
let next = item.initial
let prev = next
let paused = false

$: if (next !== item.next) {
  next = item.next
  prev = $progress
  paused = false
  progress.set(next).then(autoclose)
}

const pause = () => {
  if (item.pausable && !paused && $progress !== next) {
    progress.set($progress, { duration: 0 })
    paused = true
  }
}

const resume = () => {
  if (item.pausable && paused) {
    const remaining = item.duration - (item.duration * (($progress - prev) / (next - prev)))
    progress.set(next, { duration: remaining }).then(autoclose)
    paused = false
  }
}

const getProps = () => {
  const { props = {}, sendIdTo } = item.component
  if (sendIdTo) {
    props[sendIdTo] = item.id
  }
  return props
}

// `progress` has been renamed to `next`; shim included for backward compatibility, to remove in next major
$: if (typeof item.progress !== 'undefined') {
  item.next = item.progress
}
</script>

<style>
._toastItem {
  width: var(--toastWidth,16rem);
  height: var(--toastHeight,auto);
  min-height: var(--toastMinHeight,3.5rem);
  margin: var(--toastMargin,0 0 0.5rem 0);
  background: var(--toastBackground,rgba(66,66,66,0.9));
  color: var(--toastColor,#FFF);
  box-shadow: var(--toastBoxShadow,0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06));
  border-radius: var(--toastBorderRadius,0.125rem);
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  will-change: transform,opacity;
  -webkit-tap-highlight-color: transparent;
}
._toastMsg {
  padding: var(--toastMsgPadding,0.75rem 0.5rem);
  flex: 1 1 0%;
}
.pe, ._toastMsg :global(a) {
  pointer-events: auto;
}
._toastBtn {
  width: 2rem;
  height: 100%;
  font: 1rem sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
}
._toastBar {
  display: block;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 6px;
  background: transparent;
}
._toastBar::-webkit-progress-bar {
  background: transparent;
}
._toastBar::-webkit-progress-value {
  background: var(--toastProgressBackground,rgba(33,150,243,0.75));
}
._toastBar::-moz-progress-bar {
  background: var(--toastProgressBackground,rgba(33,150,243,0.75));
}
</style>

<div class="_toastItem" class:pe={item.pausable} on:mouseenter={pause} on:mouseleave={resume}>
  <div class="_toastMsg" class:pe={item.component}>
    {#if item.component}
    <svelte:component this={item.component.src} {...getProps()} />
    {:else}
    {@html item.msg}
    {/if}
  </div>
  {#if item.dismissable}
  <div class="_toastBtn pe" role="button" tabindex="-1" on:click={() => toast.pop(item.id)}>✕</div>
  {/if}
  <progress class="_toastBar" value={$progress}></progress>
</div>
