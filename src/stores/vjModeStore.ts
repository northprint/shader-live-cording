import { writable } from 'svelte/store';

export const isVJMode = writable(false);
export const isFullscreen = writable(false);