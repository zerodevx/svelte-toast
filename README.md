[![npm (scoped)](https://img.shields.io/npm/v/@zerodevx/svelte-toast/latest)](https://www.npmjs.com/package/@zerodevx/svelte-toast)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Lines of code](https://img.shields.io/tokei/lines/github/zerodevx/svelte-toast?label=lines%20of%20code)](https://github.com/XAMPPRocky/tokei)
[![Size minified](https://img.shields.io/bundlephobia/min/@zerodevx/svelte-toast?label=minified)](https://bundlephobia.com/)
[![Size gzipped](https://img.shields.io/bundlephobia/minzip/@zerodevx/svelte-toast?label=gzipped)](https://bundlephobia.com/)

# svelte-toast

> Simple elegant toast notifications.

A lightweight, unopinionated and performant toast notification component for modern web frontends in
[very](https://github.com/zerodevx/svelte-toast/blob/master/src/SvelteToast.svelte)
[little](https://github.com/zerodevx/svelte-toast/blob/master/src/ToastItem.svelte)
[lines](https://github.com/zerodevx/svelte-toast/blob/master/src/stores.js)
[of](https://github.com/zerodevx/svelte-toast/blob/master/src/index.js)
[code](https://github.com/zerodevx/svelte-toast/blob/master/src/index.d.ts). Compiled (into UMD),
it's only **19kb** minified (**8kb** gzipped) and can be used in Vanilla JS, or as a Svelte
component.

Because a demo helps better than a thousand API docs: https://zerodevx.github.io/svelte-toast/

**:warning: IMPORTANT NOTICE!**

If you're using the latest SvelteKit, install this component with the `@next` tag:

```
$ npm i --save-exact @zerodevx/svelte-toast@next
```

That's because of a [breaking change](https://github.com/sveltejs/kit/pull/7489) that landed in
SvelteKit. Background of the issue [here](https://github.com/zerodevx/svelte-toast/issues/60). Track
progress as we work towards `v1` [here](https://github.com/zerodevx/svelte-toast/pull/63).

## Usage

Install the package:

```bash
$ npm i -D @zerodevx/svelte-toast
```

The following are exported:

- `SvelteToast` as the toast container;
- `toast` as the toast emitter.

### Svelte

If you're using this in a Svelte app, import the toast container and place it in your app shell or
root layout.

`+layout.svelte`:

<!-- prettier-ignore -->
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
    toast.push('Hello world!')
  </script>
</head>
```

## Theming

In general, use CSS variables - the following (self-explanatory) vars are exposed:

```css
/**
 *         ._toastContainer
 *    ┌───────────────────────────────────────┐
 *    │    ._toastItem                        │
 *    │ ┌───────────────────────────────────┐ │
 *    │ │  ._toastMsg             ._toastBtn│ │
 *    │ │ ┌───────────────────────┐ ┌─────┐ │ │
 *    │ │ │                       │ │  ✕  │ │ │
 *    │ │ └───────────────────────┘ └─────┘ │ │
 *    │ │  ._toastBar                       │ │
 *    │ │ ═════════════════════════════════ │ │
 *    │ └───────────────────────────────────┘ │
 *    └───────────────────────────────────────┘
 */

._toastContainer {
  top: var(--toastContainerTop, 1.5rem);
  right: var(--toastContainerRight, 2rem);
  bottom: var(--toastContainerBottom, auto);
  left: var(--toastContainerLeft, auto);
  z-index: var(--toastContainerZIndex, 9999);
}

._toastItem {
  width: var(--toastWidth, 16rem);
  height: var(--toastHeight, auto);
  min-height: var(--toastMinHeight, 3.5rem);
  margin: var(--toastMargin, 0 0 0.5rem 0);
  padding: var(--toastPadding, 0);
  background: var(--toastBackground, rgba(66, 66, 66, 0.9));
  color: var(--toastColor, #fff);
  box-shadow: var(
    --toastBoxShadow,
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06)
  );
  border: var(--toastBorder, none);
  border-radius: var(--toastBorderRadius, 0.125rem);
}

._toastMsg {
  padding: var(--toastMsgPadding, 0.75rem 0.5rem);
}

._toastBtn {
  width: var(--toastBtnWidth, 2rem);
  height: var(--toastBtnHeight, 100%);
  font: var(--toastBtnFont, 1rem sans-serif);
}

._toastBtn::after {
  content: var(--toastBtnContent, '✕');
}

._toastBar {
  background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
  top: var(--toastBarTop, auto);
  right: var(--toastBarRight, auto);
  bottom: var(--toastBarBottom, 0);
  left: var(--toastBarLeft, 0);
  height: var(--toastBarHeight, 6px);
  width: var(--toastBarWidth, 100%);
}
```

So to apply your custom theme globally, do something like:

<!-- prettier-ignore -->
```html
<style>
  :root {
    --toastBackground: #abcdef;
    --toastColor: #123456;
    --toastHeight: 300px;
    ...
  }
</style>
```

To apply CSS overrides to a particular Toast Item (on a per-toast basis), emit the toast with
options:

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

For convenient composing, you can either push toasts with
[user-defined classes](#styling-with-user-defined-classes) (from `v0.7`), or create your own common
toast actions by stubbing them out. For example:

`my-theme.js`

```js
import { toast } from '@zerodevx/svelte-toast'

export const success = m => toast.push(m, {
  theme: {
    '--toastBackground': 'green',
    '--toastColor': 'white',
    '--toastBarBackground': 'olive'
  }
})

export const warning = m => toast.push(m, { theme: { ... } })

export const failure = m => toast.push(m, { theme: { ... } })
```

Then simply import these stubs in your consuming component:

```js
import { success, warning, failure } from './my-theme'

// Do something, then
success('It works!')
```

### Rich HTML

Toast messages can be in rich HTML too - for example:

```js
// Definitely not spam
toast.push(`<strong>You won the jackpot!</strong><br>
  Click <a href="#" target="_blank">here</a> for details! 😛`)
```

### Custom Fonts and Styles

In a Svelte app, the quickest way to apply custom styles is to wrap the toast container then apply
styles on the wrapper:

<!-- prettier-ignore -->
```html
<style>
  .wrap {
    display: contents;
    font-family: Roboto, sans-serif;
    font-size: 0.875rem;
    /* You can set CSS vars here too */
    --toastBackground: pink;
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

In Vanilla JS, simply apply your styles to the `._toastContainer` class:

<!-- prettier-ignore -->
```css
._toastContainer {
  font-family: Roboto, sans-serif;
  --toastBackground: yellow;
  ...
}
```

## Features

### New from `v0.4`

#### Supporting Multiple Toast Containers

It's now easy to send toasts to different container targets within your app. For example:

<!-- prettier-ignore -->
```html
<script>
  import { SvelteToast, toast } from '@zerodevx/svelte-toast'

  // Sends a toast to default toast container
  toast.push('Yo!')

  // Sends a toast to "new" toast container
  toast.push('Hey!', { target: 'new' })
</script>

<style>
  .wrap {
    --toastContainerTop: 0.5rem;
    --toastContainerRight: 2rem;
    --toastContainerBottom: auto;
    --toastContainerLeft: 2rem;
    --toastWidth: 100%;
    font-size: 0.875rem;
    ...
  }
</style>

<!-- Default toast container -->
<SvelteToast />

<!-- Another toast container -->
<div class="wrap">
  <!-- Declare container with a unique `target` name -->
  <SvelteToast target="new" options={{ duration: 8000, intro: { y: -64 } }} />
</div>
```

#### Removing Multiple Toasts

`pop()` now accepts a filter function.

```js
// Remove all toasts from "new" container
toast.pop((i) => i.target !== 'new')

// Or remove ALL active toasts from ALL containers
toast.pop(0)
```

#### Accepting Object as First Param

`push()` and `set()` can also take an object as its first parameter.

```js
let id = toast.push('Yo!', { duration: 2000 })
// ...is semantically equivalent to
id = toast.push({ msg: 'Yo!', duration: 2000 })

toast.set(id, { msg: 'Waddup!' })
// ...is semantically equivalent to
toast.set({ id, msg: 'Waddup!' })
```

### New from `v0.5`

#### Pausable Toasts

Progress bar tweens can now be paused when the mouse cursor (on desktop) is hovered over the toast
item. This behaviour is **disabled** by default. To enable, set option `pausable: true`.

```js
toast.push('Hover me!', { pausable: true })
```

#### Send Svelte Component as a Message

To support complex UIs or workflows, a Svelte component can be pushed instead of a standard message
if you're using this in a Svelte project. To do so, push options with `component` defined:

```js
import MyCustomSvelteComponent from './MyCustomSvelteComponent.svelte'

toast.push({
  component: {
    src: MyCustomSvelteComponent, // set `src` to the component itself (required)
    props: { ... },               // pass in `props` as key/value pairs (optional)
    sendIdTo: 'toastId'           // forward toast id to `toastId` prop (optional)
  },
  ...                             // any other toast options
})
```

### New from `v0.6`

#### `onpop()` Callback Function

A callback function can be run when a toast is closed. To do so, pass the function to the `onpop`
toast option:

```js
toast.push('Hello world', {
  onpop: (id) => {                // optionally get the toast id if needed
    console.log(`${id} removed`)
  },
  ...                             // any other toast options
})
```

### New from `v0.7`

#### Styling with User-Defined Classes

Custom class names can now be passed into each toast item. Very useful for composing toast actions,
or implementing CSS-only dark modes.

```html
<script>
  toast.push('Foo', { classes: ['info'] }) // background green
  toast.push('Bar', { classes: ['warn'] }) // background red
</script>
<SvelteToast options={{ classes: ['log'] }} />
<style>
  :global(.log.info) {
    --toastBackground: green;
  }
  :global(.log.warn) {
    --toastBackground: red;
  }
</style>
```

### New from `v0.8`

#### Auto-pause Toasts when Page Hidden

This feature uses the
[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) (if it's
supported) to pause/resume a toast whenever the browser tab visibility changes - allowing one to
emit notifications in the background without it being dismissed prematurely. This now happens
automatically and is default behaviour, since notifications should by nature ensure that they're
seen.

#### Customise Dismiss Button

Additional CSS vars are exposed - specifically, `--toastBtnContent` allows the '✕' default character
to be changed. As with CSS `content` keys for pseudo elements, `url()` can be used to load external
or inline icons.

```html
<script>
  import { toast, SvelteToast } from '@zerodevx/svelte-toast'

  const options = {
    theme: {
      '--toastBtnContent': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' ...")`
    }
  }
</script>

<button on:click={() => toast.push('Ping!')}>PONG</button>

<SvelteToast {options} />
```

## Toast Options

<!-- prettier-ignore -->
```js
// Default options
const options = {
  duration: 4000,       // duration of progress bar tween to the `next` value
  initial: 1,           // initial progress bar value
  next: 0,              // next progress value
  pausable: false,      // pause progress bar tween on mouse hover
  dismissable: true,    // allow dismiss with close button
  reversed: false,      // insert new toast to bottom of stack
  intro: { x: 256 },    // toast intro fly animation settings
  theme: {},            // css var overrides
  classes: []           // user-defined classes
}
```

## Toast Methods

```js
const id = toast.push(msg, { ...options })
toast.pop(id || fn || undefined)
toast.set(id, { ...options })
```

## Development

Standard Github
[contribution workflow](https://docs.github.com/en/get-started/quickstart/contributing-to-projects)
applies.

### Tests

Testing is through [Cypress](https://www.cypress.io/). To run the tests headlessly:

```
$ npm run test
```

## Changelog

Please refer to the [releases](https://github.com/zerodevx/svelte-toast/releases) page.

## License

ISC
