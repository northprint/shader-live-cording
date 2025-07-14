<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let effectParams = {
    filterFreq: 1000,
    filterType: 'lowpass' as BiquadFilterType,
    filterEnabled: false,  // Controls.svelteと一致させる
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
  
  const dispatch = createEventDispatcher();
  
  let activeTab: 'effects' | 'sampler' = 'effects';
  
  // パラメータが変更されたときに親コンポーネントに通知
  function updateParams() {
    console.log('AudioEffectsPanel: Dispatching effect update:', effectParams);
    dispatch('updateEffects', effectParams);
  }
  
  // 各パラメータの更新関数
  function updateFilterFreq(value: number) {
    effectParams.filterFreq = value;
    updateParams();
  }
  
  function updateFilterType(value: BiquadFilterType) {
    effectParams.filterType = value;
    updateParams();
  }
  
  function updateDelayTime(value: number) {
    effectParams.delayTime = value;
    updateParams();
  }
  
  function updateDelayFeedback(value: number) {
    effectParams.delayFeedback = value;
    updateParams();
  }
  
  function updateReverbMix(value: number) {
    effectParams.reverbMix = value;
    updateParams();
  }
  
  function updateDistortion(value: number) {
    effectParams.distortionAmount = value;
    updateParams();
  }
  
  function updateCompressor(value: number) {
    effectParams.compressorThreshold = value;
    updateParams();
  }
  
  // サンプルパッド（将来の実装用）
  const samples = [
    { name: 'Kick', key: 'C2' },
    { name: 'Snare', key: 'D2' },
    { name: 'HiHat', key: 'E2' },
    { name: 'Clap', key: 'F2' },
  ];
  
  function triggerSample(index: number) {
    // TODO: サンプラー機能の実装
    console.log(`Trigger sample ${index}: ${samples[index].name}`);
  }
</script>

<div class="audio-effects">
  <h3>Audio Effects</h3>
  
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
      <div class="effect-section {effectParams.filterEnabled ? '' : 'disabled'}">
        <div class="effect-header">
          <h4>Filter</h4>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              bind:checked={effectParams.filterEnabled}
              on:change={updateParams}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <select 
          value={effectParams.filterType} 
          on:change={(e) => updateFilterType(e.currentTarget.value as BiquadFilterType)}
          disabled={!effectParams.filterEnabled}
        >
          <option value="lowpass">Low Pass</option>
          <option value="highpass">High Pass</option>
          <option value="bandpass">Band Pass</option>
          <option value="notch">Notch</option>
        </select>
        <div class="control">
          <label>Frequency: {effectParams.filterFreq}Hz</label>
          <input 
            type="range" 
            min="20" 
            max="20000" 
            step="10" 
            value={effectParams.filterFreq} 
            on:input={(e) => updateFilterFreq(Number(e.currentTarget.value))}
            disabled={!effectParams.filterEnabled}
          />
        </div>
      </div>
      
      <!-- ディレイ -->
      <div class="effect-section {effectParams.delayEnabled ? '' : 'disabled'}">
        <div class="effect-header">
          <h4>Delay</h4>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              bind:checked={effectParams.delayEnabled}
              on:change={updateParams}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="control">
          <label>Time: {effectParams.delayTime}s</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={effectParams.delayTime} 
            on:input={(e) => updateDelayTime(Number(e.currentTarget.value))}
            disabled={!effectParams.delayEnabled}
          />
        </div>
        <div class="control">
          <label>Feedback: {(effectParams.delayFeedback * 100).toFixed(0)}%</label>
          <input 
            type="range" 
            min="0" 
            max="0.9" 
            step="0.01" 
            value={effectParams.delayFeedback} 
            on:input={(e) => updateDelayFeedback(Number(e.currentTarget.value))}
            disabled={!effectParams.delayEnabled}
          />
        </div>
      </div>
      
      <!-- リバーブ -->
      <div class="effect-section {effectParams.reverbEnabled ? '' : 'disabled'}">
        <div class="effect-header">
          <h4>Reverb</h4>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              bind:checked={effectParams.reverbEnabled}
              on:change={updateParams}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="control">
          <label>Mix: {(effectParams.reverbMix * 100).toFixed(0)}%</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={effectParams.reverbMix} 
            on:input={(e) => updateReverbMix(Number(e.currentTarget.value))}
            disabled={!effectParams.reverbEnabled}
          />
        </div>
      </div>
      
      <!-- ディストーション -->
      <div class="effect-section {effectParams.distortionEnabled ? '' : 'disabled'}">
        <div class="effect-header">
          <h4>Distortion</h4>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              bind:checked={effectParams.distortionEnabled}
              on:change={updateParams}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="control">
          <label>Amount: {(effectParams.distortionAmount * 100).toFixed(0)}%</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={effectParams.distortionAmount} 
            on:input={(e) => updateDistortion(Number(e.currentTarget.value))}
            disabled={!effectParams.distortionEnabled}
          />
        </div>
      </div>
      
      <!-- コンプレッサー -->
      <div class="effect-section {effectParams.compressorEnabled ? '' : 'disabled'}">
        <div class="effect-header">
          <h4>Compressor</h4>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              bind:checked={effectParams.compressorEnabled}
              on:change={updateParams}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="control">
          <label>Threshold: {effectParams.compressorThreshold}dB</label>
          <input 
            type="range" 
            min="-60" 
            max="0" 
            step="1" 
            value={effectParams.compressorThreshold} 
            on:input={(e) => updateCompressor(Number(e.currentTarget.value))}
            disabled={!effectParams.compressorEnabled}
          />
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
</div>

<style>
  .audio-effects {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
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
    overflow-x: hidden;
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
    margin: 0;
    font-size: 0.9rem;
    color: #999;
  }
  
  .effect-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  /* トグルスイッチ */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #3a3a3a;
    transition: 0.3s;
    border-radius: 20px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-slider {
    background-color: #4a9eff;
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }
  
  /* 無効化されたセクション */
  .effect-section.disabled {
    opacity: 0.5;
  }
  
  .effect-section.disabled .control {
    pointer-events: none;
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
    width: calc(100% - 2px);
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
</style>