<script lang="ts">
  import { onMount } from 'svelte';
  import type { ShaderProgram, ShaderLanguage } from './types/shader';
  import Preview from './components/Preview/Preview.svelte';
  import Editor from './components/Editor/Editor.svelte';
  import Controls from './components/Controls/Controls.svelte';
  import ResizablePane from './components/ResizablePane/ResizablePane.svelte';
  import VJMode from './components/VJMode/VJMode.svelte';
  import KeyboardHelp from './components/KeyboardHelp/KeyboardHelp.svelte';
  import { ProjectModal } from './components/ProjectModal';
  import ExportButton from './components/ExportButton/ExportButton.svelte';
  import { audioReactiveShaders } from './lib/shaders/audioReactiveShaders';
  import { initializeDatabase, presets } from './stores/databaseStore';
  import { isVJMode } from './stores/vjModeStore';
  import { renderMode, defaultGLSLCode, defaultP5Code } from './stores/renderModeStore';
  import { KeyboardShortcutManager, defaultShortcuts } from './lib/keyboard/keyboardShortcuts';
  import type { Preset } from './lib/database/DatabaseManager';
  import { ExportManager } from './lib/export/ExportManager';
  
  let shaderProgram: ShaderProgram = {
    id: 'default',
    name: 'Default Shader',
    language: 'glsl',
    vertexShader: defaultGLSLCode.vertex,
    fragmentShader: defaultGLSLCode.fragment,
    uniforms: [],
    lastModified: new Date()
  };
  
  // P5.jsモード用のコード
  let p5Code = defaultP5Code;
  
  let selectedLanguage: ShaderLanguage = 'glsl';
  let isPlaying = true;
  let fps = 0;
  let showKeyboardHelp = false;
  let editorRef: any;
  let showProjectModal = false;
  let projectModalMode: 'save' | 'load' = 'save';
  let previewRef: any;
  let exportManager: ExportManager;
  let audioBuffer: AudioBuffer | null = null;
  let audioContext: AudioContext | null = null;
  
  const shortcutManager = new KeyboardShortcutManager();
  
  function handlePlayStateChange(event: CustomEvent<boolean>) {
    isPlaying = event.detail;
  }
  
  function handleReset() {
    // タイムリセットなどの処理
    console.log('Reset shader');
  }
  
  function handleSave() {
    projectModalMode = 'save';
    showProjectModal = true;
  }
  
  function handleLoad() {
    projectModalMode = 'load';
    showProjectModal = true;
  }
  
  function handleProjectSaved(event: CustomEvent) {
    console.log('Project saved:', event.detail);
  }
  
  function handleProjectLoaded(event: CustomEvent) {
    console.log('Project loaded:', event.detail);
    // プロジェクトデータをアプリケーションに反映
    if (event.detail.shaderCode) {
      shaderProgram.fragmentShader = event.detail.shaderCode;
      shaderProgram.lastModified = new Date();
    }
  }
  
  function handleShaderPresetChange(event: Event) {
    const preset = (event.target as HTMLSelectElement).value;
    
    if (preset === 'default') {
      shaderProgram.fragmentShader = `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}`;
    } else if (preset && preset in audioReactiveShaders) {
      shaderProgram.fragmentShader = audioReactiveShaders[preset as keyof typeof audioReactiveShaders];
    }
    
    shaderProgram.lastModified = new Date();
  }
  
  function handlePresetLoad(event: CustomEvent<Preset>) {
    const preset = event.detail;
    shaderProgram.fragmentShader = preset.shader_code;
    shaderProgram.language = preset.language as ShaderLanguage;
    shaderProgram.lastModified = new Date();
    
    if (preset.uniforms) {
      try {
        shaderProgram.uniforms = JSON.parse(preset.uniforms);
      } catch (e) {
        console.error('Failed to parse preset uniforms:', e);
      }
    }
  }
  
  function handleInsertCode(event: CustomEvent<string>) {
    console.log('handleInsertCode called', { editorRef, code: event.detail });
    if (editorRef?.insertCode) {
      editorRef.insertCode(event.detail);
    } else {
      console.error('Editor ref not available or insertCode method missing');
    }
  }
  
  function handleLoadTemplate(event: CustomEvent<string>) {
    console.log('handleLoadTemplate called', { editorRef, template: event.detail });
    if (editorRef?.replaceAllCode) {
      editorRef.replaceAllCode(event.detail);
      shaderProgram.fragmentShader = event.detail;
      shaderProgram.lastModified = new Date();
    } else {
      console.error('Editor ref not available or replaceAllCode method missing');
    }
  }
  
  onMount(() => {
    initializeDatabase();
    
    // ExportManagerの初期化は、previewRefが利用可能になった後に行う
    const initExportManager = () => {
      if (previewRef?.getCanvas && previewRef?.renderFrame) {
        exportManager = new ExportManager(
          previewRef.getCanvas(),
          previewRef.renderFrame
        );
      }
    };
    
    // 少し遅延してからExportManagerを初期化
    setTimeout(initExportManager, 100);
    
    // エディタの参照が利用可能になったことを確認
    setTimeout(() => {
      if (editorRef) {
        console.log('Editor ref is now available', { 
          hasInsertCode: typeof editorRef.insertCode === 'function',
          hasReplaceAllCode: typeof editorRef.replaceAllCode === 'function'
        });
      }
    }, 500);
    
    // キーボードショートカットの登録
    defaultShortcuts.forEach(shortcut => {
      shortcutManager.register(shortcut);
    });
    shortcutManager.enable();
    
    // ショートカットイベントのリスナー
    window.addEventListener('shortcut:playPause', () => {
      isPlaying = !isPlaying;
    });
    
    window.addEventListener('shortcut:fullscreen', () => {
      $isVJMode = true;
    });
    
    window.addEventListener('shortcut:vjMode', () => {
      $isVJMode = !$isVJMode;
    });
    
    window.addEventListener('shortcut:reset', () => {
      handleReset();
    });
    
    window.addEventListener('shortcut:preset', ((e: CustomEvent) => {
      const index = e.detail;
      if ($presets[index]) {
        handlePresetLoad({ detail: $presets[index] } as CustomEvent<Preset>);
      }
    }) as EventListener);
    
    window.addEventListener('shortcut:save', () => {
      handleSave();
    });
    
    window.addEventListener('shortcut:load', () => {
      handleLoad();
    });
    
    return () => {
      shortcutManager.disable();
    };
  });
