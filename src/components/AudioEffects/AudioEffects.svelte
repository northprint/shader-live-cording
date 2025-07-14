<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Tone from 'tone';
  import { audioData } from '../../stores/audioStore';
  import { get } from 'svelte/store';
  
  // エフェクトチェーン
  let filter: Tone.Filter | null = null;
  let delay: Tone.FeedbackDelay | null = null;
  let reverb: Tone.Reverb | null = null;
  let distortion: Tone.Distortion | null = null;
  let compressor: Tone.Compressor | null = null;
  let analyser: Tone.Analyser | null = null;
  let meter: Tone.Meter | null = null;
  
  // サンプラー
  let sampler: Tone.Sampler | null = null;
  let samples = [
    { name: 'Kick', key: 'C2', file: null },
    { name: 'Snare', key: 'D2', file: null },
    { name: 'HiHat', key: 'E2', file: null },
    { name: 'Clap', key: 'F2', file: null },
  ];
  
  // エフェクトパラメータ
  let filterFreq = 1000;
  let filterType: BiquadFilterType = 'lowpass';
  let delayTime = 0.25;
  let delayFeedback = 0.3;
  let reverbMix = 0.2;
  let distortionAmount = 0;
  let compressorThreshold = -12;
  
  // UI状態
  let activeTab: 'sampler' | 'effects' = 'effects';
  let isProcessing = false;
  let audioContext: AudioContext | null = null;
  
  // ビジュアライゼーション
  let waveformData = new Float32Array(256);
  let frequencyData = new Float32Array(256);
  
  onMount(async () => {
    // Tone.jsの初期化
    await Tone.start();
    
    // エフェクトチェーンの構築
    filter = new Tone.Filter(filterFreq, filterType);
    delay = new Tone.FeedbackDelay(delayTime, delayFeedback);
    reverb = new Tone.Reverb(2);
    distortion = new Tone.Distortion(distortionAmount);
    compressor = new Tone.Compressor(compressorThreshold, 3);
    analyser = new Tone.Analyser('waveform', 256);
    meter = new Tone.Meter();
    
    // エフェクトチェーンの接続
    // Input -> Filter -> Delay -> Reverb -> Distortion -> Compressor -> Analyser -> Output
    filter.connect(delay);
    delay.connect(reverb);
    reverb.connect(distortion);
    distortion.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(meter);
    meter.toDestination();
    
    // リバーブの初期化
    await reverb.generate();
    
    // オーディオコンテキストの取得
    audioContext = Tone.context.rawContext as AudioContext;
    
    // 定期的なデータ更新
    const updateInterval = setInterval(() => {
      if (analyser) {
        waveformData = analyser.getValue() as Float32Array;
        updateShaderData();
      }
    }, 1000 / 60); // 60fps
    
    return () => clearInterval(updateInterval);
  });
  
  onDestroy(() => {
    // リソースのクリーンアップ
    [filter, delay, reverb, distortion, compressor, analyser, meter, sampler].forEach(node => {
      if (node) node.dispose();
    });
  });
  
  // シェーダーデータの更新
  function updateShaderData() {
    const currentAudioData = get(audioData);
    
    // エフェクトパラメータを追加
    const enhancedData = {
      ...currentAudioData,
      effectFilterFreq: filterFreq / 20000, // 0-1に正規化
      effectDelayTime: delayTime,
      effectReverbMix: reverbMix,
      effectDistortion: distortionAmount,
      effectCompressor: (compressorThreshold + 60) / 60, // 0-1に正規化
      waveform: waveformData,
      volume: meter ? meter.getValue() as number : 0
    };
    
    audioData.set(enhancedData);
  }
  
  // オーディオ入力の処理
  async function processAudioInput(audioBuffer: AudioBuffer) {
    if (!audioContext || !filter) return;
    
    isProcessing = true;
    
    // AudioBufferSourceNodeを作成
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Tone.jsのノードに接続
    const toneSource = Tone.context.createMediaStreamSource(source as any);
    toneSource.connect(filter);
    
    source.start();
    
    // 処理完了後
    source.onended = () => {
      isProcessing = false;
      toneSource.disconnect();
    };
  }
  
  // サンプルのトリガー
  function triggerSample(index: number) {
    if (!sampler || !samples[index].file) return;
    
    sampler.triggerAttackRelease(samples[index].key, '8n');
    
    // シェーダーにトリガー情報を送信
    const triggerData = new Float32Array(4);
    triggerData[index] = 1.0;
    
    // TODO: シェーダーのuniform変数として送信
  }
  
  // エフェクトパラメータの更新
  function updateFilter() {
    if (filter) {
      filter.frequency.value = filterFreq;
      filter.type = filterType;
    }
  }
  
  function updateDelay() {
    if (delay) {
      delay.delayTime.value = delayTime;
      delay.feedback.value = delayFeedback;
    }
  }
  
  function updateReverb() {
    if (reverb) {
      reverb.wet.value = reverbMix;
    }
  }
  
  function updateDistortion() {
    if (distortion) {
      distortion.distortion = distortionAmount;
    }
  }
  
  function updateCompressor() {
    if (compressor) {
      compressor.threshold.value = compressorThreshold;
    }
  }
  
  // リアクティブな更新
  $: updateFilter();
  $: updateDelay();
  $: updateReverb();
  $: updateDistortion();
  $: updateCompressor();
