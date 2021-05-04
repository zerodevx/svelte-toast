[![npm (scoped)](https://img.shields.io/npm/v/@zerodevx/svelte-toast)](https://www.npmjs.com/package/@zerodevx/svelte-toast)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# svelte-toast

> Simple elegant toast notifications.

A lightweight, unopinionated and performant toast notification component for modern web frontends in very little
lines of code. Compiled, it's only **15kb** minified (**6kb** gzipped) and can be used in Vanilla JS, or as a
Svelte component.

Because a demo helps better than a thousand API docs: https://zerodevx.github.io/svelte-toast/

## Usage

Install the package:

```bash
$ npm i -D @zerodevx/svelte-toast
```

The following are exported:

*  `SvelteToast` as the toast container;
*  `toast` as the toast emitter.

### Svelte

If you're using this in a Svelte app, import the toast container and place it in your app shell.

`App.svelte`:

```html
<script>
import { SvelteToast } from '@zerodevx/svelte-toast'

// Optionally set default options here
const options = {
  ...
}
</script>

...
<SvelteToast {options} />

```

Use anywhere in your app - just import the toast emitter.

`MyComponent.svelte`:

```html
<script>
import { toast } from '@zerodevx/svelte-toast'
</script>

<button on:click={() => toast.push('Hello world!')}>EMIT TOAST</button>
```

### Vanilla JS

For any other application with a bundler, something like this should work:

```js
import { SvelteToast, toast } from '@zerodevx/svelte-toast'

const app = new SvelteToast({
  // Set where the toast container should be appended into
  target: document.body,
  props: {
    options: {
      // Optionally set default options here
      ...
    }
  }
})

toast.push('Hello world!')
```

### CDN

Or if you prefer to go old-school javascript and a CDN:

```html
<head>
  ...
  <!-- Load `toast` and `SvelteToast` into global scope  -->
  <script src="https://cdn.jsdelivr.net/npm/@zerodevx/svelte-toast@0"></script>
  <!-- Register the app -->
  <script>
    const toastApp = new SvelteToast({
      // Set where the toast container should be appended into
      target: document.body,
      props: {
        options: {
          // Optionally set default options here
          ...
        }
      }
    })

    // Now you can `toast` anywhere!
    toast.push('Hello world!');
  </script>
</head>
```

## Theming

In general, use CSS variables - the following (self-explanatory) vars are exposed:

```css
._toastContainer {
  top: var(--toastContainerTop, 1.5rem);
  right: var(--toastContainerRight, 2rem);
  bottom: var(--toastContainerBottom, auto);
  left: var(--toastContainerLeft, auto);
}

._toastItem {
  width: var(--toastWidth, 16rem);
  height: var(--toastHeight, auto);
  min-height: var(--toastMinHeight, 3.5rem);
  margin: var(--toastMargin, 0 0 0.5rem 0);
  background: var(--toastBackground, rgba(66,66,66,0.9));
  color: var(--toastColor, #FFF);
  box-shadow: var(--toastBoxShadow, 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06));
  border-radius: var(--toastBorderRadius, 0.125rem);
}

._toastMsg {
  padding: var(--toastMsgPadding, 0.75rem 0.5rem);
}

._toastProgressBar {
  background: var(--toastProgressBackground, rgba(33,150,243,0.75));
}
```

So to apply your custom theme globally, do something like:

```html
<style>
:root {
  --toastBackground: #ABCDEF;
  --toastColor: #123456;
  --toastHeight: 300px;
  ...
}
</style>
```

To apply CSS overrides to a particular Toast Item (on a per-toast basis), emit the toast with options:

```js
toast.push('Yo!', {
  theme: {
    '--toastBackground': 'cyan',
    '--toastColor': 'black',
    ...
  }
})
```

where `theme` is an object containing one or more CSS var key/value pairs.

### Create Your Own Toast Actions

For convenient composing, the recommended way is to create your own common toast actions by stubbing them out.
For example:

`my-theme.js`

```js
import { toast } from '@zerodevx/svelte-toast'

export const success = m => toast.push(m, {
  theme: {
    '--toastBackground': 'green',
    '--toastColor': 'white',
    '--toastProgressBackground': 'darkgreen'
  }
})

export const warning = m => toast.push(m, { theme: { ... } })

export const failure = m => toast.push(m, { theme: { ... } })
```

Then simply import these stubs in your consuming component:

```js
import { success, warning, failure } from './my-theme`

// do something, then
success('It works!')
```

### Rich HTML

Toast messages can be in rich HTML too - for example:

```js
// Definitely not spam
toast.push(`<strong>You won the jackpot!</strong><br>
  Click <a href="#" target="_blank">here</a> for details! 😛`)
```

### Custom Fonts

In a Svelte app, the easiest way to apply custom font styles is to wrap the toast container
then apply styles on the wrapper:

```html
<style>
  .wrap {
    font-family: Roboto, sans-serif;
    font-size: 0.875rem;
    ...
  }
  .wrap :global(strong) {
    font-weight: 600;
  }
</style>

<div class="wrap">
  <SvelteToast />
</div>
```

In Vanilla JS, simply apply your styles to the `._toastMsg` class:

```css
._toastMsg {
  font-family: Roboto, sans-serif;
  ...
}
```

## Options

```js
// Default options
const options = {
  duration: 4000,       // duration of progress bar tween
  dismissable: true,    // allow dismiss with close button
  initial: 1,           // initial progress bar value
  progress: 0,          // current progress
  reversed: false,      // insert new toast to bottom of stack
  intro: { x: 256 },    // toast intro fly animation settings
  theme: {}             // css var overrides
}
```

## Toast API

```js
const id = toast.push(message, { options })
toast.pop(id)
toast.set(id, { options })
```

## License

ISC

## To-do

- [ ] Definitely improve the docs
- [ ] Create some option presets
