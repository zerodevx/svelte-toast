<script>
import { createEventDispatcher } from 'svelte'

export let item
export let progress

const dispatch = createEventDispatcher()

function dismiss() {
  dispatch('close', { value: 'dismiss' })
}
</script>

<div>
  <span
    >{#if item.unsafe}{@html item.msg}{:else}{item.msg}{/if}</span
  >
  {#if item.dismissable}
    <button on:click={dismiss} />
  {/if}
  <progress class="_toastBar" value={$progress} />
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
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  & span {
    padding: var(--toastMsgPadding, 0.75rem 0.5rem);
    flex: 1 1 0%;
  }
  & button {
    background: transparent;
    color: inherit;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    font: var(--toastBtnFont, 1rem sans-serif);
    width: var(--toastBtnWidth, 2rem);
    height: var(--toastBtnHeight, 2rem);
    &:hover {
      opacity: 0.8;
    }
  }
  & button::after {
    content: var(--toastBtnContent, '✕');
    display: flex;
    align-items: center;
    justify-content: center;
  }
  & progress {
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
  & progress::-webkit-progress-bar {
    background: transparent;
  }
  & progress::-webkit-progress-value {
    background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
  }
  & progress::-moz-progress-bar {
    background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
  }
}
</style>
