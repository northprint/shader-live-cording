<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { highlightGLSL } from '../../lib/utils/glslHighlight';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  
  export let code: string = '';
  export let isVisible: boolean = false;
  export let fontSize: number = 16;
  
  const dispatch = createEventDispatcher();
  
  let textareaElement: HTMLTextAreaElement;
  let highlightElement: HTMLDivElement;
  let containerElement: HTMLDivElement;
  let isActive = false;
  let highlightedCode = '';
  
  function updateHighlight() {
    highlightedCode = highlightGLSL(code);
  }
  
  function syncScroll() {
    if (highlightElement && textareaElement) {
      highlightElement.scrollTop = textareaElement.scrollTop;
      highlightElement.scrollLeft = textareaElement.scrollLeft;
    }
  }
  
  function handleInput() {
    code = textareaElement.value;
    updateHighlight();
    dispatch('codeChange', { code });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    // ESCキーで確実に閉じる
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dispatch('close');
      return;
    }
    
    // Ctrl+Enterで適用
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      dispatch('apply', { code });
      // フラッシュ効果
      containerElement.classList.add('flash');
      setTimeout(() => {
        containerElement?.classList.remove('flash');
      }, 200);
      return;
    }
    
    // 他のキーボードショートカットの伝播を止める
    event.stopPropagation();
  }
  
  function handleContainerClick(event: MouseEvent) {
    // 背景クリックで閉じる
    if (event.target === containerElement) {
      dispatch('close');
    }
  }
  
  $: if (code) {
    updateHighlight();
  }
  
  $: if (isVisible && textareaElement) {
    setTimeout(() => {
      textareaElement?.focus();
      updateHighlight();
    }, 100);
  }
  
  onMount(() => {
    // グローバルキーボードイベントをキャプチャ
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (isActive && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dispatch('close');
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  });
</script>

{#if isVisible}
  <div 
    class="live-code-editor-container" 
    bind:this={containerElement}
    on:click={handleContainerClick}
    on:keydown={handleKeyDown}
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
          <span class="hint">Ctrl+Enter to apply • Esc to close</span>
        </div>
      </div>
      
      <div class="editor-content">
        <!-- シンタックスハイライト層 -->
        <div 
          class="highlight-layer"
          bind:this={highlightElement}
          style="font-size: {fontSize}px"
        >
          <pre><code>{@html highlightedCode}</code></pre>
        </div>
        
        <!-- 透明なテキストエリア -->
        <textarea
          bind:this={textareaElement}
          bind:value={code}
          on:input={handleInput}
          on:keydown={handleKeyDown}
          on:scroll={syncScroll}
          on:focus={() => isActive = true}
          on:blur={() => isActive = false}
          class="code-editor"
          style="font-size: {fontSize}px"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        />
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
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(20px);
  }
  
  .live-code-editor-container.flash {
    animation: flash 0.2s ease;
  }
  
  @keyframes flash {
    0% { background-color: rgba(0, 0, 0, 0.6); }
    50% { background-color: rgba(74, 158, 255, 0.3); }
    100% { background-color: rgba(0, 0, 0, 0.6); }
  }
  
  .editor-wrapper {
    width: 80%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    /* 完全に透明な背景 */
    background-color: transparent;
    /* 微妙な枠線 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    /* 影で存在感を出す */
    box-shadow: 
      0 0 100px rgba(0, 0, 0, 0.4),
      inset 0 0 50px rgba(255, 255, 255, 0.05);
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    /* 半透明のヘッダー */
    background-color: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }
  
  .title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #4a9eff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-shadow: 0 0 20px rgba(74, 158, 255, 0.5);
  }
  
  .header-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .control-button {
    padding: 0.35rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.1);
    color: #4a9eff;
    border: 1px solid rgba(74, 158, 255, 0.3);
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(5px);
  }
  
  .control-button:hover {
    background-color: rgba(74, 158, 255, 0.2);
    border-color: rgba(74, 158, 255, 0.5);
    transform: translateY(-1px);
  }
  
  .hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin-left: 1rem;
  }
  
  .editor-content {
    position: relative;
    flex: 1;
    /* 完全に透明な背景 */
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
    overflow: hidden;
  }
  
  .highlight-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1.5rem;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
    overflow: auto;
    white-space: pre;
    tab-size: 2;
    pointer-events: none;
  }
  
  .highlight-layer pre {
    margin: 0;
  }
  
  .highlight-layer code {
    font-family: inherit;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  }
  
  .code-editor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    background-color: transparent;
    color: transparent;
    caret-color: #ffffff;
    border: none;
    outline: none;
    resize: none;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
    overflow: auto;
    white-space: pre;
    tab-size: 2;
  }
  
  /* スクロールバー */
  .code-editor::-webkit-scrollbar,
  .highlight-layer::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .code-editor::-webkit-scrollbar-track,
  .highlight-layer::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  .code-editor::-webkit-scrollbar-thumb,
  .highlight-layer::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  
  .code-editor::-webkit-scrollbar-thumb:hover,
  .highlight-layer::-webkit-scrollbar-thumb:hover {
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