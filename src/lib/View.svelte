<script>
import { createEventDispatcher } from 'svelte'

export let item
export let progress

const dispatch = createEventDispatcher()

function dismiss() {
  dispatch('close', { value: 'dismiss' })
}
</script>

<div class="_fc">
  <span class:_pe={item.unsafe || ['hover', 'both'].includes(item.pausable)}
    >{#if item.unsafe}{@html item.msg}{:else}{item.msg}{/if}</span
  >
  {#if item.dismissable}
    <button class="_fc _pe _rs" on:click={dismiss} />
  {/if}
  <progress class="_rs" value={$progress} />
</div>

<style>
:where(div) {
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
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  &._fc,
  & ._fc {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  & ._pe {
    pointer-events: auto;
  }
  & ._rs {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    margin: 0;
    padding: 0;
  }
  & > span {
    padding: var(--toastMsgPadding, 0.75rem 0.5rem);
    flex: 1 1 0%;
  }
  & > button {
    font: var(--toastBtnFont, 1rem sans-serif);
    width: var(--toastBtnWidth, 2rem);
    height: var(--toastBtnHeight, 2rem);
    color: inherit;
    cursor: pointer;
    justify-content: center;
    &::after {
      content: var(--toastBtnContent, '✕');
    }
    &:hover {
      opacity: 0.8;
    }
  }
  & > progress {
    top: var(--toastBarTop, auto);
    right: var(--toastBarRight, auto);
    bottom: var(--toastBarBottom, 0);
    left: var(--toastBarLeft, 0);
    height: var(--toastBarHeight, 6px);
    width: var(--toastBarWidth, 100%);
    position: absolute;
    display: block;
    &::-webkit-progress-bar {
      background: transparent;
    }
    &::-webkit-progress-value {
      background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
    }
    &::-moz-progress-bar {
      background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
    }
  }
}
</style>
