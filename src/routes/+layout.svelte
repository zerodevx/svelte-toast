<script>
import '@fontsource/inter/variable.css'
import '../app.postcss'
import '../app.postcss'
import 'prismjs/themes/prism-tomorrow.css'
import { dev } from '$app/environment'
</script>

<svelte:head>
  <title>svelte-toast | DEMO</title>
  <meta
    name="description"
    content="Simple elegant toast notifications for modern web frontends. Use in Vanilla JS or as a Svelte component."
  />
  {#if !dev}
    <script>
    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', 'G-G9JC5N7N1H')
    location.protocol === 'https:' &&
      (function () {
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-G9JC5N7N1H'
        document.head.appendChild(script)
      })()
    </script>
  {/if}
</svelte:head>

<div class="pt-8 pb-16">
  <h1 class="text-4xl text-center">svelte-toast</h1>
  <div class="h-16 flex flex-col items-center">
    <a href="https://github.com/zerodevx/svelte-toast" title="Fork me on Github">
      <img
        class="opacity-97 hover:opacity-75"
        src="https://img.shields.io/npm/v/@zerodevx/svelte-toast/latest?logo=github&style=for-the-badge&color=blue&label=github"
        alt="@zerodevx"
      />
    </a>
  </div>
  <p class="container px-2 mb-4">
    Simple, elegant, generic, flexible and performant toast notifications. Because a demo helps
    better than a thousand API docs, so here it is. Use in Vanilla JS (8kb gzipped) or as a Svelte
    component.
  </p>
  <slot />
</div>
