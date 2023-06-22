<script>
import '@fontsource-variable/inter'
import 'prismjs/themes/prism-tomorrow.css'
import '../app.postcss'
import { dev } from '$app/environment'
</script>

<svelte:head>
  {#if !dev}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-G9JC5N7N1H"></script>
    <script>
    window.dataLayer = window.dataLayer || []
    function gtag() {
      dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', 'G-G9JC5N7N1H')
    </script>
  {/if}
</svelte:head>

<slot />
