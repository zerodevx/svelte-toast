<script>
import { toast } from '$lib/index.js'

export let toastId = 0
export let title = ''

const clicked = (/** @type {boolean} */ ok) => {
  toast.pop(toastId)
  toast.push({
    msg: ok ? 'Accepted!' : 'Declined!',
    theme: {
      '--toastBackground': ok ? '#48BB78' : '#F56565',
      '--toastBarBackground': ok ? '#2F855A' : '#C53030'
    }
  })
}
const accepted = () => clicked(true)
const declined = () => clicked(false)
</script>

<div class="flex h-40 w-full flex-col bg-yellow-500 p-2">
  <div class="mb-1 flex h-6 flex-row items-center">
    <h1 class="font-bold">{title}</h1>
    <div class="flex-1" />
    <span class="font-mono text-xs font-bold">[toastId: {toastId}]</span>
  </div>
  <p class="flex-1 overflow-y-scroll text-sm">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
    labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
    laboris nisi ut aliquip ex ea commodo consequat.
  </p>
  <div class="flex h-10 flex-row justify-around">
    <button class="btn btn-sm" on:click={declined}>DECLINE</button>
    <button class="btn btn-primary btn-sm" on:click={accepted} data-testid="dummyAccept"
      >ACCEPT</button
    >
  </div>
</div>
