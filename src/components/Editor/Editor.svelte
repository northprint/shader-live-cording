<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { ShaderProgram } from '../../types/shader';
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  
  export let shaderProgram: ShaderProgram;
  export let language: 'glsl' | 'javascript' = 'glsl';
  
  const dispatch = createEventDispatcher();
  
  let editorContainer: HTMLElement;
  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  
  // エディタインスタンスを外部から操作できるようにする
  export function insertCode(code: string) {
    if (!editor) return;
    
    const position = editor.getPosition();
    if (!position) return;
    
    editor.executeEdits('', [{
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text: code + '\n\n',
      forceMoveMarkers: true
    }]);
    
    // カーソルを挿入したコードの後に移動
    const lines = code.split('\n');
    const newPosition = {
      lineNumber: position.lineNumber + lines.length + 1,
      column: 1
    };
    editor.setPosition(newPosition);
    editor.focus();
  }
  
  export function replaceAllCode(code: string) {
    if (!editor) return;
    editor.setValue(code);
    editor.focus();
  }
  
  onMount(async () => {
    // monaco-editorを動的インポート
    monaco = (await import('../../lib/monaco/monaco')).default;
    
    // エディタの作成
    editor = monaco.editor.create(editorContainer, {
      value: shaderProgram.fragmentShader,
      language: language,
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      minimap: { enabled: false },
      automaticLayout: true,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
    });
    
    // 値の変更を監視
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      if (shaderProgram) {
        shaderProgram.fragmentShader = value;
        shaderProgram.lastModified = new Date();
      }
      // P5.jsモードの場合は変更イベントを発火
      if (language === 'javascript') {
        dispatch('change', value);
      }
    });
  });
  
  onDestroy(() => {
    if (editor) {
      editor.dispose();
    }
  });
  
  // シェーダープログラムが変更されたら更新
  $: if (editor && shaderProgram) {
    const currentValue = editor.getValue();
    if (currentValue !== shaderProgram.fragmentShader) {
      editor.setValue(shaderProgram.fragmentShader);
    }
  }
  
  // 言語が変更されたら更新
  $: if (editor && monaco && language) {
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }
</script>

<div class="editor-container">
  <div class="editor-header">
    <span class="filename">fragment.glsl</span>
    <span class="language">{shaderProgram.language.toUpperCase()}</span>
  </div>
  
  <div class="editor-content" bind:this={editorContainer}></div>
</div>

<style>
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #2a2a2a;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .filename {
    font-size: 0.9rem;
    color: #cccccc;
  }
  
  .language {
    font-size: 0.8rem;
    color: #888888;
    background-color: #1a1a1a;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }
  
  .editor-content {
    flex: 1;
    overflow: hidden;
    min-height: 300px;
  }
</style>