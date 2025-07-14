<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Tone from 'tone';
  import { audioData, isAudioLoaded, audioFileName } from '../../stores/audioStore';
  
  export let isPlaying = true;
  
  // エフェクトパラメータを受け取る
  export let effectParams = {
    filterFreq: 1000,
    filterType: 'lowpass' as BiquadFilterType,
    filterEnabled: true,
    delayTime: 0.25,
    delayFeedback: 0.3,
    delayEnabled: false,
    reverbMix: 0.2,
    reverbEnabled: false,
    distortionAmount: 0,
    distortionEnabled: false,
    compressorThreshold: -12,
    compressorEnabled: true
  };
  
  let fileInput: HTMLInputElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number | null = null;
  
  // Tone.js ノード
  let player: Tone.Player | null = null;
  let filter: Tone.Filter | null = null;
  let delay: Tone.FeedbackDelay | null = null;
  let reverb: Tone.Reverb | null = null;
  let distortion: Tone.Distortion | null = null;
  let compressor: Tone.Compressor | null = null;
  let analyser: Tone.Analyser | null = null;
  let meter: Tone.Meter | null = null;
  let fft: Tone.FFT | null = null;
  
  // 分析データ
  let waveformData = new Float32Array(256);
  let frequencyData = new Float32Array(256);
  let bassEnergy = 0;
  let midEnergy = 0;
  let trebleEnergy = 0;
  let volume = 0;
  let beatDetected = false;
  let bpm = 0;
  
  // ビート検出用
  let beatHistory: number[] = [];
  let beatThreshold = 1.3;
  let lastBeatTime = 0;
  let beatTimes: number[] = [];
  
  async function initializeEffectChain() {
    await Tone.start();
    
    // エフェクトチェーンの構築
    filter = new Tone.Filter(effectParams.filterFreq, effectParams.filterType);
    delay = new Tone.FeedbackDelay(effectParams.delayTime, effectParams.delayFeedback);
    reverb = new Tone.Reverb(2);
    distortion = new Tone.Distortion(effectParams.distortionAmount);
    compressor = new Tone.Compressor(effectParams.compressorThreshold, 3);
    analyser = new Tone.Analyser('waveform', 256);
    fft = new Tone.FFT(256);
    meter = new Tone.Meter();
    
    // エフェクトチェーンの接続
    // Player -> Filter -> Delay -> Reverb -> Distortion -> Compressor -> Analysers -> Output
    filter.connect(delay);
    delay.connect(reverb);
    reverb.connect(distortion);
    distortion.connect(compressor);
    compressor.fan(analyser, fft, meter);
    meter.toDestination();
    
    // リバーブの初期化
    await reverb.generate();
    
    // 初期パラメータ設定
    updateEffectParameters();
  }
  
  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    loadAudioFile(file);
  }
  
  async function loadAudioFile(file: File) {
    try {
      // エフェクトチェーンが初期化されていない場合は初期化
      if (!filter) {
        await initializeEffectChain();
      }
      
      // 既存のプレイヤーを停止
      if (player) {
        player.stop();
        player.dispose();
      }
      
      // ファイルをURLに変換
      const url = URL.createObjectURL(file);
      
      // 新しいプレイヤーを作成
      player = new Tone.Player({
        url: url,
        loop: true,
        autostart: false,
        onload: () => {
          $audioFileName = file.name;
          $isAudioLoaded = true;
          
          // エフェクトチェーンに接続
          if (player && filter) {
            player.connect(filter);
          }
          
          // URLをクリーンアップ
          URL.revokeObjectURL(url);
          
          // 再生開始
          if (isPlaying && player) {
            player.start();
          }
        }
      });
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
    }
  }
  
  function updateEffectParameters() {
    if (filter) {
      filter.frequency.value = effectParams.filterFreq;
      filter.type = effectParams.filterType;
      // フィルターのバイパス（Q値を0に近づけてフラットにする）
      if (!effectParams.filterEnabled) {
        filter.Q.value = 0;
        filter.gain.value = 0;
      } else {
        filter.Q.value = 1;
      }
    }
    if (delay) {
      delay.delayTime.value = effectParams.delayTime;
      delay.feedback.value = effectParams.delayEnabled ? effectParams.delayFeedback : 0;
      // ディレイのドライ/ウェット調整
      delay.wet.value = effectParams.delayEnabled ? 1 : 0;
    }
    if (reverb) {
      // リバーブのドライ/ウェット調整
      reverb.wet.value = effectParams.reverbEnabled ? effectParams.reverbMix : 0;
    }
    if (distortion) {
      // ディストーションの量を調整
      distortion.distortion = effectParams.distortionEnabled ? effectParams.distortionAmount : 0;
      distortion.wet.value = effectParams.distortionEnabled ? 1 : 0;
    }
    if (compressor) {
      compressor.threshold.value = effectParams.compressorThreshold;
      // コンプレッサーのバイパス（レシオを1:1にする）
      compressor.ratio.value = effectParams.compressorEnabled ? 4 : 1;
    }
  }
  
  function updateAnalysisData() {
    if (!analyser || !fft || !meter) return;
    
    // 波形データを取得
    waveformData = analyser.getValue() as Float32Array;
    
    // 周波数データを取得
    const fftValues = fft.getValue();
    frequencyData = new Float32Array(fftValues);
    
    // 周波数帯域ごとのエネルギーを計算
    const bassEnd = Math.floor(frequencyData.length * 0.1); // 0-10%
    const midEnd = Math.floor(frequencyData.length * 0.5);  // 10-50%
    
    bassEnergy = 0;
    midEnergy = 0;
    trebleEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const value = Math.max(0, (frequencyData[i] + 140) / 140); // dBを0-1に正規化
      
      if (i < bassEnd) {
        bassEnergy += value;
      } else if (i < midEnd) {
        midEnergy += value;
      } else {
        trebleEnergy += value;
      }
    }
    
    // 正規化
    bassEnergy = bassEnergy / bassEnd;
    midEnergy = midEnergy / (midEnd - bassEnd);
    trebleEnergy = trebleEnergy / (frequencyData.length - midEnd);
    
    // ボリューム
    const meterValue = meter.getValue();
    volume = typeof meterValue === 'number' ? Math.max(0, (meterValue + 60) / 60) : 0;
    
    // ビート検出
    detectBeat();
    
    // ストアを更新
    $audioData = {
      frequency: frequencyData,
      waveform: waveformData,
      bpm: bpm,
      beat: beatDetected,
      bass: bassEnergy,
      mid: midEnergy,
      treble: trebleEnergy,
      volume: volume,
      // エフェクトパラメータ
      effectFilterFreq: effectParams.filterFreq / 20000,
      effectDelayTime: effectParams.delayTime,
      effectReverbMix: effectParams.reverbMix,
      effectDistortion: effectParams.distortionAmount,
      effectCompressor: (effectParams.compressorThreshold + 60) / 60
    };
  }
  
  function detectBeat() {
    const energy = bassEnergy + midEnergy * 0.5;
    
    // エネルギー履歴を更新
    beatHistory.push(energy);
    if (beatHistory.length > 43) {
      beatHistory.shift();
    }
    
    if (beatHistory.length < 43) {
      beatDetected = false;
      return;
    }
    
    // 平均エネルギーを計算
    const average = beatHistory.reduce((a, b) => a + b) / beatHistory.length;
    
    // ビート検出
    const now = Date.now();
    beatDetected = energy > average * beatThreshold && (now - lastBeatTime) > 100;
    
    if (beatDetected) {
      lastBeatTime = now;
      beatTimes.push(now);
      
      // 古いビート情報を削除
      beatTimes = beatTimes.filter(time => now - time < 10000);
      
      // BPM計算
      if (beatTimes.length >= 4) {
        const intervals = [];
        for (let i = 1; i < beatTimes.length; i++) {
          intervals.push(beatTimes[i] - beatTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        bpm = Math.round(60000 / avgInterval);
      }
    }
  }
  
  function animate() {
    if (ctx && canvas) {
      updateAnalysisData();
      drawVisualization();
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function drawVisualization() {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 背景をクリア
    ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // 波形を描画
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const sliceWidth = width / waveformData.length;
    let x = 0;
    
    for (let i = 0; i < waveformData.length; i++) {
      const v = (waveformData[i] + 1) / 2;
      const y = v * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // ビート検出インジケーター
    if (beatDetected) {
      ctx.fillStyle = 'rgba(74, 158, 255, 0.5)';
      ctx.fillRect(0, 0, width, height);
    }
  }
  
  onMount(() => {
    ctx = canvas?.getContext('2d');
    if (ctx) {
      canvas.width = canvas.offsetWidth;
      canvas.height = 60;
    }
    
    // アニメーション開始
    animate();
  });
  
  onDestroy(() => {
    // アニメーション停止
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    // Tone.jsリソースのクリーンアップ
    if (player) {
      player.stop();
      player.dispose();
    }
    
    [filter, delay, reverb, distortion, compressor, analyser, fft, meter].forEach(node => {
      if (node) node.dispose();
    });
  });
  
  // 再生状態の反映
  $: if (player && $isAudioLoaded) {
    if (isPlaying) {
      player.start();
    } else {
      player.stop();
    }
  }
  
  // エフェクトパラメータの反映
  $: updateEffectParameters();
</script>

<div class="audio-analyzer">
  <div class="file-input-wrapper">
    <input
      bind:this={fileInput}
      type="file"
      accept="audio/*"
      on:change={handleFileSelect}
      id="audio-file-input"
    />
    <label for="audio-file-input" class="file-input-label">
      {$isAudioLoaded ? $audioFileName : 'Load Audio'}
    </label>
  </div>
  
  <canvas bind:this={canvas} class="waveform-display"></canvas>
  
  {#if $isAudioLoaded}
    <div class="audio-info">
      <span>BPM: {bpm}</span>
      <span>Bass: {(bassEnergy * 100).toFixed(0)}%</span>
      <span>Mid: {(midEnergy * 100).toFixed(0)}%</span>
      <span>Treble: {(trebleEnergy * 100).toFixed(0)}%</span>
    </div>
  {/if}
</div>

<style>
  .audio-analyzer {
    padding: 0.5rem;
  }
  
  .file-input-wrapper {
    position: relative;
    margin-bottom: 0.5rem;
  }
  
  input[type="file"] {
    position: absolute;
    left: -9999px;
  }
  
  .file-input-label {
    display: block;
    padding: 0.5rem 1rem;
    background-color: #4a9eff;
    color: white;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-input-label:hover {
    background-color: #3a8eef;
  }
  
  .waveform-display {
    width: 100%;
    height: 60px;
    background-color: #1a1a1a;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  
  .audio-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #888;
    padding: 0.25rem;
  }
</style>