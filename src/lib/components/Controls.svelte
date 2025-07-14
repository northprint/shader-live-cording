<script lang="ts">
  let isPlaying = true;
  let selectedLanguage = 'glsl';
  
  function togglePlayPause() {
    isPlaying = !isPlaying;
  }
  
  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedLanguage = target.value;
  }
</script>

<div class="controls">
  <button on:click={togglePlayPause}>
    {isPlaying ? 'Pause' : 'Play'}
  </button>
  
  <select value={selectedLanguage} on:change={handleLanguageChange}>
    <option value="glsl">GLSL</option>
    <option value="wgsl">WGSL</option>
  </select>
  
  <button>Load Audio</button>
</div>

<style>
  .controls {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: #1a1a1a;
    border-top: 1px solid #2a2a2a;
  }
  
  select {
    background-color: #2a2a2a;
    color: #e0e0e0;
    border: 1px solid #3a3a3a;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
  }
</style>