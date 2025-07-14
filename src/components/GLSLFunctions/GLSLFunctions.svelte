<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { glslFunctions, raymarchingTemplate, noiseTemplate } from '../../lib/shaders/glslFunctions';
  import type { GLSLFunction } from '../../lib/shaders/glslFunctions';
  
  const dispatch = createEventDispatcher();
  
  let selectedCategory: string = 'all';
  let searchQuery = '';
  let showPreview = false;
  let previewFunction: GLSLFunction | null = null;
  
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'sdf', label: 'Distance Functions' },
    { value: 'noise', label: 'Noise' },
    { value: 'util', label: 'Utilities' },
    { value: 'raymarching', label: 'Raymarching' },
    { value: 'color', label: 'Color' },
    { value: 'transform', label: 'Transform' }
  ];
  
  $: filteredFunctions = glslFunctions.filter(func => {
    const matchesCategory = selectedCategory === 'all' || func.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      func.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  function insertFunction(func: GLSLFunction) {
    dispatch('insertCode', func.code);
  }
  
  function loadTemplate(template: string) {
    dispatch('loadTemplate', template);
  }
  
  function showFunctionPreview(func: GLSLFunction) {
    previewFunction = func;
    showPreview = true;
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="glsl-functions">
  <h3>GLSL Functions</h3>
  
  <div class="controls">
    <input
      type="text"
      placeholder="Search functions..."
      bind:value={searchQuery}
      class="search-input"
    />
    
    <select bind:value={selectedCategory} class="category-select">
      {#each categories as category}
        <option value={category.value}>{category.label}</option>
      {/each}
    </select>
  </div>
  
  <div class="templates">
    <h4>Templates</h4>
    <button class="template-button" on:click={() => loadTemplate(raymarchingTemplate)}>
      Raymarching Scene
    </button>
    <button class="template-button" on:click={() => loadTemplate(noiseTemplate)}>
      Noise Pattern
    </button>
  </div>
  
  <div class="function-list">
    {#each filteredFunctions as func}
      <div class="function-item">
        <div class="function-header">
          <span class="function-name">{func.name}</span>
          <span class="function-category">{func.category}</span>
        </div>
        <div class="function-description">{func.description}</div>
        <div class="function-actions">
          <button on:click={() => insertFunction(func)} title="Insert at cursor">
            Insert
          </button>
          <button on:click={() => showFunctionPreview(func)} title="Preview code">
            Preview
          </button>
          <button on:click={() => copyToClipboard(func.code)} title="Copy to clipboard">
            Copy
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showPreview && previewFunction}
  <div class="preview-overlay" on:click={() => showPreview = false}>
    <div class="preview-content" on:click|stopPropagation>
      <div class="preview-header">
        <h3>{previewFunction.name}</h3>
        <button class="close-button" on:click={() => showPreview = false}>×</button>
      </div>
      <pre class="preview-code">{previewFunction.code}</pre>
      <div class="preview-actions">
        <button on:click={() => { insertFunction(previewFunction); showPreview = false; }}>
          Insert
        </button>
        <button on:click={() => copyToClipboard(previewFunction.code)}>
          Copy
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .glsl-functions {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
  }
  
  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #ccc;
  }
  
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .search-input {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .category-select {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .templates {
    margin-bottom: 1.5rem;
  }
  
  .templates h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #999;
  }
  
  .template-button {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: #3a3a3a;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
  }
  
  .template-button:hover {
    background-color: #4a4a4a;
  }
  
  .function-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .function-item {
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    padding: 0.75rem;
  }
  
  .function-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .function-name {
    font-family: monospace;
    font-size: 0.9rem;
    color: #4a9eff;
  }
  
  .function-category {
    font-size: 0.75rem;
    color: #666;
    background-color: #1a1a1a;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
  }
  
  .function-description {
    font-size: 0.85rem;
    color: #999;
    margin-bottom: 0.5rem;
  }
  
  .function-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .function-actions button {
    padding: 0.25rem 0.5rem;
    background-color: #3a3a3a;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .function-actions button:hover {
    background-color: #4a4a4a;
  }
  
  /* Preview Modal */
  .preview-overlay {
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
  
  .preview-content {
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .preview-header h3 {
    margin: 0;
    font-family: monospace;
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
  
  .preview-code {
    flex: 1;
    margin: 0;
    padding: 1rem;
    background-color: #0a0a0a;
    color: #fff;
    font-family: monospace;
    font-size: 0.9rem;
    overflow: auto;
    white-space: pre;
  }
  
  .preview-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #3a3a3a;
  }
  
  .preview-actions button {
    flex: 1;
    padding: 0.5rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .preview-actions button:hover {
    opacity: 0.8;
  }
</style>