<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WebGLRenderer } from '../../lib/renderer/WebGLRenderer';
  import { P5Renderer } from '../../lib/renderer/P5Renderer';
  import type { RendererInterface } from '../../lib/renderer/RendererInterface';
  import type { ShaderProgram } from '../../types/shader';
  import type { RenderMode } from '../../stores/renderModeStore';
  import { audioData } from '../../stores/audioStore';
  import { createEventDispatcher } from 'svelte';
  
  export let shaderProgram: ShaderProgram;
  export let renderMode: RenderMode = 'glsl';
  export let isPlaying = true;
  
  const dispatch = createEventDispatcher();
  
  let canvas: HTMLCanvasElement;
  let renderer: RendererInterface | null = null;
  let error: string | null = null;
  let lastTime = performance.now();
  let frameCount = 0;
  let mouseX = 0;
  let mouseY = 0;
  
  // エクスポート機能用のメソッド
  export function getCanvas(): HTMLCanvasElement | null {
    return canvas;
  }
  
  export function renderFrame(): void {
    if (renderer) {
      renderer.renderFrame();
    }
  }
  
  // 音楽データの更新を監視
  $: if (renderer && $audioData) {
    renderer.setAudioData($audioData);
    // 音楽データが読み込まれたらイベントを発火
    if ($audioData.audioBuffer && $audioData.audioContext) {
      dispatch('audioLoaded', {
        buffer: $audioData.audioBuffer,
        context: $audioData.audioContext
      });
    }
  }
  
  // FPS計測
  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    
    if (elapsed >= 1000) {
      const fps = (frameCount * 1000) / elapsed;
      dispatch('fpsUpdate', fps);
      frameCount = 0;
      lastTime = currentTime;
    }
  }
  
  // レンダラーモードが変更されたときの処理
  $: if (renderMode) {
    createRenderer();
  }
  
  $: if (renderer && shaderProgram) {
    compileAndRender();
  }
  
  $: if (renderer) {
    if (isPlaying) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }
  
  function createRenderer() {
    if (renderer) {
      renderer.destroy();
      renderer = null;
    }
    
    if (!canvas) return;
    
    if (renderMode === 'glsl') {
      renderer = new WebGLRenderer(canvas);
    } else {
      renderer = new P5Renderer(canvas);
    }
    
    if (renderer.setOnFrameCallback) {
      renderer.setOnFrameCallback(measureFPS);
    }
    
    handleResize();
    
    if (shaderProgram) {
      compileAndRender();
    }
  }
  
  function compileAndRender() {
    if (!renderer) return;
    
    try {
      let result;
      
      if (renderMode === 'glsl') {
        result = renderer.compile(
          shaderProgram.vertexShader,
          shaderProgram.fragmentShader
        );
      } else {
        // P5.jsモードの場合はfragmentShaderにP5.jsコードが入っている
        result = renderer.compile(shaderProgram.fragmentShader);
      }
      
      if (result.success) {
        error = null;
        if (isPlaying) {
          renderer.start();
        }
      } else {
        error = result.errors?.join('\n') || 'Unknown error';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }
  }
  
  function handleResize() {
    if (!renderer || !canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      renderer.resize(rect.width, rect.height);
    }
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = canvas.height - (event.clientY - rect.top); // Y座標を反転（OpenGL座標系）
    
    // レンダラーにマウス座標を送信
    if (renderer && 'setMousePosition' in renderer) {
      (renderer as any).setMousePosition(mouseX, mouseY);
    }
  }
  
  onMount(() => {
    createRenderer();
    window.addEventListener('resize', handleResize);
  });
  
  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    renderer?.destroy();
  });
</script>

<div class="preview-container">
  <canvas bind:this={canvas} on:mousemove={handleMouseMove}></canvas>
  
  {#if error}
    <div class="error-overlay">
      <h3>{renderMode === 'glsl' ? 'Shader Compilation Error' : 'P5.js Error'}</h3>
      <pre>{error}</pre>
    </div>
  {/if}
</div>

<style>
  .preview-container {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #000;
  }
  
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    color: #ff4444;
    padding: 2rem;
    overflow: auto;
  }
  
  .error-overlay h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }
  
  .error-overlay pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
  }
</style>