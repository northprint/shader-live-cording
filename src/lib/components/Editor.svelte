<script lang="ts">
  export let code = '';
  
  // 仮のエディタ実装（後でMonaco Editorに置き換え）
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    code = target.value;
  }
</script>

<div class="editor">
  <textarea
    value={code}
    on:input={handleInput}
    spellcheck="false"
  />
</div>

<style>
  .editor {
    width: 100%;
    height: 100%;
    padding: 1rem;
  }

  textarea {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    color: #e0e0e0;
    border: none;
    outline: none;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    padding: 1rem;
    border-radius: 4px;
  }
</style>