</script>

<main>
  <div class="layout-container">
    <div class="header">
      <h1>Shader Live Coding</h1>
      <div class="header-controls">
        <div class="mode-toggle">
          <button 
            class="mode-button" 
            class:active={$renderMode === 'glsl'}
            on:click={() => $renderMode = 'glsl'}>
            GLSL
          </button>
          <button 
            class="mode-button" 
            class:active={$renderMode === 'p5js'}
            on:click={() => $renderMode = 'p5js'}>
            P5.js
          </button>
        </div>
        {#if $renderMode === 'glsl'}
          <select on:change={handleShaderPresetChange}>
            <option value="">-- Select Preset --</option>
            <option value="default">Default</option>
            <option value="audioVisualizer">Audio Visualizer</option>
            <option value="spectrumBars">Spectrum Bars</option>
            <option value="waveformTunnel">Waveform Tunnel</option>
          </select>
        {/if}
        <button class="vj-mode-button" on:click={() => $isVJMode = true}>
          VJ Mode
        </button>
        {#if exportManager}
          <ExportButton 
            {exportManager}
            fragmentShaderCode={shaderProgram.fragmentShader}
            {audioBuffer}
            {audioContext}
          />
        {/if}
        <button class="help-button" on:click={() => showKeyboardHelp = true}>
          ?
        </button>
      </div>
    </div>
    
    <div class="main-content">
      <ResizablePane direction="horizontal" minSize={300} defaultSize="40%">
        <div slot="pane1" class="editor-panel">
          {#if $renderMode === 'glsl'}
            <Editor bind:shaderProgram bind:this={editorRef} />
          {:else}
            <Editor 
              shaderProgram={{
                ...shaderProgram,
                fragmentShader: p5Code
              }}
              bind:this={editorRef}
              language="javascript"
              on:change={(e) => p5Code = e.detail}
            />
          {/if}
        </div>
        
        <div slot="pane2" class="preview-and-controls">
          <ResizablePane direction="horizontal" minSize={250} defaultSize="calc(100% - 300px)">
            <div slot="pane1" class="preview-panel">
              <Preview 
                shaderProgram={$renderMode === 'glsl' ? shaderProgram : {
                  ...shaderProgram,
                  fragmentShader: p5Code
                }}
                renderMode={$renderMode}
                {isPlaying}
                on:fpsUpdate={(e) => fps = e.detail}
                bind:this={previewRef}
                on:audioLoaded={(e) => {
                  audioBuffer = e.detail.buffer;
                  audioContext = e.detail.context;
                }}
              />
            </div>
            
            <div slot="pane2" class="controls-panel">
              <Controls 
                {isPlaying} 
                {fps}
                {shaderProgram}
                on:playStateChange={handlePlayStateChange}
                on:reset={handleReset}
                on:save={handleSave}
                on:load={handleLoad}
                on:presetLoad={handlePresetLoad}
                on:insertCode={handleInsertCode}
                on:loadTemplate={handleLoadTemplate}
              />
            </div>
          </ResizablePane>
        </div>
      </ResizablePane>
    </div>
  </div>
</main>

<VJMode {shaderProgram} {isPlaying} />
<KeyboardHelp bind:isOpen={showKeyboardHelp} />
<ProjectModal 
  bind:isOpen={showProjectModal}
  mode={projectModalMode}
  on:saved={handleProjectSaved}
  on:loaded={handleProjectLoaded}
/>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
  }

  main {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .layout-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #1a1a1a;
    border-bottom: 1px solid #2a2a2a;
  }

  .header h1 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
  }

  .header-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .header-controls select {
    background-color: #2a2a2a;
    color: #ffffff;
    border: 1px solid #3a3a3a;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .mode-toggle {
    display: flex;
    background-color: #2a2a2a;
    border-radius: 4px;
    padding: 2px;
  }
  
  .mode-button {
    background-color: transparent;
    color: #888888;
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 3px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-button:hover {
    color: #cccccc;
  }
  
  .mode-button.active {
    background-color: #4a9eff;
    color: #ffffff;
  }
  
  .vj-mode-button {
    background-color: #4a9eff;
    color: #ffffff;
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .vj-mode-button:hover {
    opacity: 0.8;
  }
  
  .help-button {
    background-color: #3a3a3a;
    color: #ffffff;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .help-button:hover {
    background-color: #4a4a4a;
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-panel {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
  }

  .preview-and-controls {
    width: 100%;
    height: 100%;
  }

  .preview-panel {
    width: 100%;
    height: 100%;
    background-color: #0a0a0a;
  }

  .controls-panel {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>