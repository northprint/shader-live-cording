<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { highlightGLSL } from '../../lib/utils/glslHighlight';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  
  export let code: string = '';
  export let isVisible: boolean = false;
  export let fontSize: number = 16;
  
  const dispatch = createEventDispatcher();
  
  let textareaElement: HTMLTextAreaElement;
  let containerElement: HTMLDivElement;
  let showHighlight = true;
  let highlightedCode = '';
  
  function updateHighlight() {
    if (showHighlight) {
      highlightedCode = highlightGLSL(code);
    }
  }
  
  function handleInput() {
    code = textareaElement.value;
    updateHighlight();
    dispatch('codeChange', { code });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dispatch('close');
      return;
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      dispatch('apply', { code });
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
  
  function handleGlobalEscape(event: KeyboardEvent) {
    if (isVisible && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dispatch('close');
    }
  }
  
  function toggleHighlight() {
    showHighlight = !showHighlight;
    if (showHighlight) {
      updateHighlight();
    }
  }
  
  $: if (isVisible && textareaElement) {
    setTimeout(() => {
      textareaElement?.focus();
      updateHighlight();
    }, 100);
  }
  
  onMount(() => {
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
            class="control-button {showHighlight ? 'active' : ''}"
            on:click={toggleHighlight}
            title="Toggle syntax highlighting"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 17l6-6-6-6M12 19h8"/>
            </svg>
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
      
      <div class="editor-content">
        {#if showHighlight}
          <!-- シンタックスハイライト表示モード -->
          <div 
            class="highlighted-code"
            style="font-size: {fontSize}px"
          >
            <pre><code>{@html highlightedCode}</code></pre>
          </div>
          <!-- 編集時のみtextareaを表示 -->
          <textarea
            bind:this={textareaElement}
            bind:value={code}
            on:input={handleInput}
            on:keydown={handleKeyDown}
            class="code-editor-overlay"
            style="font-size: {fontSize}px"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          />
        {:else}
          <!-- シンプルなtextareaモード -->
          <textarea
            bind:this={textareaElement}
            bind:value={code}
            on:input={handleInput}
            on:keydown={handleKeyDown}
            class="code-editor-simple"
            style="font-size: {fontSize}px"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          />
        {/if}
      </div>
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
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  
  @keyframes flash {
    0%, 100% { background-color: rgba(0, 0, 0, 0.8); }
    50% { background-color: rgba(74, 158, 255, 0.3); }
  }
  
  .editor-wrapper {
    width: 80%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    background-color: rgba(15, 15, 20, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 
      0 25px 70px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: rgba(25, 25, 30, 0.9);
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
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .control-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transform: translateY(-1px);
  }
  
  .control-button.active {
    background-color: rgba(74, 158, 255, 0.2);
    border-color: rgba(74, 158, 255, 0.4);
    color: #4a9eff;
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
  
  .editor-content {
    position: relative;
    flex: 1;
    overflow: hidden;
  }
  
  /* シンタックスハイライト表示 */
  .highlighted-code {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1.5rem;
    overflow: auto;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
    line-height: 1.6;
    tab-size: 2;
    background-color: rgba(10, 10, 15, 0.3);
  }
  
  .highlighted-code pre {
    margin: 0;
  }
  
  .highlighted-code code {
    font-family: inherit;
  }
  
  /* オーバーレイモードのtextarea */
  .code-editor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.9);
    caret-color: #4a9eff;
    border: none;
    outline: none;
    resize: none;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
    line-height: 1.6;
    tab-size: 2;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .code-editor-overlay:focus {
    opacity: 1;
    background-color: rgba(10, 10, 15, 0.95);
  }
  
  /* シンプルモードのtextarea */
  .code-editor-simple {
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    background-color: rgba(10, 10, 15, 0.3);
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
  
  /* 選択範囲のスタイル */
  .code-editor-overlay::selection,
  .code-editor-simple::selection {
    background-color: rgba(74, 158, 255, 0.3);
    color: #ffffff;
  }
  
  /* スクロールバー */
  .highlighted-code::-webkit-scrollbar,
  .code-editor-overlay::-webkit-scrollbar,
  .code-editor-simple::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .highlighted-code::-webkit-scrollbar-track,
  .code-editor-overlay::-webkit-scrollbar-track,
  .code-editor-simple::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
  }
  
  .highlighted-code::-webkit-scrollbar-thumb,
  .code-editor-overlay::-webkit-scrollbar-thumb,
  .code-editor-simple::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
  
  .highlighted-code::-webkit-scrollbar-thumb:hover,
  .code-editor-overlay::-webkit-scrollbar-thumb:hover,
  .code-editor-simple::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  /* シンタックスハイライトのスタイル */
  :global(.glsl-keyword) {
    color: #ff79c6;
    font-weight: 600;
  }
  
  :global(.glsl-type) {
    color: #8be9fd;
  }
  
  :global(.glsl-builtin) {
    color: #50fa7b;
  }
  
  :global(.glsl-function) {
    color: #f1fa8c;
  }
  
  :global(.glsl-number) {
    color: #bd93f9;
  }
  
  :global(.glsl-string) {
    color: #f1fa8c;
  }
  
  :global(.glsl-comment) {
    color: #6272a4;
    font-style: italic;
  }
  
  :global(.glsl-operator) {
    color: #ff79c6;
  }
</style>