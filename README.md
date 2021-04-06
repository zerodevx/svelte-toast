# svelte-toast

> Simple elegant toast notifications.

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
  <script>
    function registerToast() {
      window.toastApp = new SvelteToastUMD.SvelteToast({
        target: document.body
      });
      window.toast = SvelteToastUMD.toast;

      // Now you can `toast` anywhere!
      toast.push('Hello world!');
    }
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/@zerodevx/svelte-toast@0" onload="registerToast()"></script>
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
  height: var(--toastHeight, 3.5rem);
  margin: var(--toastMargin, 0 0 0.5rem 0);
  background: var(--toastBackground, rgba(66,66,66,0.9));
  color: var(--toastColor, #FFF);
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

### Rich HTML

Toast messages can be in rich HTML too - for example:

```js
// Definitely not spam
toast.push('<strong>You won the jackpot!</strong><br>Click <a href="#" target="_blank">here</a> for details! 😛')
```

### Custom Fonts

Apply custom font CSS on toast messages by setting styles globally on the `._toastMsg` class:

```html
<style>
/* In Svelte app, use the `:global` modifier */
:global(._toastMsg) {
  font-family: Roboto, sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  line-height: 1.125;
}
:global(._toastMsg>strong) {
  font-weight: 600;
}

/* For any others, just apply globally */
._toastMsg {
  ...
}
</style>
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
