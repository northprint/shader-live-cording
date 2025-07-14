<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { databaseManager, presets, refreshPresets } from '../../stores/databaseStore';
  import type { Preset } from '../../lib/database/DatabaseManager';
  import type { ShaderProgram } from '../../types/shader';
  
  export let isOpen = false;
  export let mode: 'save' | 'load' = 'load';
  export let currentShader: ShaderProgram | null = null;
  
  const dispatch = createEventDispatcher();
  
  let presetName = '';
  let selectedPresetId: number | null = null;
  
  async function handleSave() {
    if (!currentShader || !presetName.trim()) return;
    
    try {
      const preset: Preset = {
        name: presetName,
        shader_code: currentShader.fragmentShader,
        language: currentShader.language,
        uniforms: JSON.stringify(currentShader.uniforms)
      };
      
      await databaseManager.savePreset(preset);
      await refreshPresets();
      
      presetName = '';
      dispatch('close');
      dispatch('saved');
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }
  
  async function handleLoad() {
    if (selectedPresetId === null) return;
    
    try {
      const preset = await databaseManager.loadPreset(selectedPresetId);
      if (preset) {
        dispatch('load', preset);
        dispatch('close');
      }
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  }
  
  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this preset?')) {
      try {
        await databaseManager.deletePreset(id);
        await refreshPresets();
      } catch (error) {
        console.error('Failed to delete preset:', error);
      }
    }
  }
  
  function handleClose() {
    dispatch('close');
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{mode === 'save' ? 'Save Preset' : 'Load Preset'}</h2>
        <button class="close-button" on:click={handleClose}>×</button>
      </div>
      
      <div class="modal-body">
        {#if mode === 'save'}
          <div class="form-group">
            <label for="preset-name">Preset Name</label>
            <input
              id="preset-name"
              type="text"
              bind:value={presetName}
              placeholder="Enter preset name..."
            />
          </div>
          <button class="action-button primary" on:click={handleSave}>
            Save Preset
          </button>
        {:else}
          <div class="preset-list">
            {#each $presets as preset}
              <div 
                class="preset-item"
                class:selected={selectedPresetId === preset.id}
                on:click={() => selectedPresetId = preset.id}
              >
                <div class="preset-info">
                  <h3>{preset.name}</h3>
                  <span class="preset-language">{preset.language}</span>
                </div>
                <button 
                  class="delete-button"
                  on:click|stopPropagation={() => preset.id && handleDelete(preset.id)}
                >
                  Delete
                </button>
              </div>
            {/each}
          </div>
          <button 
            class="action-button primary" 
            on:click={handleLoad}
            disabled={selectedPresetId === null}
          >
            Load Preset
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
  }
  
  .close-button:hover {
    color: #fff;
  }
  
  .modal-body {
    padding: 1rem;
    overflow-y: auto;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
  }
  
  .preset-list {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 1rem;
  }
  
  .preset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .preset-item:hover {
    background-color: #3a3a3a;
  }
  
  .preset-item.selected {
    background-color: #4a4a4a;
    border-color: #5a5a5a;
  }
  
  .preset-info h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: normal;
  }
  
  .preset-language {
    font-size: 0.8rem;
    color: #888;
    background-color: #1a1a1a;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    margin-top: 0.25rem;
    display: inline-block;
  }
  
  .delete-button {
    padding: 0.25rem 0.5rem;
    background-color: #ff4444;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    opacity: 0.8;
  }
  
  .delete-button:hover {
    opacity: 1;
  }
  
  .action-button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .action-button.primary {
    background-color: #4a9eff;
    color: #fff;
  }
  
  .action-button:hover:not(:disabled) {
    opacity: 0.8;
  }
  
  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>