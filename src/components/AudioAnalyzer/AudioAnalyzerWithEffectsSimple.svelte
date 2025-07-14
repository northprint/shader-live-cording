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
    
    // エフェクトの作成
    filter = new Tone.Filter({
      frequency: effectParams.filterFreq,
      type: effectParams.filterType
    });
    
    delay = new Tone.FeedbackDelay({
      delayTime: effectParams.delayTime,
      feedback: effectParams.delayFeedback,
      wet: 0 // 初期はドライ
    });
    
    reverb = new Tone.Reverb({
      decay: 2,
      wet: 0 // 初期はドライ
    });
    
    distortion = new Tone.Distortion({
      distortion: effectParams.distortionAmount,
      wet: 0 // 初期はドライ
    });
    
    compressor = new Tone.Compressor({
      threshold: effectParams.compressorThreshold,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });
    
    // アナライザー
    analyser = new Tone.Analyser('waveform', 256);
    fft = new Tone.FFT(256);
    meter = new Tone.Meter();
    
    // リバーブの初期化
    await reverb.generate();
    
    // 初期パラメータ設定
    updateEffectParameters();
  }
  
  function connectEffectChain(source: Tone.Player) {
    if (!source || !filter || !delay || !reverb || !distortion || !compressor || !analyser || !fft || !meter) return;
    
    // シンプルな直列接続
    source.connect(filter);
    filter.connect(delay);
    delay.connect(reverb);
    reverb.connect(distortion);
    distortion.connect(compressor);
    compressor.fan(analyser, fft, meter);
    meter.toDestination();
  }
  
  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    loadAudioFile(file);
  }
  
  async function loadAudioFile(file: File) {
    try {
      console.log('Loading audio file:', file.name);
      
      // エフェクトチェーンが初期化されていない場合は初期化
      if (!filter) {
        console.log('Initializing effect chain...');
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
      console.log('Decoding audio data...');
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
      console.log('Audio buffer created:', audioBuffer.duration, 'seconds');
      
      // 新しいプレイヤーを作成
      player = new Tone.Player();
      player.buffer = audioBuffer;
      player.loop = true;
      
      // バッファがロードされるまで待つ
      await player.loaded;
      console.log('Player loaded successfully');
      
      // ファイル情報を更新
      $audioFileName = file.name;
      $isAudioLoaded = true;
      
      // エフェクトチェーンに接続
      console.log('Connecting effect chain...');
      connectEffectChain(player);
      
      // Tone.jsのコンテキストを開始
      if (Tone.context.state === 'suspended') {
        await Tone.start();
      }
      
      // 再生状態に応じて開始
      if (isPlaying) {
        console.log('Starting playback...');
        // スケジュール時間を指定して再生
        player.start('+0.1');
        console.log('Player state:', player.state);
      }
      
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
      $isAudioLoaded = false;
      $audioFileName = '';
    }
  }
  
  function updateEffectParameters() {
    console.log('Updating effect parameters:', effectParams);
    
    // フィルター
    if (filter) {
      if (effectParams.filterEnabled) {
        filter.frequency.value = effectParams.filterFreq;
        filter.type = effectParams.filterType;
        filter.Q.value = 1;
        console.log(`Filter enabled: ${effectParams.filterType} at ${effectParams.filterFreq}Hz`);
      } else {
        // フィルターを無効化（フラットな特性にする）
        filter.frequency.value = 20000;
        filter.Q.value = 0;
        filter.type = 'allpass';
        console.log('Filter disabled');
      }
    }
    
    // ディレイ
    if (delay) {
      delay.delayTime.value = effectParams.delayTime;
      delay.feedback.value = effectParams.delayFeedback;
      delay.wet.value = effectParams.delayEnabled ? 0.5 : 0;
      console.log(`Delay: enabled=${effectParams.delayEnabled}, wet=${delay.wet.value}, time=${effectParams.delayTime}, feedback=${effectParams.delayFeedback}`);
    }
    
    // リバーブ
    if (reverb) {
      reverb.wet.value = effectParams.reverbEnabled ? effectParams.reverbMix : 0;
      console.log(`Reverb: enabled=${effectParams.reverbEnabled}, wet=${reverb.wet.value}`);
    }
    
    // ディストーション
    if (distortion) {
      distortion.distortion = effectParams.distortionAmount;
      distortion.wet.value = effectParams.distortionEnabled ? 1 : 0;
      console.log(`Distortion: enabled=${effectParams.distortionEnabled}, amount=${effectParams.distortionAmount}, wet=${distortion.wet.value}`);
    }
    
    // コンプレッサー
    if (compressor) {
      compressor.threshold.value = effectParams.compressorThreshold;
      compressor.ratio.value = effectParams.compressorEnabled ? 4 : 1;
      console.log(`Compressor: enabled=${effectParams.compressorEnabled}, threshold=${effectParams.compressorThreshold}, ratio=${compressor.ratio.value}`);
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
    [filter, delay, reverb, distortion, compressor, analyser, fft, meter].forEach(node => {
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
    (async () => {
      try {
        // Tone.jsのコンテキストが開始していることを確認
        if (Tone.context.state === 'suspended') {
          console.log('Starting audio context...');
          await Tone.start();
        }
        
        // バッファがロードされていることを確認
        if (!player.buffer || player.buffer.length === 0) {
          console.warn('Player buffer not loaded yet');
          return;
        }
        
        if (isPlaying && player.state !== 'started') {
          console.log('Starting player from reactive statement...');
          player.start('+0.1');
        } else if (!isPlaying && player.state === 'started') {
          console.log('Stopping player...');
          player.stop('+0.1');
        }
      } catch (e) {
        console.warn('再生状態の変更エラー:', e);
      }
    })();
  }
  
  // エフェクトパラメータの反映
  $: {
    console.log('AudioAnalyzer: effectParams changed:', effectParams);
    updateEffectParameters();
  }
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
    
    <!-- デバッグ用の再生ボタン -->
    <button 
      class="debug-play-button"
      on:click={async () => {
        try {
          if (!player) {
            console.error('Player not initialized');
            return;
          }
          
          // コンテキストを開始
          if (Tone.context.state === 'suspended') {
            await Tone.start();
            console.log('Audio context started');
          }
          
          // バッファの確認
          if (!player.buffer || player.buffer.length === 0) {
            console.error('Player buffer is empty');
            return;
          }
          
          if (player.state === 'started') {
            console.log('Stopping player...');
            player.stop();
          } else {
            console.log('Starting player...');
            player.start();
          }
          
          console.log('Player state after action:', player.state);
        } catch (e) {
          console.error('Debug play error:', e);
        }
      }}
    >
      {player?.state === 'started' ? 'Stop' : 'Play'} (Debug)
    </button>
    
    <!-- エフェクトテストボタン -->
    <div class="effect-test-buttons">
      <button 
        class="effect-test-button"
        on:click={() => {
          console.log('=== Testing Delay Effect ===');
          effectParams.delayEnabled = true;
          effectParams.delayTime = 0.5;
          effectParams.delayFeedback = 0.7;
          updateEffectParameters();
        }}
      >
        Test Delay
      </button>
      
      <button 
        class="effect-test-button"
        on:click={() => {
          console.log('=== Testing Reverb Effect ===');
          effectParams.reverbEnabled = true;
          effectParams.reverbMix = 0.7;
          updateEffectParameters();
        }}
      >
        Test Reverb
      </button>
      
      <button 
        class="effect-test-button"
        on:click={() => {
          console.log('=== Testing Filter Effect ===');
          effectParams.filterEnabled = true;
          effectParams.filterType = 'lowpass';
          effectParams.filterFreq = 500;
          updateEffectParameters();
        }}
      >
        Test Filter
      </button>
      
      <button 
        class="effect-test-button"
        on:click={() => {
          console.log('=== Disabling All Effects ===');
          effectParams.filterEnabled = false;
          effectParams.delayEnabled = false;
          effectParams.reverbEnabled = false;
          effectParams.distortionEnabled = false;
          updateEffectParameters();
        }}
      >
        Disable All
      </button>
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
  
  .debug-play-button {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #ff9900;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .debug-play-button:hover {
    background-color: #ff7700;
  }
  
  .effect-test-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .effect-test-button {
    padding: 0.4rem;
    background-color: #4a9eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .effect-test-button:hover {
    background-color: #3a8eef;
  }
</style>