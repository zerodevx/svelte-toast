<script>
import { toast } from '$lib/index.js'

export let toastId
export let title

const clicked = (ok) => {
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

<div class="w-full h-40 bg-yellow-500 flex flex-col p-2">
  <div class="h-6 flex flex-row items-center mb-1">
    <h1 class="font-bold">{title}</h1>
    <div class="flex-1" />
    <span class="font-mono text-xs font-bold">[toastId: {toastId}]</span>
  </div>
  <p class="flex-1 text-sm overflow-y-scroll">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
    labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
    laboris nisi ut aliquip ex ea commodo consequat.
  </p>
  <div class="h-10 flex flex-row justify-around">
    <button class="btn btn-sm" on:click={declined}>DECLINE</button>
    <button class="btn btn-sm btn-primary" on:click={accepted} data-testid="dummyAccept"
      >ACCEPT</button
    >
  </div>
</div>
