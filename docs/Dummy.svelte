<script>
import { toast } from '../src'

export let toastId
export let title

const clicked = (ok) => {
  toast.pop(toastId)
  toast.push({
    msg: ok ? 'Accepted!' : 'Declined!',
    target: 'new',
    theme: {
      '--toastBackground': ok ? '#48BB78' : '#F56565'
    }
  })
}
const accepted = () => clicked(true)
const declined = () => clicked(false)
</script>

<div class="w-full h-48 bg-yellow-500 rounded-sm flex flex-col">
  <h1 class="font-bold m-2">{title}</h1>
  <p class="text-sm mx-2 mb-1">
    <span class="font-mono font-bold">toastId={toastId}</span>. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
  </p>
  <div class="flex-1 flex flex-row justify-between">
    <button class="w-28" on:click={declined}>DECLINE</button>
    <button class="w-28" on:click={accepted} data-btn="dummyAccept">ACCEPT</button>
  </div>
</div>
