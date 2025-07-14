<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ExportManager } from '../../lib/export/ExportManager';
  import type { 
    ImageExportOptions, 
    VideoExportOptions, 
    HTMLExportOptions,
    ExportResult 
  } from '../../lib/export/types';

  export let exportManager: ExportManager;
  export let fragmentShaderCode: string = '';
  export let audioBuffer: AudioBuffer | null = null;
  export let audioContext: AudioContext | null = null;

  const dispatch = createEventDispatcher();

  // モーダルの状態
  let isOpen = false;
  let activeTab: 'image' | 'video' | 'html' = 'image';
  let isExporting = false;
  let exportProgress = 0;
  let exportMessage = '';
  let exportError = '';

  // 画像エクスポート設定
  let imageFormat: 'png' | 'jpg' = 'png';
  let imageQuality = 0.9;
  let imageResolutionPreset: 'current' | '1080p' | '4k' | 'custom' = 'current';
  let customWidth = 1920;
  let customHeight = 1080;

  // ビデオエクスポート設定
  let videoDuration = 10; // 秒
  let videoFPS: 25 | 30 | 60 = 30;
  let videoBitrate = 8000000; // 8Mbps
  let includeAudioSync = false;
  let isRecording = false;
  let recordingTimeLeft = 0;
  let recordingInterval: number | null = null;

  // HTMLエクスポート設定
  let includeAudioVisualization = false;
  let minifyCode = false;

  // 解像度プリセット
  const resolutionPresets = {
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };

  export function open() {
    isOpen = true;
    exportError = '';
    exportMessage = '';
  }

  export function close() {
    isOpen = false;
    if (isRecording) {
      stopVideoRecording();
    }
  }

  function handleTabChange(tab: 'image' | 'video' | 'html') {
    if (isExporting || isRecording) return;
    activeTab = tab;
    exportError = '';
    exportMessage = '';
  }

  function getImageResolution(): { width: number; height: number } {
    switch (imageResolutionPreset) {
      case 'current':
        const canvas = exportManager['canvas'];
        return { width: canvas.width, height: canvas.height };
      case '1080p':
        return resolutionPresets['1080p'];
      case '4k':
        return resolutionPresets['4k'];
      case 'custom':
        return { width: customWidth, height: customHeight };
    }
  }

  async function exportImage() {
    if (isExporting) return;

    isExporting = true;
    exportError = '';
    exportMessage = 'エクスポート中...';
    exportProgress = 0;

    try {
      const resolution = getImageResolution();
      const options: ImageExportOptions = {
        format: imageFormat,
        quality: imageFormat === 'jpg' ? imageQuality : undefined,
        width: resolution.width,
        height: resolution.height,
        filename: `shader-export-${Date.now()}.${imageFormat}`
      };

      // 高解像度エクスポートの場合
      let result: ExportResult;
      if (imageResolutionPreset !== 'current') {
        exportProgress = 30;
        result = await exportManager.exportHighResImage(
          resolution.width,
          resolution.height,
          options
        );
      } else {
        result = await exportManager.exportImage(options);
      }

      exportProgress = 100;

      if (result.success) {
        exportMessage = `画像を正常にエクスポートしました: ${result.filename}`;
        dispatch('export-success', { type: 'image', result });
      } else {
        throw new Error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      exportError = error instanceof Error ? error.message : 'エクスポート中にエラーが発生しました';
      dispatch('export-error', { type: 'image', error: exportError });
    } finally {
      isExporting = false;
      setTimeout(() => {
        exportProgress = 0;
      }, 1000);
    }
  }

  async function startVideoRecording() {
    if (isRecording || isExporting) return;

    isRecording = true;
    exportError = '';
    exportMessage = '録画を開始しています...';
    recordingTimeLeft = videoDuration;

    try {
      const options: VideoExportOptions = {
        format: 'webm',
        duration: videoDuration * 1000, // ミリ秒に変換
        fps: videoFPS,
        videoBitsPerSecond: videoBitrate,
        filename: `shader-video-${Date.now()}.webm`,
        includeAudio: includeAudioSync && audioBuffer !== null
      };

      if (includeAudioSync && audioBuffer && audioContext) {
        // 音楽同期録画
        const audioSyncOptions = {
          ...options,
          audioBuffer,
          audioContext
        };
        await exportManager.recordWithAudio(audioSyncOptions);
      } else {
        // 通常の録画
        await exportManager.startVideoRecording(options);
      }

      exportMessage = '録画中...';

      // カウントダウンタイマー
      recordingInterval = window.setInterval(() => {
        recordingTimeLeft--;
        if (recordingTimeLeft <= 0) {
          stopVideoRecording();
        }
      }, 1000);

    } catch (error) {
      isRecording = false;
      exportError = error instanceof Error ? error.message : '録画の開始に失敗しました';
      dispatch('export-error', { type: 'video', error: exportError });
    }
  }

  async function stopVideoRecording() {
    if (!isRecording) return;

    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }

    exportMessage = '録画を終了しています...';

    try {
      const result = await exportManager.stopVideoRecording();
      
      if (result.success) {
        exportMessage = `動画を正常にエクスポートしました: ${result.filename}`;
        dispatch('export-success', { type: 'video', result });
      } else {
        throw new Error(result.error || '録画の保存に失敗しました');
      }
    } catch (error) {
      exportError = error instanceof Error ? error.message : '録画の終了に失敗しました';
      dispatch('export-error', { type: 'video', error: exportError });
    } finally {
      isRecording = false;
      recordingTimeLeft = 0;
    }
  }

  async function exportHTML() {
    if (isExporting) return;

    isExporting = true;
    exportError = '';
    exportMessage = 'HTMLをエクスポート中...';
    exportProgress = 0;

    try {
      const options: HTMLExportOptions = {
        includeAudio: includeAudioVisualization,
        minify: minifyCode,
        filename: `shader-export-${Date.now()}.html`
      };

      exportProgress = 50;

      const result = includeAudioVisualization
        ? await exportManager.exportHTMLWithAudio(fragmentShaderCode, {
            ...options,
            audioVisualization: true
          })
        : await exportManager.exportHTML(fragmentShaderCode, options);

      exportProgress = 100;

      if (result.success) {
        exportMessage = `HTMLを正常にエクスポートしました: ${result.filename}`;
        dispatch('export-success', { type: 'html', result });
      } else {
        throw new Error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      exportError = error instanceof Error ? error.message : 'エクスポート中にエラーが発生しました';
      dispatch('export-error', { type: 'html', error: exportError });
    } finally {
      isExporting = false;
      setTimeout(() => {
        exportProgress = 0;
      }, 1000);
    }
  }

  function handleExport() {
    switch (activeTab) {
      case 'image':
        exportImage();
        break;
      case 'video':
        if (isRecording) {
          stopVideoRecording();
        } else {
          startVideoRecording();
        }
        break;
      case 'html':
        exportHTML();
        break;
    }
  }

  // ESCキーでモーダルを閉じる
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && !isExporting && !isRecording) {
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  });
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={close}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>エクスポート</h2>
        <button class="close-button" on:click={close} disabled={isExporting || isRecording}>
          ✕
        </button>
      </div>

      <div class="tabs">
        <button 
          class="tab" 
          class:active={activeTab === 'image'}
          on:click={() => handleTabChange('image')}
          disabled={isExporting || isRecording}
        >
          画像
        </button>
        <button 
          class="tab" 
          class:active={activeTab === 'video'}
          on:click={() => handleTabChange('video')}
          disabled={isExporting || isRecording}
        >
          動画
        </button>
        <button 
          class="tab" 
          class:active={activeTab === 'html'}
          on:click={() => handleTabChange('html')}
          disabled={isExporting || isRecording}
        >
          HTML
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'image'}
          <div class="export-options">
            <div class="option-group">
              <label>フォーマット</label>
              <div class="radio-group">
                <label>
                  <input type="radio" bind:group={imageFormat} value="png" />
                  PNG (高品質)
                </label>
                <label>
                  <input type="radio" bind:group={imageFormat} value="jpg" />
                  JPEG
                </label>
              </div>
            </div>

            {#if imageFormat === 'jpg'}
              <div class="option-group">
                <label for="quality">品質: {Math.round(imageQuality * 100)}%</label>
                <input 
                  id="quality"
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  bind:value={imageQuality}
                />
              </div>
            {/if}

            <div class="option-group">
              <label>解像度</label>
              <div class="radio-group">
                <label>
                  <input type="radio" bind:group={imageResolutionPreset} value="current" />
                  現在のサイズ
                </label>
                <label>
                  <input type="radio" bind:group={imageResolutionPreset} value="1080p" />
                  1080p (1920×1080)
                </label>
                <label>
                  <input type="radio" bind:group={imageResolutionPreset} value="4k" />
                  4K (3840×2160)
                </label>
                <label>
                  <input type="radio" bind:group={imageResolutionPreset} value="custom" />
                  カスタム
                </label>
              </div>
            </div>

            {#if imageResolutionPreset === 'custom'}
              <div class="option-group">
                <div class="resolution-inputs">
                  <input 
                    type="number" 
                    min="1" 
                    max="8192" 
                    bind:value={customWidth}
                    placeholder="幅"
                  />
                  <span>×</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="8192" 
                    bind:value={customHeight}
                    placeholder="高さ"
                  />
                </div>
              </div>
            {/if}
          </div>

        {:else if activeTab === 'video'}
          <div class="export-options">
            <div class="option-group">
              <label for="duration">録画時間: {videoDuration}秒</label>
              <input 
                id="duration"
                type="range" 
                min="1" 
                max="300" 
                step="1" 
                bind:value={videoDuration}
                disabled={isRecording}
              />
            </div>

            <div class="option-group">
              <label>FPS</label>
              <div class="radio-group">
                <label>
                  <input type="radio" bind:group={videoFPS} value={25} disabled={isRecording} />
                  25 FPS
                </label>
                <label>
                  <input type="radio" bind:group={videoFPS} value={30} disabled={isRecording} />
                  30 FPS
                </label>
                <label>
                  <input type="radio" bind:group={videoFPS} value={60} disabled={isRecording} />
                  60 FPS
                </label>
              </div>
            </div>

            <div class="option-group">
              <label for="bitrate">ビットレート: {(videoBitrate / 1000000).toFixed(1)} Mbps</label>
              <input 
                id="bitrate"
                type="range" 
                min="1000000" 
                max="20000000" 
                step="1000000" 
                bind:value={videoBitrate}
                disabled={isRecording}
              />
            </div>

            {#if audioBuffer}
              <div class="option-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    bind:checked={includeAudioSync}
                    disabled={isRecording}
                  />
                  音楽と同期
                </label>
              </div>
            {/if}

            {#if isRecording}
              <div class="recording-status">
                <div class="recording-indicator"></div>
                <span>録画中... 残り {recordingTimeLeft}秒</span>
              </div>
            {/if}
          </div>

        {:else if activeTab === 'html'}
          <div class="export-options">
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={includeAudioVisualization} />
                音楽ビジュアライゼーションを含める
              </label>
            </div>

            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={minifyCode} />
                コードを圧縮
              </label>
            </div>

            <div class="info-text">
              シェーダーコードを含む単一のHTMLファイルとしてエクスポートします。
              Webブラウザで直接開いて実行できます。
            </div>
          </div>
        {/if}
      </div>

      {#if exportProgress > 0 && exportProgress < 100}
        <div class="progress-bar">
          <div class="progress-fill" style="width: {exportProgress}%"></div>
        </div>
      {/if}

      {#if exportMessage}
        <div class="message success">{exportMessage}</div>
      {/if}

      {#if exportError}
        <div class="message error">{exportError}</div>
      {/if}

      <div class="modal-footer">
        <button 
          class="button cancel" 
          on:click={close}
          disabled={isExporting || isRecording}
        >
          キャンセル
        </button>
        <button 
          class="button primary" 
          on:click={handleExport}
          disabled={isExporting || (activeTab === 'video' && isRecording && recordingTimeLeft > 0)}
        >
          {#if activeTab === 'video'}
            {isRecording ? '録画を停止' : '録画を開始'}
          {:else}
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #1e1e1e;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #333;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    color: #fff;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-button:hover:not(:disabled) {
    background: #333;
    color: #fff;
  }

  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #333;
    background: #1a1a1a;
  }

  .tab {
    flex: 1;
    padding: 12px 20px;
    background: none;
    border: none;
    color: #999;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .tab:hover:not(:disabled) {
    color: #fff;
    background: #2a2a2a;
  }

  .tab.active {
    color: #fff;
    background: #1e1e1e;
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #0084ff;
  }

  .tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .export-options {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .option-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-group label {
    color: #ccc;
    font-size: 14px;
    font-weight: 500;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .radio-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #aaa;
    font-weight: normal;
    cursor: pointer;
  }

  .radio-group input[type="radio"] {
    cursor: pointer;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #aaa;
    font-weight: normal;
    cursor: pointer;
  }

  input[type="range"] {
    width: 100%;
    height: 4px;
    background: #333;
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #0084ff;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input[type="range"]:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .resolution-inputs {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .resolution-inputs input[type="number"] {
    flex: 1;
    padding: 8px 12px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    font-size: 14px;
  }

  .resolution-inputs span {
    color: #666;
  }

  .info-text {
    padding: 12px;
    background: #2a2a2a;
    border-radius: 4px;
    color: #aaa;
    font-size: 13px;
    line-height: 1.5;
  }

  .recording-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 4px;
    color: #ff6b6b;
  }

  .recording-indicator {
    width: 12px;
    height: 12px;
    background: #ff0000;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  .progress-bar {
    height: 4px;
    background: #333;
    overflow: hidden;
    margin: 0 20px;
  }

  .progress-fill {
    height: 100%;
    background: #0084ff;
    transition: width 0.3s ease;
  }

  .message {
    margin: 12px 20px 0;
    padding: 12px;
    border-radius: 4px;
    font-size: 14px;
  }

  .message.success {
    background: rgba(0, 200, 0, 0.1);
    border: 1px solid rgba(0, 200, 0, 0.3);
    color: #4caf50;
  }

  .message.error {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #333;
  }

  .button {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button.cancel {
    background: #333;
    color: #aaa;
  }

  .button.cancel:hover:not(:disabled) {
    background: #444;
    color: #fff;
  }

  .button.primary {
    background: #0084ff;
    color: #fff;
  }

  .button.primary:hover:not(:disabled) {
    background: #0066cc;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>