<script lang="ts">
  import { onMount } from 'svelte';
  
  export let direction: 'horizontal' | 'vertical' = 'horizontal';
  export let minSize = 200;
  export let defaultSize = '50%';
  
  let container: HTMLElement;
  let pane1: HTMLElement;
  let pane2: HTMLElement;
  let divider: HTMLElement;
  let isDragging = false;
  let startPos = 0;
  let startSize = 0;
  
  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const rect = pane1.getBoundingClientRect();
    startSize = direction === 'horizontal' ? rect.width : rect.height;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // ドラッグ中のテキスト選択を防ぐ
    e.preventDefault();
  }
  
  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const diff = currentPos - startPos;
    const newSize = startSize + diff;
    
    const containerRect = container.getBoundingClientRect();
    const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;
    
    // 最小サイズとコンテナサイズの制限
    const clampedSize = Math.max(minSize, Math.min(newSize, containerSize - minSize));
    
    if (direction === 'horizontal') {
      pane1.style.width = `${clampedSize}px`;
      pane2.style.width = `calc(100% - ${clampedSize}px - 4px)`;
    } else {
      pane1.style.height = `${clampedSize}px`;
      pane2.style.height = `calc(100% - ${clampedSize}px - 4px)`;
    }
  }
  
  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  onMount(() => {
    // 初期サイズの設定
    if (direction === 'horizontal') {
      pane1.style.width = defaultSize;
      pane2.style.width = `calc(100% - ${defaultSize} - 4px)`;
    } else {
      pane1.style.height = defaultSize;
      pane2.style.height = `calc(100% - ${defaultSize} - 4px)`;
    }
  });
</script>

<div 
  class="resizable-container {direction}" 
  bind:this={container}
  class:dragging={isDragging}
>
  <div class="pane pane1" bind:this={pane1}>
    <slot name="pane1"></slot>
  </div>
  
  <div 
    class="divider" 
    bind:this={divider}
    on:mousedown={handleMouseDown}
  >
    <div class="divider-handle"></div>
  </div>
  
  <div class="pane pane2" bind:this={pane2}>
    <slot name="pane2"></slot>
  </div>
</div>

<style>
  .resizable-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .resizable-container.horizontal {
    flex-direction: row;
  }
  
  .resizable-container.vertical {
    flex-direction: column;
  }
  
  .pane {
    overflow: hidden;
  }
  
  .divider {
    background-color: #2a2a2a;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }
  
  .horizontal .divider {
    width: 4px;
    cursor: col-resize;
  }
  
  .vertical .divider {
    height: 4px;
    cursor: row-resize;
  }
  
  .divider-handle {
    position: absolute;
    background-color: #3a3a3a;
    transition: background-color 0.2s;
  }
  
  .horizontal .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 30px;
    border-radius: 2px;
  }
  
  .vertical .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 4px;
    border-radius: 2px;
  }
  
  .divider:hover .divider-handle {
    background-color: #4a4a4a;
  }
  
  .dragging {
    user-select: none;
  }
  
  .dragging .divider .divider-handle {
    background-color: #5a5a5a;
  }
</style>