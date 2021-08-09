// index.d.ts
import type { SvelteComponent } from 'svelte'
import type { FlyParams } from 'svelte/types/runtime/transition/index'

declare module '@zerodevx/svelte-toast'

/**
 * Default Toast Options
 * ```typescript
 * {
 *  duration: 4000,       // duration of progress bar tween
 *  dismissable: true,    // allow dismiss with close button
 *  initial: 1,           // initial progress bar value
 *  progress: 0,          // current progress
 *  reversed: false,      // insert new toast to bottom of stack
 *  intro: { x: 256 },    // toast intro fly animation settings
 *  theme: {}             // css var overrides
 * }
 * ```
 */
export interface SvelteToastOptions {
  id?: number
  target?: string
  msg?: string
  duration?: number
  dismissable?: boolean
  initial?: number
  progress?: number
  reversed?: boolean
  intro?: FlyParams
  theme?: { [key: string]: string }
  component?: {
    src: object
    props?: { [key: string]: any }
  }
}

export class SvelteToast extends SvelteComponent {
  options: SvelteToastOptions
  target: string
}

declare namespace toast {
  export function push (msg: string, options?: SvelteToastOptions): number
  export function push (options: SvelteToastOptions): number
  export function pop (arg?: any): void
  export function set (id: number, options?: SvelteToastOptions): void
  export function set (options: SvelteToastOptions): void
}
