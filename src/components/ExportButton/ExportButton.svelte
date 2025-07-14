<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ExportModal from '../ExportModal/ExportModal.svelte';
  import type { ExportManager } from '../../lib/export/ExportManager';

  export let exportManager: ExportManager;
  export let fragmentShaderCode: string = '';
  export let audioBuffer: AudioBuffer | null = null;
  export let audioContext: AudioContext | null = null;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  let exportModal: ExportModal;
  let showTooltip = false;

  function handleClick() {
    if (!disabled && exportModal) {
      exportModal.open();
    }
  }

  function handleExportSuccess(event: CustomEvent) {
    dispatch('export-success', event.detail);
  }

  function handleExportError(event: CustomEvent) {
    dispatch('export-error', event.detail);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Ctrl/Cmd + E でエクスポートモーダルを開く
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="export-button-container">
  <button
    class="export-button"
    on:click={handleClick}
    on:mouseenter={() => showTooltip = true}
    on:mouseleave={() => showTooltip = false}
    {disabled}
    aria-label="エクスポート"
  >
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
      stroke-linecap="round" 
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    <span>エクスポート</span>
  </button>

  {#if showTooltip && !disabled}
    <div class="tooltip">
      エクスポート (Ctrl/Cmd + E)
    </div>
  {/if}
</div>

<ExportModal
  bind:this={exportModal}
  {exportManager}
  {fragmentShaderCode}
  {audioBuffer}
  {audioContext}
  on:export-success={handleExportSuccess}
  on:export-error={handleExportError}
/>

<style>
  .export-button-container {
    position: relative;
    display: inline-block;
  }

  .export-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #0084ff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .export-button:hover:not(:disabled) {
    background: #0066cc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 132, 255, 0.3);
  }

  .export-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 132, 255, 0.3);
  }

  .export-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-button svg {
    width: 18px;
    height: 18px;
  }

  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    animation: fadeIn 0.2s ease forwards;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid rgba(0, 0, 0, 0.9);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-8px);
    }
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .export-button {
      padding: 8px 12px;
      font-size: 13px;
    }

    .export-button svg {
      width: 16px;
      height: 16px;
    }

    .export-button span {
      display: none;
    }
  }
</style>