<script>
/* eslint no-useless-escape: 0 */

import { tick } from 'svelte'
import { SvelteToast, toast } from '../src'

// Hoist to `window` for debug
window.toast = toast

let selected
let code = ''

const handleDefault = () => {
  selected = 'default'
  code = 'toast.push(\'Hello world!\')'
  toast.push('Hello world!')
}

const handleGreen = () => {
  selected = 'green'
  code = `toast.push('Success!', {
  theme: {
    '--toastBackground': '#48BB78',
    '--toastProgressBackground': '#2F855A'
  }
)`
  toast.push('Success!', { theme: { '--toastBackground': '#48BB78', '--toastProgressBackground': '#2F855A' } })
}

const handleYellow = () => {
  selected = 'yellow'
  code = `toast.push('Warning!', {
  theme: {
    '--toastBackground': '#ECC94B',
    '--toastProgressBackground': '#B7791F'
  }
)`
  toast.push('Warning!', { theme: { '--toastBackground': '#ECC94B', '--toastProgressBackground': '#B7791F' } })
}

const handleRed = () => {
  selected = 'red'
  code = `toast.push('Error!', {
  theme: {
    '--toastBackground': '#F56565',
    '--toastProgressBackground': '#C53030'
  }
)`
  toast.push('Error!', { theme: { '--toastBackground': '#F56565', '--toastProgressBackground': '#C53030' } })
}

const handleLong = () => {
  selected = 'long'
  code = 'toast.push(\'Watching the paint dry...\', { duration: 20000 })'
  toast.push('Watching the paint dry...', { duration: 20000 })
}

const handleNodismiss = () => {
  selected = 'nodismiss'
  code = `toast.push('Where the close btn?!?', {
  initial: 0,
  progress: 0,
  dismissable: false
})`
  toast.push('Where the close btn?!?', { initial: 0, progress: 0, dismissable: false })
}

const handleRemove = () => {
  selected = 'remove'
  code = `// Remove the latest toast
toast.pop()

// Or remove a particular one
const id = toast('Yo!')
toast.pop(id)`
  toast.pop()
}

const handleFlip = () => {
  selected = 'flip'
  code = `toast.push('Progress bar is flipped', {
  initial: 0,
  progress: 1
})`
  toast.push('Progress bar is flipped', { initial: 0, progress: 1 })
}

const sleep = t => new Promise(resolve => setTimeout(resolve, t))
const handleLoading = async () => {
  selected = 'loading'
  code = `const sleep = t => new Promise(resolve => setTimeout(resolve, t))
const id = toast.push('Loading, please wait...', {
  duration: 300,
  initial: 0,
  progress: 0,
  dismissable: false
})
await sleep(500)
toast.set(id, { progress: 0.1 })
await sleep(3000)
toast.set(id, { progress: 0.7 })
await sleep(1000)
toast.set(id, { msg: 'Just a bit more', progress: 0.8 })
await sleep(2000)
toast.set(id, { progress: 1 })
`
  const id = toast.push('Loading, please wait...', { duration: 300, initial: 0, progress: 0, dismissable: false })
  await sleep(500)
  toast.set(id, { progress: 0.1 })
  await sleep(3000)
  toast.set(id, { progress: 0.7 })
  await sleep(1000)
  toast.set(id, { msg: 'Just a bit more', progress: 0.8 })
  await sleep(2000)
  toast.set(id, { progress: 1 })
}

let colors = false
const handleColor = () => {
  selected = 'color'
  code = `<style>
:root {
  --toastBackground: rgba(255,255,255,0.98);
  --toastColor: #2D3748;
}
</style>
<script>
  toast.push('Changed some colors')
<\/script>`
  colors = true
  toast.push('Changed some colors')
}

let options = {}
let bottom = false
const handleBottom = async () => {
  selected = 'bottom'
  code = `<style>
:root {
  --toastContainerTop: auto;
  --toastContainerRight: auto;
  --toastContainerBottom: 8rem;
  --toastContainerLeft: calc(50vw - 8rem);
}
</style>

<SvelteToast options={{ reversed: true, intro: { y: 192 } }} />

<script>
  toast.push('Bottoms up!')
<\/script>`
  bottom = true
  options = { reversed: true, intro: { y: 128 } }
  await tick()
  toast.push('Bottoms up!')
}

const handleRestore = async () => {
  selected = 'restore'
  code = '// All default settings restored!'
  colors = false
  bottom = false
  options = {}
  await tick()
  toast.push('All themes reset!')
}

</script>

<style>
.colors {
  --toastBackground: rgba(255,255,255,0.98);
  --toastColor: #2D3748;
}
.bottom {
  --toastContainerTop: auto;
  --toastContainerRight: auto;
  --toastContainerBottom: 8rem;
  --toastContainerLeft: calc(50vw - 8rem);
}
</style>

<div class="container">

  <div class="w-full h-64 px-2 mt-4 mb-8">
    <pre class="w-full h-full bg-gray-700 text-gray-200 font-mono border border-gray-500 rounded-sm overflow-scroll p-4"><code>
    {code}
    </code></pre>
  </div>

  <div class="flex flex-row flex-wrap items-center justify-center">

    <button class="btn" class:selected={selected === 'default'} on:click={handleDefault}>DEFAULT</button>
    <button class="btn" class:selected={selected === 'green'} on:click={handleGreen}>GREEN</button>
    <button class="btn" class:selected={selected === 'yellow'} on:click={handleYellow}>YELLOW</button>
    <button class="btn" class:selected={selected === 'red'} on:click={handleRed}>RED</button>
    <button class="btn" class:selected={selected === 'long'} on:click={handleLong}>LONG TIME</button>
    <button class="btn" class:selected={selected === 'nodismiss'} on:click={handleNodismiss}>NO DISMISS</button>
    <button class="btn" class:selected={selected === 'remove'} on:click={handleRemove}>REMOVE LAST</button>
    <button class="btn" class:selected={selected === 'flip'} on:click={handleFlip}>FLIP PROGRESS</button>
    <button class="btn" class:selected={selected === 'loading'} on:click={handleLoading}>USE AS LOADING INDICATOR</button>
    <button class="btn" class:selected={selected === 'color'} on:click={handleColor}>CHANGE DEFAULT COLORS</button>
    <button class="btn" class:selected={selected === 'bottom'} on:click={handleBottom}>POSITION TO BOTTOM</button>
    <button class="btn" class:selected={selected === 'restore'} on:click={handleRestore}>RESTORE DEFAULTS</button>

  </div>
</div>

<div class:colors class:bottom>
  <SvelteToast {options} />
</div>
