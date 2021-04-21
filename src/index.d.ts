// index.d.ts
declare module "@zerodevx/svelte-toast";

import type { SvelteComponent } from "svelte";

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
  export function _opts(options: SvelteToastOptions): SvelteToastOptions;
}
