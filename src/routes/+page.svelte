<script>
/* eslint no-useless-escape: "off" */

import { SvelteToast, toast } from '$lib/index.js'
import { tick } from 'svelte'
import { browser, dev, version } from '$app/environment'
import DummyComponent from './Dummy.svelte'
import camelCase from 'camelcase'
import Prism from 'prismjs'

// Hoist to `window` for tests
if (browser) window.toast = toast

let selected = ''
let code = '// Tap a button below'
let colors = false
let bottom = false
let options = {}
let formatted = ''

const buttons = [
  {
    name: 'DEFAULT',
    code: `toast.push('Hello world!')`,
    run: () => toast.push('Hello world!')
  },
  {
    name: 'COLORED TOAST',
    code: `toast.push('Success!', {
  theme: {
    '--toastColor': 'mintcream',
    '--toastBackground': 'rgba(72,187,120,0.9)',
    '--toastBarBackground': '#2F855A'
  }
})`,
    run: () =>
      toast.push('Success!', {
        theme: {
          '--toastColor': 'mintcream',
          '--toastBackground': 'rgba(72,187,120,0.9)',
          '--toastBarBackground': '#2F855A'
        }
      })
  },
  {
    name: 'RICH HTML',
    code: `toast.push(\`<strong>You won the jackpot!</strong><br>
  Click <a href="#" target="_blank">here</a> for details! 😛\`)`,
    run: () =>
      toast.push(
        '<strong>You won the jackpot!</strong><br>Click <a href="#" target="_blank">here</a> for details! 😛'
      )
  },
  {
    name: 'HIDE PROGRESS BAR',
    code: `toast.push('Hide the progress bar', { 
  theme: {
    '--toastBarHeight': 0
  }
})`,
    run: () => toast.push('Hide the progress bar', { theme: { '--toastBarHeight': 0 } })
  },
  {
    name: 'LONG DURATION',
    code: `toast.push('Watching the paint dry...', { duration: 20000 })`,
    run: () => toast.push('Watching the paint dry...', { duration: 20000 })
  },
  {
    name: 'NO EXPIRY',
    code: `toast.push('Tap button to dismiss', { 
  // Effectively disables autoclose when \`initial\`==\`next\`
  initial: 0
})`,
    run: () => toast.push('Tap button to dismiss', { initial: 0 })
  },
  {
    name: 'NON-DISMISSABLE',
    code: `toast.push('Where the close btn?!?', {
  // Toast can only be dismissed programatically
  initial: 0,
  dismissable: false
})`,
    run: () => toast.push('Where the close btn?!?', { initial: 0, dismissable: false })
  },
  {
    name: 'REMOVE LAST TOAST',
    code: `// Remove the latest toast
toast.pop()

// Or remove a particular one
const id = toast.push('Yo!')
toast.pop(id)`,
    run: () => toast.pop()
  },
  {
    name: 'FLIP PROGRESS BAR',
    code: `toast.push('Progress bar is flipped', {
  // Sets the bar to progress from 0 to 1 in 6s
  initial: 0,
  next: 1,
  duration: 6000
})`,
    run: () =>
      toast.push('Progress bar is flipped', {
        initial: 0,
        next: 1,
        duration: 6000
      })
  },
  {
    name: 'USE AS LOADING INDICATOR',
    code: `const sleep = t => new Promise(resolve => setTimeout(resolve, t))

const id = toast.push('Loading, please wait...', {
  duration: 300, // Each progress change takes 300ms
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
      const sleep = (/** @type {number|undefined} */ t) =>
        new Promise((resolve) => setTimeout(resolve, t))
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
    run: () =>
      toast.push('<strong>NEW:</strong> Multiple toast container support!', { target: 'new' })
  },
  {
    name: 'REMOVE ALL TOASTS FROM CONTAINER',
    code: `// Remove all toasts from "new" container
toast.pop({ target: 'new' })

// Or remove ALL active toasts from ALL containers
toast.pop(0)`,
    run: () => toast.pop({ target: 'new' })
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
      const id = toast.push({
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
      if (window.TEST_MODE) {
        toast.set(id, {
          component: {
            src: DummyComponent,
            props: { title: 'test reactivity' },
            sendIdTo: 'toastId'
          }
        })
      }
    }
  },
  {
    name: 'PAUSE ON MOUSE HOVER',
    code: `toast.push('Hover me!', { pausable: true })`,
    run: () => toast.push('Hover me!', { pausable: true })
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
        onpop: (id, details) => {
          toast.push(`<strong><tt>onpop()</tt></strong> callback has been executed.`, {
            target: 'new'
          })
          console.log(id, details)
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
  },
  {
    name: 'CUSTOM DISMISS BUTTON',
    code: `toast.push('Say cheese!', {
  theme: {
    '--toastBtnContent': \`url("data:image/svg+xml,...")\`
  }
}`,
    run: () =>
      toast.push('Say cheese!', {
        theme: {
          '--toastBtnContent': window.TEST_MODE
            ? `'x'`
            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' fill='%23F1CB30' viewBox='0 0 512 512' xml:space='preserve'%3E%3Cpath d='M256,0C114.842,0,0,114.842,0,256s114.842,256,256,256s256-114.842,256-256S397.158,0,256,0z'/%3E%3Cg%3E%3Cpath style='fill:%2357575C;' d='M355.297,175.321c-8.161,0-16.167,3.305-21.938,9.092c-5.773,5.772-9.092,13.762-9.092,21.938 c0,8.163,3.32,16.168,9.092,21.94c5.772,5.772,13.777,9.09,21.938,9.09c8.161,0,16.167-3.32,21.938-9.09 c5.773-5.772,9.092-13.777,9.092-21.94c0-8.176-3.32-16.167-9.092-21.938C371.464,178.626,363.472,175.321,355.297,175.321z'/%3E%3Cpath style='fill:%2357575C;' d='M178.641,228.291c5.773-5.772,9.092-13.762,9.092-21.94c0-8.176-3.32-16.167-9.092-21.938 c-5.772-5.787-13.777-9.092-21.938-9.092c-8.161,0-16.167,3.305-21.938,9.092c-5.772,5.772-9.092,13.762-9.092,21.938 c0,8.176,3.32,16.168,9.092,21.94c5.772,5.786,13.777,9.09,21.938,9.09C164.864,237.382,172.87,234.077,178.641,228.291z'/%3E%3C/g%3E%3Cpath style='fill:%23DF6246;' d='M356.49,326.085c-3.603-8.696-12.088-14.367-21.501-14.367H256h-78.991 c-9.413,0-17.898,5.671-21.501,14.367c-3.601,8.696-1.61,18.708,5.046,25.363c25.495,25.493,59.392,39.534,95.446,39.534 s69.952-14.041,95.446-39.534C358.102,344.792,360.093,334.78,356.49,326.085z'/%3E%3Cpath style='fill:%23E69629;' d='M160.552,351.448c-6.656-6.654-8.647-16.665-5.046-25.363c3.603-8.696,12.088-14.367,21.501-14.367 H256V0C114.842,0,0,114.842,0,256s114.842,256,256,256V390.982C219.946,390.982,186.048,376.941,160.552,351.448z M125.673,206.352 c0-8.176,3.32-16.167,9.092-21.938c5.772-5.787,13.777-9.092,21.938-9.092c8.161,0,16.167,3.305,21.938,9.092 c5.773,5.772,9.092,13.762,9.092,21.938c0,8.176-3.32,16.168-9.092,21.94c-5.772,5.786-13.777,9.09-21.938,9.09 c-8.161,0-16.167-3.305-21.938-9.09C128.993,222.52,125.673,214.528,125.673,206.352z'/%3E%3Cpath style='fill:%23DD512A;' d='M177.009,311.718c-9.413,0-17.898,5.671-21.501,14.367c-3.601,8.696-1.61,18.708,5.046,25.363 c25.495,25.493,59.39,39.534,95.445,39.534v-79.264H177.009z'/%3E%3C/svg%3E")`
        }
      })
  }
]

/** @param {{ name: any; code: any; run: any; }} btn */
function clicked(btn) {
  selected = btn.name
  code = btn.code
  btn.run()
  if (browser && !dev) window.gtag('event', 'toast', { event_label: btn.name })
}

// @ts-ignore
$: formatted = Prism.highlight(code, Prism.languages.javascript, 'javascript')
</script>

<svelte:head>
  <title>DEMO | svelte-toast</title>
  <meta
    name="description"
    content="Simple elegant toast notifications for modern web frontends. Use in Vanilla JS or as a Svelte component."
  />
</svelte:head>

<div class="prose mx-auto mb-12 mt-6 px-4">
  <h1 class="mb-2 text-center text-4xl font-extrabold">svelte-toast</h1>
  <div class="mb-6 text-center">
    <a
      class="badge badge-neutral px-4 py-3 text-xs no-underline hover:opacity-80"
      href="https://github.com/zerodevx/svelte-toast"
      title="Visit Github repo"
      target="_blank"
      rel="noreferrer">GITHUB v{version}</a
    >
  </div>
  <p class="mx-auto mb-6 max-w-2xl text-center">
    Simple elegant toast notifications for modern web frontends in very little lines of code.
    Because a demo helps better than a thousand API docs, so here it is. Use in Vanilla JS (<strong
      >8kB</strong
    >
    gzipped) or as a Svelte component.
  </p>
  <pre class="h-80 w-full"><code>{@html formatted}</code></pre>
  <div class="flex flex-wrap justify-around">
    {#each buttons as btn}
      <button
        class="btn btn-primary mb-2 h-16 w-36 text-xs"
        class:selected={selected === btn.name}
        on:click={() => {
          clicked(btn)
        }}
        data-testid={camelCase(btn.name)}>{btn.name}</button
      >
    {/each}
  </div>
</div>

<div class="top">
  <SvelteToast options={{ initial: 0, intro: { y: -64 } }} target="new" />
</div>

<div class:colors class:bottom>
  <SvelteToast {options} />
</div>

<style lang="postcss">
:global(.custom) {
  --toastBackground: #4299e1;
  --toastBarBackground: #2b6cb0;
}
.btn.selected {
  @apply opacity-80;
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
