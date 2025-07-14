<script lang="ts">
  import { defaultShortcuts } from '../../lib/keyboard/keyboardShortcuts';
  
  export let isOpen = false;
  
  function formatShortcut(shortcut: typeof defaultShortcuts[0]): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  }
</script>

{#if isOpen}
  <div class="keyboard-help-overlay" on:click={() => isOpen = false}>
    <div class="keyboard-help" on:click|stopPropagation>
      <h2>Keyboard Shortcuts</h2>
      
      <div class="shortcuts-list">
        {#each defaultShortcuts as shortcut}
          <div class="shortcut-item">
            <span class="shortcut-key">{formatShortcut(shortcut)}</span>
            <span class="shortcut-description">{shortcut.description}</span>
          </div>
        {/each}
        
        <div class="section-title">VJ Mode</div>
        <div class="shortcut-item">
          <span class="shortcut-key">Ctrl + E</span>
          <span class="shortcut-description">Toggle Live Coding (VJ Mode only)</span>
        </div>
      </div>
      
      <button class="close-button" on:click={() => isOpen = false}>Close</button>
    </div>
  </div>
{/if}

<style>
  .keyboard-help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  .keyboard-help {
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    color: #fff;
  }
  
  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  
  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #2a2a2a;
    border-radius: 4px;
  }
  
  .shortcut-key {
    font-family: monospace;
    font-size: 0.9rem;
    color: #4a9eff;
    background-color: #1a1a1a;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
  }
  
  .shortcut-description {
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .close-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #3a3a3a;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: #4a4a4a;
  }
  
  .section-title {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #4a9eff;
    text-transform: uppercase;
  }
</style>