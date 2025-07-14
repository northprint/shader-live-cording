<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  
  export let code: string = '';
  export let isVisible: boolean = false;
  export let fontSize: number = 16;
  
  const dispatch = createEventDispatcher();
  
  let textareaElement: HTMLTextAreaElement;
  let containerElement: HTMLDivElement;
  
  function handleInput() {
    dispatch('codeChange', { code: textareaElement.value });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    // ESCキーで閉じる
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dispatch('close');
      return;
    }
    
    // Ctrl+Enterで適用
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      dispatch('apply', { code: textareaElement.value });
      // フラッシュ効果
      if (containerElement) {
        containerElement.style.animation = 'none';
        setTimeout(() => {
          containerElement.style.animation = 'flash 0.3s ease';
        }, 10);
      }
      return;
    }
  }
  
  function handleContainerClick(event: MouseEvent) {
    if (event.target === containerElement) {
      dispatch('close');
    }
  }
  
  // VJモード用の特別なESCキー処理
  function handleGlobalEscape(event: KeyboardEvent) {
    if (isVisible && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dispatch('close');
    }
  }
  
  $: if (isVisible && textareaElement) {
    setTimeout(() => {
      textareaElement?.focus();
    }, 100);
  }
  
  onMount(() => {
    // グローバルESCキーリスナー
    window.addEventListener('keydown', handleGlobalEscape, true);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalEscape, true);
    };
  });
</script>

{#if isVisible}
  <div 
    class="live-code-editor-container" 
    bind:this={containerElement}
    on:click={handleContainerClick}
    transition:fade={{ duration: 300 }}
  >
    <div class="editor-wrapper" transition:fly={{ y: 50, duration: 400, easing: cubicOut }}>
      <div class="editor-header">
        <span class="title">Live Coding Mode</span>
        <div class="header-controls">
          <button 
            class="control-button"
            on:click={() => fontSize = Math.max(12, fontSize - 2)}
            title="Decrease font size"
          >
            A-
          </button>
          <button 
            class="control-button"
            on:click={() => fontSize = Math.min(24, fontSize + 2)}
            title="Increase font size"
          >
            A+
          </button>
          <button 
            class="control-button close"
            on:click={() => dispatch('close')}
            title="Close (Esc)"
          >
            ✕
          </button>
          <span class="hint">Ctrl+Enter to apply • Esc to close</span>
        </div>
      </div>
      
      <textarea
        bind:this={textareaElement}
        bind:value={code}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        class="code-editor"
        style="font-size: {fontSize}px"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
    </div>
  </div>
{/if}

<style>
  .live-code-editor-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* より透明な背景 */
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    /* 軽いブラー効果 */
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  
  @keyframes flash {
    0%, 100% { background-color: rgba(0, 0, 0, 0.3); }
    50% { background-color: rgba(74, 158, 255, 0.2); }
  }
  
  .editor-wrapper {
    width: 80%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    /* 半透明の背景 */
    background-color: rgba(10, 10, 15, 0.5);
    /* 薄い枠線 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    /* ソフトな影 */
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    /* 半透明のヘッダー */
    background-color: rgba(20, 20, 25, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #4a9eff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    /* 光る効果 */
    text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
  }
  
  .header-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .control-button {
    padding: 0.4rem 0.8rem;
    background-color: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background-color: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .control-button.close {
    background-color: rgba(255, 59, 48, 0.15);
    border-color: rgba(255, 59, 48, 0.25);
    color: #ff6b60;
    padding: 0.4rem 0.6rem;
  }
  
  .control-button.close:hover {
    background-color: rgba(255, 59, 48, 0.2);
    border-color: rgba(255, 59, 48, 0.3);
  }
  
  .hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
    margin-left: 1rem;
  }
  
  .code-editor {
    flex: 1;
    width: 100%;
    padding: 1.5rem;
    /* 非常に透明な背景 */
    background-color: rgba(0, 0, 0, 0.2);
    /* 明るいテキスト色 */
    color: #ffffff;
    border: none;
    outline: none;
    resize: none;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
    line-height: 1.6;
    tab-size: 2;
    /* テキストに影を付けて読みやすくする */
    text-shadow: 
      0 0 3px rgba(0, 0, 0, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.9);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .code-editor::selection {
    background-color: rgba(74, 158, 255, 0.4);
    color: #ffffff;
  }
  
  .code-editor::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .code-editor::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .code-editor::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 5px;
  }
  
  .code-editor::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 5px;
  }
  
  .code-editor::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  /* フォント読み込み最適化 */
  @supports (font-variation-settings: normal) {
    .code-editor {
      font-family: 'Fira Code VF', 'SF Mono', 'Monaco', monospace;
    }
  }
</style>