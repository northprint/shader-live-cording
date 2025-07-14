import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import monacoEditorPluginImport from 'vite-plugin-monaco-editor';

// CommonJSモジュールのインポートを処理
const monacoEditorPlugin = (monacoEditorPluginImport as any).default || monacoEditorPluginImport;

export default defineConfig({
  plugins: [
    svelte(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'css', 'html', 'typescript']
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      // Monaco Editorのワーカーを許可するためにCOEPを緩和
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    fs: {
      allow: ['..']
    }
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor']
        }
      }
    }
  }
});