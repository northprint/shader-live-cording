// Tauri APIの型定義
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export {};