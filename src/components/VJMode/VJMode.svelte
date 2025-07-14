<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Preview from '../Preview/Preview.svelte';
  import LiveCodeEditor from './LiveCodeEditorTranslucent.svelte';
  import type { ShaderProgram } from '../../types/shader';
  import { isVJMode, isFullscreen } from '../../stores/vjModeStore';
  
  export let shaderProgram: ShaderProgram;
  export let isPlaying = true;
  
  let vjContainer: HTMLElement;
  let showLiveCodeEditor = false;
  let liveCode = '';
  
  function enterFullscreen() {
    if (!vjContainer) return;
    
    if (vjContainer.requestFullscreen) {
      vjContainer.requestFullscreen();
    } else if ((vjContainer as any).webkitRequestFullscreen) {
      (vjContainer as any).webkitRequestFullscreen();
    }
    $isFullscreen = true;
  }
  
  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
    $isFullscreen = false;
  }
  
  function handleFullscreenChange() {
    $isFullscreen = !!document.fullscreenElement;
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    // ライブコーディングエディタが表示されている場合は、Escapeキーの処理をスキップ
    if (showLiveCodeEditor) return;
    
    if (e.key === 'Escape') {
      exitVJMode();
    } else if (e.ctrlKey && e.key === 'e') {
      // Ctrl+Eでライブコーディングモードを切り替え
      e.preventDefault();
      toggleLiveCodeEditor();
    }
  }
  
  function toggleLiveCodeEditor() {
    if (!showLiveCodeEditor) {
      // 現在のシェーダーコードをエディタに設定
      liveCode = shaderProgram.fragmentShader;
    }
    showLiveCodeEditor = !showLiveCodeEditor;
  }
  
  function handleLiveCodeChange(event: CustomEvent<{ code: string }>) {
    liveCode = event.detail.code;
  }
  
  function handleLiveCodeApply(event: CustomEvent<{ code: string }>) {
    // シェーダーコードを更新
    shaderProgram.fragmentShader = event.detail.code;
    shaderProgram.lastModified = new Date();
  }
  
  function handleLiveCodeClose() {
    showLiveCodeEditor = false;
  }
  
  function exitVJMode() {
    $isVJMode = false;
    if ($isFullscreen) {
      exitFullscreen();
    }
  }
  
  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    
    // 少し遅延してからフルスクリーンに入る（DOM要素が確実にレンダリングされるまで待つ）
    setTimeout(() => {
      if (!$isFullscreen && vjContainer) {
        enterFullscreen();
      }
    }, 100);
  });
  
  onDestroy(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.removeEventListener('keydown', handleKeyDown);
    
    if ($isFullscreen) {
      exitFullscreen();
    }
  });
</script>

{#if $isVJMode}
  <div class="vj-mode-container" bind:this={vjContainer}>
    <div class="vj-preview">
      <Preview {shaderProgram} {isPlaying} />
    </div>
    
    <div class="vj-info">
      <div class="vj-status">
        <span class="status-item">VJ Mode</span>
        {#if isPlaying}
          <span class="status-item playing">● Playing</span>
        {:else}
          <span class="status-item paused">● Paused</span>
        {/if}
      </div>
      
      <div class="vj-help">
        Press ESC to exit • Ctrl+E for live coding
      </div>
    </div>
    
    <LiveCodeEditor
      bind:code={liveCode}
      isVisible={showLiveCodeEditor}
      on:codeChange={handleLiveCodeChange}
      on:apply={handleLiveCodeApply}
      on:close={handleLiveCodeClose}
    />
  </div>
{/if}

<style>
  .vj-mode-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    z-index: 10000;
  }
  
  .vj-preview {
    width: 100%;
    height: 100%;
  }
  
  .vj-info {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .vj-mode-container:hover .vj-info {
    opacity: 1;
  }
  
  .vj-status {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .status-item {
    font-size: 0.9rem;
    padding: 0.25rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .status-item.playing {
    color: #4ade80;
  }
  
  .status-item.paused {
    color: #f59e0b;
  }
  
  .vj-help {
    font-size: 0.85rem;
    color: #999;
  }
</style>