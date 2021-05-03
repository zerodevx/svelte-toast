// index.d.ts
declare module "@zerodevx/svelte-toast";

import type { SvelteComponent } from "svelte";

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
 ```
 */
export interface SvelteToastOptions {
  duration: number;
  dismissable: boolean;
  initial: number;
  progress: number;
  reversed: boolean;
  intro: any;
  theme: { [key: string]: string }
}

export class SvelteToast extends SvelteComponent {
  options: SvelteToastOptions;
}

declare namespace toast {
  export function push(text: string, options?: SvelteToastOptions): number;
  export function pop(id: number): void;
  export function set(id: number, options: SvelteToastOptions): void;
}
