<script>
/*eslint no-useless-escape: "off"*/
import { tick } from 'svelte'
import { SvelteToast, toast } from '../src'
import Prism from './Prism.svelte'
import DummyComponent from './Dummy.svelte'
import camelCase from 'camelcase'

// Hoist to `window` for debug
window.toast = toast

let selected
let code = '// Tap a button below'
let colors = false
let bottom = false
let options = {}

const handleClick = (btn) => {
  selected = btn.name
  code = btn.code
  btn.run()
  window.gtag('event', 'toast', { event_label: btn.name })
}

const buttons = [
  {
    name: 'DEFAULT',
    code: `toast.push('Hello world!')`,
    run: () => {
      toast.push('Hello world!')
    }
  },
  {
    name: 'GREEN',
    code: `toast.push('Success!', {
  theme: {
    '--toastBackground': '#48BB78',
    '--toastBarBackground': '#2F855A'
  }
})`,
    run: () => {
      toast.push('Success!', {
        theme: { '--toastBackground': '#48BB78', '--toastBarBackground': '#2F855A' }
      })
    }
  },
  {
    name: 'RED',
    code: `toast.push('Danger!', {
  theme: {
    '--toastBackground': '#F56565',
    '--toastBarBackground': '#C53030'
  }
})`,
    run: () => {
      toast.push('Danger!', {
        theme: { '--toastBackground': '#F56565', '--toastBarBackground': '#C53030' }
      })
    }
  },
  {
    name: 'RICH HTML',
    code: `toast.push(\`<strong>You won the jackpot!</strong><br>
  Click <a href="#" target="_blank">here</a> for details! 😛\`)`,
    run: () => {
      toast.push('<strong>You won the jackpot!</strong><br>Click <a href="#" target="_blank">here</a> for details! 😛')
    }
  },
  {
    name: 'LONG DURATION',
    code: `toast.push('Watching the paint dry...', { duration: 20000 })`,
    run: () => {
      toast.push('Watching the paint dry...', { duration: 20000 })
    }
  },
  {
    name: 'NON-DISMISSABLE',
    code: `toast.push('Where the close btn?!?', {
  initial: 0,
  next: 0,
  dismissable: false
})`,
    run: () => {
      toast.push('Where the close btn?!?', { initial: 0, dismissable: false })
    }
  },
  {
    name: 'REMOVE LAST TOAST',
    code: `// Remove the latest toast
toast.pop()

// Or remove a particular one
const id = toast.push('Yo!')
toast.pop(id)`,
    run: () => {
      toast.pop()
    }
  },
  {
    name: 'FLIP PROGRESS BAR',
    code: `toast.push('Progress bar is flipped', {
  initial: 0,
  next: 1
})`,
    run: () => {
      toast.push('Progress bar is flipped', { initial: 0, next: 1 })
    }
  },
  {
    name: 'USE AS LOADING INDICATOR',
    code: `const sleep = t => new Promise(resolve => setTimeout(resolve, t))

const id = toast.push('Loading, please wait...', {
  duration: 300,
  initial: 0,
  next: 0,
  dismissable: false
})

await sleep(500)
toast.set(id, { next: 0.1 })

await sleep(3000)
toast.set(id, { next: 0.7 })

await sleep(1000)
toast.set(id, { msg: 'Just a bit more', next: 0.8 })

await sleep(2000)
toast.set(id, { next: 1 })`,
    run: async () => {
      const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t))
      const id = toast.push('Loading, please wait...', {
        duration: 300,
        initial: 0,
        dismissable: false
      })
      await sleep(500)
      toast.set(id, { next: 0.1 })
      await sleep(3000)
      toast.set(id, { next: 0.7 })
      await sleep(1000)
      toast.set(id, { msg: 'Just a bit more', next: 0.8 })
      await sleep(2000)
      toast.set(id, { next: 1 })
    }
  },
  {
    name: 'CHANGE DEFAULT COLORS',
    code: `<style>
  :root {
    --toastBackground: rgba(245, 208, 254, 0.95);
    --toastColor: #424242;
    --toastBarBackground: fuchsia;
  }
</style>

<script>
  toast.push('Changed some colors')
<\/script>`,
    run: () => {
      colors = true
      toast.push('Changed some colors')
    }
  },
  {
    name: 'POSITION TO BOTTOM',
    code: `<style>
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
<\/script>`,
    run: async () => {
      bottom = true
      options = { reversed: true, intro: { y: 128 } }
      await tick()
      toast.push('Bottoms up!')
    }
  },
  {
    name: 'RESTORE DEFAULTS',
    code: '// All default settings restored!',
    run: async () => {
      colors = false
      bottom = false
      options = {}
      await tick()
      toast.push('All themes reset!')
    }
  },
  {
    name: 'CREATE NEW TOAST CONTAINER',
    code: `<div class="wrap">
  <SvelteToast target="new" options={{ initial: 0, intro: { y: -64 } }} />
</div>

<script>
  // Send toast to "new" container
  toast.push('NEW: Multiple toast container support!', { target: 'new' })
<\/script>

<style>
  .wrap {
    --toastContainerTop: 0.5rem;
    --toastContainerRight: 0.5rem;
    --toastContainerBottom: auto;
    --toastContainerLeft: 0.5rem;
    --toastWidth: 100%;
    --toastMinHeight: 2rem;
    --toastPadding: 0 0.5rem;
    font-size: 0.875rem;
  }
  @media (min-width: 40rem) {
    .wrap {
      --toastContainerRight: auto;
      --toastContainerLeft: calc(50vw - 20rem);
      --toastWidth: 40rem;
    }
  }
</style>`,
    run: () => {
      toast.push('<strong>NEW:</strong> Multiple toast container support!', { target: 'new' })
    }
  },
  {
    name: 'REMOVE ALL TOASTS FROM CONTAINER',
    code: `// Remove all toasts from "new" container
toast.pop(i => i.target !== 'new')

// Or remove ALL active toasts from ALL containers
toast.pop(0)`,
    run: () => {
      toast.pop((i) => i.target !== 'new')
    }
  },
  {
    name: 'SEND COMPONENT AS A MESSAGE',
    code: `toast.push({
  component: {
    src: DummyComponent, // where \`src\` is a Svelte component
    props: {
      title: 'A Dummy Cookie Component'
    },
    sendIdTo: 'toastId' // send toast id to \`toastId\` prop
  },
  dismissable: false,
  initial: 0,
  theme: {
    '--toastPadding': '0',
    '--toastMsgPadding': '0'
  }
})`,
    run: () => {
      toast.push({
        component: {
          src: DummyComponent,
          props: { title: 'A Dummy Cookie Component' },
          sendIdTo: 'toastId'
        },
        target: 'new',
        dismissable: false,
        initial: 0,
        intro: { y: -192 },
        theme: {
          '--toastPadding': '0',
          '--toastMsgPadding': '0',
          '--toastBackground': 'transparent',
          '--toastBorderRadius': '1rem'
        }
      })
    }
  },
  {
    name: 'PAUSE ON MOUSE HOVER',
    code: `toast.push('Hover me!', { pausable: true })`,
    run: () => {
      toast.push('Hover me!', { pausable: true })
    }
  },
  {
    name: 'RUN CALLBACK ON TOAST REMOVAL',
    code: `toast.push('Wait for it...', {
  onpop: () => {
    toast.push('onpop() callback has been executed.', { target: 'new' })
  }
})`,
    run: () => {
      toast.push('Wait for it...', {
        onpop: () => {
          toast.push(`<strong><tt>onpop()</tt></strong> callback has been executed.`, { target: 'new' })
        }
      })
    }
  },
  {
    name: 'STYLE WITH USER-DEFINED CLASSES',
    code: `<style>
  :global(.custom) {
    --toastBackground: #4299E1;
    --toastBarBackground: #2B6CB0;
  }
</style>

<script>
  toast.push('Styled with custom class', { classes: ['custom'] })
<\/script>

<SvelteToast />`,
    run: async () => {
      const opts = options
      options = { ...options, classes: ['merge1'] }
      await tick()
      toast.push('Styled with custom class', {
        classes: ['custom', 'merge2'],
        onpop: () => {
          options = opts
        }
      })
    }
  }
]
</script>

