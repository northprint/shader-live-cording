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
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  @keyframes flash {
    0%, 100% { background-color: rgba(0, 0, 0, 0.7); }
    50% { background-color: rgba(74, 158, 255, 0.2); }
  }
  
  .editor-wrapper {
    width: 80%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    background-color: rgba(20, 20, 25, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 
      0 25px 70px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: rgba(30, 30, 35, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #4a9eff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .header-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .control-button {
    padding: 0.4rem 0.8rem;
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transform: translateY(-1px);
  }
  
  .control-button.close {
    background-color: rgba(255, 59, 48, 0.2);
    border-color: rgba(255, 59, 48, 0.3);
    color: #ff3b30;
    padding: 0.4rem 0.6rem;
  }
  
  .control-button.close:hover {
    background-color: rgba(255, 59, 48, 0.3);
    border-color: rgba(255, 59, 48, 0.4);
  }
  
  .hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    margin-left: 1rem;
  }
  
  .code-editor {
    flex: 1;
    width: 100%;
    padding: 1.5rem;
    background-color: rgba(10, 10, 15, 0.5);
    color: #e6e6e6;
    border: none;
    outline: none;
    resize: none;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
    line-height: 1.6;
    tab-size: 2;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .code-editor::selection {
    background-color: rgba(74, 158, 255, 0.3);
    color: #ffffff;
  }
  
  .code-editor::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .code-editor::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
  }
  
  .code-editor::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
  
  .code-editor::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  /* フォント読み込み最適化 */
  @supports (font-variation-settings: normal) {
    .code-editor {
      font-family: 'Fira Code VF', 'SF Mono', 'Monaco', monospace;
    }
  }
</style>