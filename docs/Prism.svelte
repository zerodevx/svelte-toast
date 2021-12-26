<script>
/* eslint-disable no-undef */
// Svelte Imports
import { afterUpdate, tick, onMount } from 'svelte'

// Prism Imports
import 'prismjs'
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace.js'

// The code being used
export let code = ''

// link https://prismjs.com/#supported-languages
// import from 'prismjs/components/prism-{lanugage-name}.js'
// The language being rendered
export let language = 'javascript'

// link https://prismjs.com/plugins/line-numbers/
// Turns on and off line numbers
export let showLineNumbers = false

// Link https://prismjs.com/plugins/normalize-whitespace/
// Turns on and off cleanup plugin
export let normalizeWhiteSpace = true

// The defualt config for cleanup white space
export let normalizeWhiteSpaceConfig = {
  'remove-trailing': true,
  'remove-indent': true,
  'left-trim': true,
  'right-trim': true
}

// CSS Classes specified by the user of the component
export let classes = ''

// This is the fake coding element
let fakeCodeEl

// This is pre Element
let preEl

// This stored the formatted HTML to display
let formattedCode = ''

// creates the prism classes
$: prismClasses = `language-${language} ${showLineNumbers ? 'line-numbers' : ''} ${
  normalizeWhiteSpace === true ? '' : 'no-whitespace-normalization'
}`

onMount(() => {
  if (normalizeWhiteSpace) {
    /* eslint no-undef: 'warn' */
    Prism.plugins.NormalizeWhitespace.setDefaults(normalizeWhiteSpaceConfig)
  }
})

afterUpdate(async () => {
  // code variable if they are using a prop
  // Have to use innerText because innerHTML will create weird escape characaters
  if (fakeCodeEl && fakeCodeEl.innerText !== '') {
    code = fakeCodeEl.innerText
  }
  // We need to wait till everything been rendered before we can
  // call highlightAll and load all the plugins
  await tick()
  // This will make sure all the plugins are loaded
  // Prism.highlight will not do that
  Prism.highlightAllUnder(preEl)
})

// Only run if Prism is defined and we code
$: if (typeof Prism !== 'undefined' && code) {
  formattedCode = Prism.highlight(code, Prism.languages[language], language)
}
</script>

<code style="display: none" bind:this={fakeCodeEl}>
  <slot />
</code>
<pre class="{prismClasses} {classes}" bind:this={preEl} {...$$restProps}>
  <code class="language-{language}">
    {@html formattedCode}
  </code>
</pre>