</script>

<div class="audio-effects">
  <h3>Audio Effects & Sampler</h3>
  
  <div class="tabs">
    <button 
      class="tab {activeTab === 'effects' ? 'active' : ''}"
      on:click={() => activeTab = 'effects'}
    >
      Effects
    </button>
    <button 
      class="tab {activeTab === 'sampler' ? 'active' : ''}"
      on:click={() => activeTab = 'sampler'}
    >
      Sampler
    </button>
  </div>
  
  {#if activeTab === 'effects'}
    <div class="effects-panel">
      <!-- フィルター -->
      <div class="effect-section">
        <h4>Filter</h4>
        <select bind:value={filterType}>
          <option value="lowpass">Low Pass</option>
          <option value="highpass">High Pass</option>
          <option value="bandpass">Band Pass</option>
          <option value="notch">Notch</option>
        </select>
        <div class="control">
          <label>Frequency: {filterFreq}Hz</label>
          <input type="range" min="20" max="20000" step="10" bind:value={filterFreq} />
        </div>
      </div>
      
      <!-- ディレイ -->
      <div class="effect-section">
        <h4>Delay</h4>
        <div class="control">
          <label>Time: {delayTime}s</label>
          <input type="range" min="0" max="1" step="0.01" bind:value={delayTime} />
        </div>
        <div class="control">
          <label>Feedback: {(delayFeedback * 100).toFixed(0)}%</label>
          <input type="range" min="0" max="0.9" step="0.01" bind:value={delayFeedback} />
        </div>
      </div>
      
      <!-- リバーブ -->
      <div class="effect-section">
        <h4>Reverb</h4>
        <div class="control">
          <label>Mix: {(reverbMix * 100).toFixed(0)}%</label>
          <input type="range" min="0" max="1" step="0.01" bind:value={reverbMix} />
        </div>
      </div>
      
      <!-- ディストーション -->
      <div class="effect-section">
        <h4>Distortion</h4>
        <div class="control">
          <label>Amount: {(distortionAmount * 100).toFixed(0)}%</label>
          <input type="range" min="0" max="1" step="0.01" bind:value={distortionAmount} />
        </div>
      </div>
      
      <!-- コンプレッサー -->
      <div class="effect-section">
        <h4>Compressor</h4>
        <div class="control">
          <label>Threshold: {compressorThreshold}dB</label>
          <input type="range" min="-60" max="0" step="1" bind:value={compressorThreshold} />
        </div>
      </div>
    </div>
  {:else}
    <div class="sampler-panel">
      <div class="sample-pads">
        {#each samples as sample, i}
          <button 
            class="sample-pad"
            on:click={() => triggerSample(i)}
          >
            <span class="pad-number">{i + 1}</span>
            <span class="pad-name">{sample.name}</span>
          </button>
        {/each}
      </div>
      
      <div class="sample-info">
        <p>サンプルパッドをクリックするか、1-4キーで再生</p>
        <p class="hint">※ サンプル音源の読み込み機能は次回実装予定</p>
      </div>
    </div>
  {/if}
  
  <!-- ビジュアルメーター -->
  <div class="visual-meter">
    <canvas class="waveform-display"></canvas>
  </div>
</div>

<style>
  .audio-effects {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #ccc;
  }
  
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .tab {
    flex: 1;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #888;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .tab.active {
    background-color: #4a9eff;
    color: #fff;
    border-color: #4a9eff;
  }
  
  .tab:hover:not(.active) {
    background-color: #333;
  }
  
  .effects-panel, .sampler-panel {
    flex: 1;
    overflow-y: auto;
  }
  
  .effect-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .effect-section:last-child {
    border-bottom: none;
  }
  
  .effect-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #999;
  }
  
  select {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .control {
    margin-bottom: 0.5rem;
  }
  
  .control label {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.25rem;
  }
  
  .control input[type="range"] {
    width: 100%;
    height: 4px;
    background: #3a3a3a;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #4a9eff;
    cursor: pointer;
    border-radius: 50%;
  }
  
  /* サンプラー */
  .sample-pads {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .sample-pad {
    aspect-ratio: 1;
    background-color: #3a3a3a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }
  
  .sample-pad:hover {
    background-color: #4a4a4a;
  }
  
  .sample-pad:active {
    background-color: #4a9eff;
    transform: scale(0.95);
  }
  
  .pad-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a9eff;
  }
  
  .pad-name {
    font-size: 0.85rem;
    color: #ccc;
    margin-top: 0.25rem;
  }
  
  .sample-info {
    text-align: center;
    color: #888;
    font-size: 0.85rem;
  }
  
  .hint {
    color: #666;
    font-style: italic;
    margin-top: 0.5rem;
  }
  
  /* ビジュアルメーター */
  .visual-meter {
    margin-top: 1rem;
    height: 60px;
    background-color: #2a2a2a;
    border-radius: 4px;
    padding: 0.5rem;
  }
  
  .waveform-display {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    border-radius: 2px;
  }
</style>