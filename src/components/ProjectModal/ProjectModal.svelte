<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { projectStore, recentProjects } from '../../stores/projectStore';
  import { projectManager } from '../../lib/project';
  import { appStore } from '../../stores/appStore';
  import type { ProjectFile } from '../../types/project';
  
  export let isOpen = false;
  export let mode: 'save' | 'load' = 'save';
  
  const dispatch = createEventDispatcher();
  
  let projectName = '';
  let description = '';
  let compress = true;
  let selectedProject: ProjectFile | null = null;
  let isSaving = false;
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  
  $: if (isOpen && mode === 'load') {
    projectStore.loadRecentProjects();
  }
  
  function closeModal() {
    isOpen = false;
    resetForm();
    dispatch('close');
  }
  
  function resetForm() {
    projectName = '';
    description = '';
    compress = true;
    selectedProject = null;
    errorMessage = '';
    successMessage = '';
    isSaving = false;
    isLoading = false;
  }
  
  async function handleSave() {
    if (!projectName.trim()) {
      errorMessage = 'プロジェクト名を入力してください';
      return;
    }
    
    isSaving = true;
    errorMessage = '';
    
    try {
      const currentState = $appStore;
      const projectData: ProjectFile = {
        version: '1.0.0',
        metadata: {
          name: projectName.trim(),
          description: description.trim(),
          createdAt: new Date(),
          lastModified: new Date(),
          author: '',
          tags: []
        },
        shaderPrograms: [{
          ...currentState.shaderProgram,
          id: 'main',
          name: 'Main Shader'
        }],
        audioState: {
          enabled: false,
          volume: 1.0,
          fileReference: null,
          analysisSettings: {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10
          }
        },
        soundProgrammingState: {
          enabled: false,
          synthesizerSettings: {},
          sequencerPatterns: [],
          effectChains: []
        },
        presets: [],
        uiState: {
          selectedTab: 0,
          paneSizes: {
            editor: 0.4,
            preview: 0.4,
            controls: 0.2
          },
          vjModeEnabled: false,
          theme: 'dark'
        },
        customData: {}
      };
      
      const result = await projectManager.saveProject(projectData, {
        compress,
        defaultFilename: `${projectName.trim().replace(/\s+/g, '_')}.shlc`
      });
      
      if (result.success) {
        successMessage = `プロジェクト「${projectName}」を保存しました`;
        
        setTimeout(() => {
          closeModal();
          dispatch('saved', result.data);
        }, 1500);
      } else {
        errorMessage = result.error || 'プロジェクトの保存に失敗しました';
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      errorMessage = error instanceof Error ? error.message : 'プロジェクトの保存に失敗しました';
    } finally {
      isSaving = false;
    }
  }
  
  async function handleLoad() {
    isLoading = true;
    errorMessage = '';
    
    try {
      const result = await projectManager.loadProject();
      
      if (result.success && result.data) {
        const project = result.data;
        
        // アプリケーション状態を更新
        if (project.shaderPrograms.length > 0) {
          appStore.updateShaderProgram(project.shaderPrograms[0]);
        }
        
        successMessage = `プロジェクト「${project.metadata.name}」を読み込みました`;
        
        setTimeout(() => {
          closeModal();
          dispatch('loaded', project);
        }, 1000);
      } else {
        errorMessage = result.error || 'プロジェクトの読み込みに失敗しました';
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      errorMessage = error instanceof Error ? error.message : 'プロジェクトの読み込みに失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen}
  <div 
    class="modal-backdrop" 
    on:click={closeModal}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="modal-content" 
      on:click|stopPropagation
      transition:fly={{ y: 50, duration: 300 }}
    >
      <div class="modal-header">
        <h2>{mode === 'save' ? 'プロジェクトを保存' : 'プロジェクトを開く'}</h2>
        <button class="close-button" on:click={closeModal} aria-label="閉じる">
          ×
        </button>
      </div>
      
      {#if errorMessage}
        <div class="alert alert-error" transition:fade>
          {errorMessage}
        </div>
      {/if}
      
      {#if successMessage}
        <div class="alert alert-success" transition:fade>
          {successMessage}
        </div>
      {/if}
      
      <div class="modal-body">
        {#if mode === 'save'}
          <!-- 保存モード -->
          <form on:submit|preventDefault={handleSave}>
            <div class="form-group">
              <label for="project-name">プロジェクト名 <span class="required">*</span></label>
              <input
                id="project-name"
                type="text"
                bind:value={projectName}
                placeholder="My Shader Project"
                maxlength="100"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="project-description">説明（オプション）</label>
              <textarea
                id="project-description"
                bind:value={description}
                placeholder="このプロジェクトの説明を入力..."
                rows="3"
                maxlength="500"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={compress}
                />
                <span>ファイルを圧縮して保存</span>
              </label>
              <p class="help-text">
                圧縮を有効にするとファイルサイズを削減できます
              </p>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="button button-secondary" on:click={closeModal}>
                キャンセル
              </button>
              <button 
                type="submit" 
                class="button button-primary"
                disabled={isSaving || !projectName.trim()}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        {:else}
          <!-- 読み込みモード -->
          <div class="load-section">
            <p class="load-description">
              ファイルを選択してプロジェクトを読み込みます
            </p>
            
            <div class="load-actions">
              <button 
                class="button button-primary"
                on:click={handleLoad}
                disabled={isLoading}
              >
                {isLoading ? '読み込み中...' : 'ファイルを選択'}
              </button>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="button button-secondary" on:click={closeModal}>
                キャンセル
              </button>
            </div>
          </div>
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
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: #2a2a2a;
    border-radius: 8px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #ffffff;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .close-button:hover {
    background: #3a3a3a;
    color: #ffffff;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ffffff;
    font-weight: 500;
  }
  
  .required {
    color: #ff6b6b;
  }
  
  .form-group input[type="text"],
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #ffffff;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-group input[type="text"]:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #4a9eff;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"] {
    cursor: pointer;
  }
  
  .help-text {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #999;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1.5rem;
  }
  
  .button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .button-primary {
    background: #4a9eff;
    color: white;
  }
  
  .button-primary:hover:not(:disabled) {
    background: #3a8eef;
  }
  
  .button-secondary {
    background: #3a3a3a;
    color: #ffffff;
  }
  
  .button-secondary:hover:not(:disabled) {
    background: #4a4a4a;
  }
  
  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .alert {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .alert-error {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.2);
  }
  
  .alert-success {
    background: rgba(74, 222, 128, 0.1);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.2);
  }
  
  .load-section {
    text-align: center;
  }
  
  .load-description {
    margin-bottom: 2rem;
    color: #999;
  }
  
  .load-actions {
    margin-bottom: 2rem;
  }
</style>