/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
  __TAURI__?: {
    invoke: (cmd: string, args?: any) => Promise<any>;
    tauri: any;
    // その他のTauri APIプロパティ
  };
}