# Export Modal Component

エクスポート機能を提供するモーダルコンポーネントです。

## 機能

- **画像エクスポート**: PNG/JPEG形式での静止画保存
- **動画エクスポート**: WebM形式での録画機能
- **HTMLエクスポート**: スタンドアロンHTMLファイルの生成

## 使用方法

```svelte
<script>
  import ExportButton from './components/ExportButton/ExportButton.svelte';
  import { ExportManager } from './lib/export/ExportManager';
  
  // WebGLレンダラーのキャンバスとレンダリング関数を用意
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  
  // ExportManagerの初期化
  const exportManager = new ExportManager(
    canvas, 
    () => renderer.renderFrame()
  );
  
  // オプション: 音楽データ
  let audioBuffer: AudioBuffer | null = null;
  let audioContext: AudioContext | null = null;
  
  // シェーダーコード
  let fragmentShaderCode = `
    void main() {
      gl_FragColor = vec4(1.0);
    }
  `;
</script>

<ExportButton
  {exportManager}
  {fragmentShaderCode}
  {audioBuffer}
  {audioContext}
  on:export-success={(e) => console.log('Export success:', e.detail)}
  on:export-error={(e) => console.error('Export error:', e.detail)}
/>
```

## Props

### ExportModal

- `exportManager` (required): ExportManagerインスタンス
- `fragmentShaderCode` (required): エクスポートするフラグメントシェーダーのコード
- `audioBuffer` (optional): 音楽同期用のAudioBuffer
- `audioContext` (optional): 音楽同期用のAudioContext

### ExportButton

- `exportManager` (required): ExportManagerインスタンス
- `fragmentShaderCode` (required): エクスポートするフラグメントシェーダーのコード
- `audioBuffer` (optional): 音楽同期用のAudioBuffer
- `audioContext` (optional): 音楽同期用のAudioContext
- `disabled` (optional): ボタンの無効化状態

## イベント

- `export-success`: エクスポート成功時に発火
  ```javascript
  {
    type: 'image' | 'video' | 'html',
    result: ExportResult
  }
  ```

- `export-error`: エクスポート失敗時に発火
  ```javascript
  {
    type: 'image' | 'video' | 'html',
    error: string
  }
  ```

## キーボードショートカット

- `Ctrl/Cmd + E`: エクスポートモーダルを開く

## 画像エクスポートオプション

- **フォーマット**: PNG（高品質）またはJPEG
- **品質**: JPEG選択時に0-100%で指定可能
- **解像度プリセット**:
  - 現在のサイズ
  - 1080p (1920×1080)
  - 4K (3840×2160)
  - カスタム（最大8192×8192）

## 動画エクスポートオプション

- **録画時間**: 1-300秒
- **FPS**: 25, 30, 60から選択
- **ビットレート**: 1-20 Mbps
- **音楽同期**: audioBufferが提供されている場合に選択可能

## HTMLエクスポートオプション

- **音楽ビジュアライゼーション**: Web Audio APIを使用した音楽反応機能を含める
- **コード圧縮**: 出力サイズを削減するためのminify機能

## 注意事項

- WebGLキャンバスは`preserveDrawingBuffer: true`で初期化する必要があります
- 高解像度エクスポート時は一時的にメモリ使用量が増加します
- 動画録画はブラウザのMediaRecorder APIに依存するため、対応ブラウザで実行してください