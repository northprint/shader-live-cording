<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AudioAnalyzer } from '../../lib/audio/AudioAnalyzer';
  import { audioData, isAudioLoaded, audioFileName } from '../../stores/audioStore';
  
  export let isPlaying = true;
  
  let fileInput: HTMLInputElement;
  let analyzer: AudioAnalyzer | null = null;
  let animationFrame: number | null = null;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  
  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    loadAudioFile(file);
  }
  
  async function loadAudioFile(file: File) {
    if (!analyzer) {
      analyzer = new AudioAnalyzer();
    }
    
    try {
      await analyzer.loadAudioFile(file);
      $audioFileName = file.name;
      $isAudioLoaded = true;
      
      // オーディオデータをストアに保存
      if (analyzer.audioBuffer) {
        $audioData = {
          ...($audioData || {}),
          audioBuffer: analyzer.audioBuffer,
          audioContext: analyzer.audioContextInstance
        };
      }
      
      // 自動再生はしない（playボタンでユーザーがコントロール）
      console.log('Audio file loaded successfully:', file.name);
    } catch (error) {
      console.error('Failed to load audio file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`オーディオファイルの読み込みに失敗しました: ${errorMessage}`);
      $isAudioLoaded = false;
    }
  }
  
  function startAnalysis() {
    if (!analyzer || animationFrame !== null) return;
    
    const analyze = () => {
      if (analyzer) {
        const data = analyzer.getAnalysisData();
        $audioData = data;
        drawVisualization(data);
      }
      animationFrame = requestAnimationFrame(analyze);
    };
    
    analyze();
  }
  
  function stopAnalysis() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }
  
  function drawVisualization(data: typeof $audioData) {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 背景をクリア
    ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // 波形を描画
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const sliceWidth = width / data.waveform.length;
    let x = 0;
    
    for (let i = 0; i < data.waveform.length; i++) {
      const y = (data.waveform[i] + 1) * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // ビート表示
    if (data.beat) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.5)';
      ctx.fillRect(0, 0, width, height);
    }
    
    // 情報表示
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`BPM: ${data.bpm}`, 10, 20);
    ctx.fillText(`Volume: ${(data.volume * 100).toFixed(0)}%`, 10, 35);
    ctx.fillText(`Bass: ${(data.bass * 100).toFixed(0)}%`, 10, 50);
    ctx.fillText(`Mid: ${(data.mid * 100).toFixed(0)}%`, 10, 65);
    ctx.fillText(`Treble: ${(data.treble * 100).toFixed(0)}%`, 10, 80);
  }
  
  $: {
    if (analyzer) {
      if (isPlaying && $isAudioLoaded) {
        analyzer.play();
        startAnalysis();
      } else {
        analyzer.pause();
        stopAnalysis();
      }
    }
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d');
    handleResize();
  });
  
  onDestroy(() => {
    stopAnalysis();
    analyzer?.destroy();
  });
  
  function handleResize() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
</script>

<div class="audio-analyzer">
  <div class="controls">
    <input
      bind:this={fileInput}
      type="file"
      accept="audio/*"
      on:change={handleFileSelect}
      style="display: none"
    />
    <button on:click={() => fileInput.click()}>
      Load Audio File
    </button>
    {#if $isAudioLoaded}
      <span class="filename">{$audioFileName}</span>
    {/if}
  </div>
  
  <canvas bind:this={canvas} on:resize={handleResize}></canvas>
</div>

<style>
  .audio-analyzer {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .controls button {
    padding: 0.5rem 1rem;
    background-color: #2a2a2a;
    color: #ffffff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .controls button:hover {
    background-color: #3a3a3a;
  }
  
  .filename {
    font-size: 0.85rem;
    color: #888888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  canvas {
    flex: 1;
    width: 100%;
    background-color: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
  }
</style>