<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AudioAnalyzerWithEffectsSimple from '../AudioAnalyzer/AudioAnalyzerWithEffectsSimple.svelte';
  import PresetModal from '../PresetModal/PresetModal.svelte';
  import AudioEffectsPanel from '../AudioEffects/AudioEffectsPanel.svelte';
  import GLSLFunctions from '../GLSLFunctions/GLSLFunctions.svelte';
  import type { ShaderProgram } from '../../types/shader';
  
  export let isPlaying = true;
  export let fps = 0;
  export let shaderProgram: ShaderProgram | null = null;
  
  const dispatch = createEventDispatcher();
  
  let presetModalOpen = false;
  let presetModalMode: 'save' | 'load' = 'load';
  
  // エフェクトパラメータ
  let effectParams = {
    filterFreq: 1000,
    filterType: 'lowpass' as BiquadFilterType,
    filterEnabled: false,  // デフォルトでOFF
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
  
  function togglePlayPause() {
    isPlaying = !isPlaying;
    dispatch('playStateChange', isPlaying);
  }
  
  function handleReset() {
    dispatch('reset');
  }
  
  function handleSave() {
    dispatch('save');
  }
  
  function handleLoad() {
    dispatch('load');
  }
  
  function openSavePreset() {
    presetModalMode = 'save';
    presetModalOpen = true;
  }
  
  function openLoadPreset() {
    presetModalMode = 'load';
    presetModalOpen = true;
  }
  
  function handlePresetLoad(event: CustomEvent) {
    dispatch('presetLoad', event.detail);
  }
  
  function handleInsertCode(event: CustomEvent<string>) {
    dispatch('insertCode', event.detail);
  }
  
  function handleLoadTemplate(event: CustomEvent<string>) {
    dispatch('loadTemplate', event.detail);
  }
  
  function handleEffectUpdate(event: CustomEvent) {
    console.log('Controls: Effect update received:', event.detail);
    effectParams = event.detail;
  }
</script>

<div class="controls-container">
  <div class="section">
    <h3>Playback</h3>
    <div class="control-group">
      <button class="control-button" on:click={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button class="control-button" on:click={handleReset}>
        Reset
      </button>
    </div>
    <div class="info">
      <span>FPS: {fps.toFixed(1)}</span>
    </div>
  </div>
  
  <div class="section">
    <h3>Presets</h3>
    <div class="control-group">
      <button class="control-button" on:click={openSavePreset}>
        Save Preset
      </button>
      <button class="control-button" on:click={openLoadPreset}>
        Load Preset
      </button>
    </div>
  </div>
  
  <div class="section">
    <h3>Project</h3>
    <div class="control-group">
      <button class="control-button" on:click={handleSave}>
        Save
      </button>
      <button class="control-button" on:click={handleLoad}>
        Load
      </button>
    </div>
  </div>
  
  <div class="section">
    <h3>Audio</h3>
    <AudioAnalyzerWithEffectsSimple {isPlaying} bind:effectParams />
  </div>
  
  <div class="section">
    <GLSLFunctions 
      on:insertCode={handleInsertCode}
      on:loadTemplate={handleLoadTemplate}
    />
  </div>
  
  <div class="section">
    <AudioEffectsPanel bind:effectParams on:updateEffects={handleEffectUpdate} />
  </div>
</div>

<PresetModal
  isOpen={presetModalOpen}
  mode={presetModalMode}
  currentShader={shaderProgram}
  on:close={() => presetModalOpen = false}
  on:load={handlePresetLoad}
/>

<style>
  .controls-container {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .section {
    margin-bottom: 2rem;
  }
  
  .section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    color: #cccccc;
  }
  
  .control-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .control-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background-color: #2a2a2a;
    color: #ffffff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .control-button:hover:not(:disabled) {
    background-color: #3a3a3a;
  }
  
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .info {
    font-size: 0.85rem;
    color: #888888;
  }
</style>