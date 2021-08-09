<script>
import { toast } from '../src'

export let toastId
export let title

const clicked = () => toast.pop(toastId)
</script>

<div class="w-full h-48 bg-yellow-500 rounded-sm flex flex-col">
  <h1 class="font-bold m-2">{title}</h1>
  <p class="text-sm mx-2 mb-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  <div class="flex-1 flex flex-row justify-between">
    <button class="w-28" on:click={clicked}>DECLINE</button>
    <button class="w-28"  on:click={clicked}>ACCEPT</button>
  </div>
</div>