<style>
:global(.custom) {
  --toastBackground: #4299e1;
  --toastBarBackground: #2b6cb0;
}
.colors {
  --toastBackground: rgba(245, 208, 254, 0.95);
  --toastColor: #424242;
  --toastBarBackground: fuchsia;
}
.bottom {
  --toastContainerTop: auto;
  --toastContainerRight: auto;
  --toastContainerBottom: 8rem;
  --toastContainerLeft: calc(50vw - 8rem);
}
.top {
  --toastContainerTop: 0.5rem;
  --toastContainerRight: 0.5rem;
  --toastContainerBottom: auto;
  --toastContainerLeft: 0.5rem;
  --toastWidth: 100%;
  --toastMinHeight: 2rem;
  --toastPadding: 0 0.5rem;
  font-size: 0.875rem;
}
@media (min-width: 40rem) {
  .top {
    --toastContainerRight: auto;
    --toastContainerLeft: calc(50vw - 20rem);
    --toastWidth: 40rem;
  }
}
</style>

<div class="container">
  <div class="w-full h-64 px-2 mt-4 mb-8">
    <Prism classes="w-full h-full bg-gray-700 text-gray-200 font-mono shadow rounded-sm overflow-scroll p-4">
      {code}
    </Prism>
  </div>
  <div class="flex flex-row flex-wrap items-center justify-center">
    {#each buttons as btn}
      <button
        class:selected={selected === btn.name}
        on:click={() => {
          handleClick(btn)
        }}
        data-btn={camelCase(btn.name)}
      >
        {btn.name}
      </button>
    {/each}
  </div>
</div>

<div class="top">
  <SvelteToast options={{ initial: 0, intro: { y: -64 } }} target="new" />
</div>

<div class:colors class:bottom>
  <SvelteToast {options} />
</div>
