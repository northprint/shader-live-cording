<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Tone from 'tone';
  import { audioData, isAudioLoaded, audioFileName } from '../../stores/audioStore';
  
  export let isPlaying = true;
  
  // エフェクトパラメータを受け取る
  export let effectParams = {
    filterFreq: 1000,
    filterType: 'lowpass' as BiquadFilterType,
    filterEnabled: false,
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
  
  // 入力ゲイン
  let inputGain: Tone.Gain | null = null;
  
  // エフェクトとそのドライ/ウェットミキサー
  let filter: Tone.Filter | null = null;
  let filterGain: Tone.Gain | null = null;
  
  let delay: Tone.FeedbackDelay | null = null;
  let delayDry: Tone.Gain | null = null;
  let delayWet: Tone.Gain | null = null;
  
  let reverb: Tone.Reverb | null = null;
  let reverbDry: Tone.Gain | null = null;
  let reverbWet: Tone.Gain | null = null;
  
  let distortion: Tone.Distortion | null = null;
  let distortionDry: Tone.Gain | null = null;
  let distortionWet: Tone.Gain | null = null;
  
  let compressor: Tone.Compressor | null = null;
  let compressorDry: Tone.Gain | null = null;
  let compressorWet: Tone.Gain | null = null;
  
  // 出力チェーン
  let outputGain: Tone.Gain | null = null;
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
    
    // ゲインノードの初期化
    inputGain = new Tone.Gain(1);
    outputGain = new Tone.Gain(1);
    
    // フィルターチェーン
    filter = new Tone.Filter({
      frequency: effectParams.filterFreq,
      type: effectParams.filterType,
      Q: 1
    });
    filterGain = new Tone.Gain(1);
    
    // ディレイチェーン（ドライ/ウェット）
    delay = new Tone.FeedbackDelay(effectParams.delayTime, effectParams.delayFeedback);
    delayDry = new Tone.Gain(1);
    delayWet = new Tone.Gain(0);
    
    // リバーブチェーン（ドライ/ウェット）
    reverb = new Tone.Reverb(2);
    reverbDry = new Tone.Gain(1);
    reverbWet = new Tone.Gain(0);
    
    // ディストーションチェーン（ドライ/ウェット）
    distortion = new Tone.Distortion(effectParams.distortionAmount);
    distortionDry = new Tone.Gain(1);
    distortionWet = new Tone.Gain(0);
    
    // コンプレッサーチェーン（ドライ/ウェット）
    compressor = new Tone.Compressor(effectParams.compressorThreshold, 3);
    compressorDry = new Tone.Gain(1);
    compressorWet = new Tone.Gain(0);
    
    // アナライザー
    analyser = new Tone.Analyser('waveform', 256);
    fft = new Tone.FFT(256);
    meter = new Tone.Meter();
    
    // エフェクトチェーンの接続（パラレル処理）
    connectEffectChain();
    
    // リバーブの初期化
    await reverb.generate();
    
    // 初期パラメータ設定
    updateEffectParameters();
  }
  
  function connectEffectChain() {
    if (!inputGain || !outputGain) return;
    
    // フィルター（直列接続）
    if (effectParams.filterEnabled) {
      inputGain.connect(filter);
      filter.connect(filterGain);
    } else {
      inputGain.connect(filterGain);
    }
    
    // ディレイ（パラレル接続）
    filterGain.connect(delayDry);
    filterGain.connect(delay);
    delay.connect(delayWet);
    
    const delayMix = new Tone.Gain(1);
    delayDry.connect(delayMix);
    delayWet.connect(delayMix);
    
    // リバーブ（パラレル接続）
    delayMix.connect(reverbDry);
    delayMix.connect(reverb);
    reverb.connect(reverbWet);
    
    const reverbMix = new Tone.Gain(1);
    reverbDry.connect(reverbMix);
    reverbWet.connect(reverbMix);
    
    // ディストーション（パラレル接続）
    reverbMix.connect(distortionDry);
    reverbMix.connect(distortion);
    distortion.connect(distortionWet);
    
    const distortionMix = new Tone.Gain(1);
    distortionDry.connect(distortionMix);
    distortionWet.connect(distortionMix);
    
    // コンプレッサー（パラレル接続）
    distortionMix.connect(compressorDry);
    distortionMix.connect(compressor);
    compressor.connect(compressorWet);
    
    const compressorMix = new Tone.Gain(1);
    compressorDry.connect(compressorMix);
    compressorWet.connect(compressorMix);
    
    // 出力へ接続
    compressorMix.connect(outputGain);
    outputGain.fan(analyser, fft, meter);
    meter.toDestination();
  }
  
  function reconnectFilterChain() {
    if (!inputGain || !filter || !filterGain) return;
    
    // 既存の接続を切断
    inputGain.disconnect();
    filter.disconnect();
    
    // フィルターの有効/無効に応じて再接続
    if (effectParams.filterEnabled) {
      inputGain.connect(filter);
      filter.connect(filterGain);
    } else {
      inputGain.connect(filterGain);
    }
  }
  
  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    loadAudioFile(file);
  }
  
  async function loadAudioFile(file: File) {
    try {
      // エフェクトチェーンが初期化されていない場合は初期化
      if (!inputGain) {
        await initializeEffectChain();
      }
      
      // 既存のプレイヤーを停止して破棄
      if (player) {
        try {
          if (player.state === 'started') {
            player.stop();
          }
          player.disconnect();
          player.dispose();
          player = null;
        } catch (e) {
          console.warn('既存プレイヤーのクリーンアップエラー:', e);
        }
      }
      
      // ファイルを読み込む
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
      
      // 新しいプレイヤーを作成
      player = new Tone.Player({
        buffer: audioBuffer,
        loop: true,
        autostart: false
      });
      
      // ファイル情報を更新
      $audioFileName = file.name;
      $isAudioLoaded = true;
      
      // エフェクトチェーンに接続
      if (player && inputGain) {
        player.connect(inputGain);
      }
      
      // 再生状態に応じて開始
      if (isPlaying && player.loaded) {
        await Tone.loaded();
        player.start();
      }
      
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
      $isAudioLoaded = false;
      $audioFileName = '';
    }
  }
  
  function updateEffectParameters() {
    // フィルター
    if (filter && filterGain) {
      filter.frequency.value = effectParams.filterFreq;
      filter.type = effectParams.filterType;
      
      // フィルターの再接続
      reconnectFilterChain();
    }
    
    // ディレイ
    if (delay && delayDry && delayWet) {
      delay.delayTime.value = effectParams.delayTime;
      delay.feedback.value = effectParams.delayFeedback;
      
      if (effectParams.delayEnabled) {
        delayDry.gain.value = 1 - effectParams.delayFeedback * 0.5; // ドライ信号を少し下げる
        delayWet.gain.value = 1;
      } else {
        delayDry.gain.value = 1;
        delayWet.gain.value = 0;
      }
    }
    
    // リバーブ
    if (reverb && reverbDry && reverbWet) {
      if (effectParams.reverbEnabled) {
        reverbDry.gain.value = 1 - effectParams.reverbMix;
        reverbWet.gain.value = effectParams.reverbMix;
      } else {
        reverbDry.gain.value = 1;
        reverbWet.gain.value = 0;
      }
    }
    
    // ディストーション
    if (distortion && distortionDry && distortionWet) {
      distortion.distortion = effectParams.distortionAmount;
      
      if (effectParams.distortionEnabled && effectParams.distortionAmount > 0) {
        distortionDry.gain.value = 1 - effectParams.distortionAmount * 0.7;
        distortionWet.gain.value = effectParams.distortionAmount;
      } else {
        distortionDry.gain.value = 1;
        distortionWet.gain.value = 0;
      }
    }
    
    // コンプレッサー
    if (compressor && compressorDry && compressorWet) {
      compressor.threshold.value = effectParams.compressorThreshold;
      
      if (effectParams.compressorEnabled) {
        compressorDry.gain.value = 0;
        compressorWet.gain.value = 1;
      } else {
        compressorDry.gain.value = 1;
        compressorWet.gain.value = 0;
      }
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
      try {
        if (player.state === 'started') {
          player.stop();
        }
        player.disconnect();
        player.dispose();
      } catch (e) {
        console.warn('プレイヤーのクリーンアップエラー:', e);
      }
    }
    
    // すべてのノードをクリーンアップ
    [inputGain, filter, filterGain, delay, delayDry, delayWet, reverb, reverbDry, reverbWet, 
     distortion, distortionDry, distortionWet, compressor, compressorDry, compressorWet,
     outputGain, analyser, fft, meter].forEach(node => {
      if (node) {
        try {
          node.disconnect();
          node.dispose();
        } catch (e) {
          console.warn('ノードのクリーンアップエラー:', e);
        }
      }
    });
  });
  
  // 再生状態の反映
  $: if (player && $isAudioLoaded && player.loaded) {
    try {
      if (isPlaying && player.state !== 'started') {
        player.start();
      } else if (!isPlaying && player.state === 'started') {
        player.stop();
      }
    } catch (e) {
      console.warn('再生状態の変更エラー:', e);
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