<script>
import { tweened } from 'svelte/motion'
import { linear } from 'svelte/easing'
import { toast } from './stores.js'

export let item

const progress = tweened(item.initial, { duration: item.duration, easing: linear })
let prev = item.initial

$: if (prev !== item.next) {
  if (item.next === 1 || item.next === 0) {
    progress.set(item.next).then(() => toast.pop(item.id))
  } else {
    progress.set(item.next)
  }
  prev = item.next
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

<div class="_toastItem">
  <div class="_toastMsg" class:pe={item.component}>
    {#if item.component}
    <svelte:component this={item.component.src} {...item.component.props} toastId={item.id}  />
    {:else}
    {@html item.msg}
    {/if}
  </div>
  {#if item.dismissable}
  <div class="_toastBtn pe" role="button" tabindex="-1" on:click={() => toast.pop(item.id)}>✕</div>
  {/if}
  <progress class="_toastBar" value={$progress}></progress>
</div>
