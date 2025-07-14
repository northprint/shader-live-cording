# シェーダーライブコーディングアプリケーション設計書

## プロジェクト概要
フラグメントシェーダーのライブコーディングに特化したVJ向けデスクトップアプリケーション

## 技術スタック
- **デスクトップフレームワーク**: Tauri 2.0
- **フロントエンド**: Svelte 5
- **シェーダー言語**: GLSL, WGSL, Slang
- **データベース**: DuckDB (プリセット管理、プロジェクト保存)
- **音楽処理**: Web Audio API
- **レンダリング**: WebGL 2.0 / WebGPU

## 主要機能

### 1. シェーダーエディタ
- リアルタイムコード編集
- シンタックスハイライト（GLSL/WGSL/Slang対応）
- エラー表示とデバッグ支援
- コード補完（基本的なもの）
- 複数シェーダーのタブ管理

### 2. レンダリングエンジン
- WebGL 2.0ベースの高速レンダリング
- WebGPU対応（将来的な拡張）
- フレームバッファ操作
- マルチパスレンダリング対応
- uniform変数の動的管理

### 3. 音楽同期機能
- 音楽ファイルの読み込み（MP3, WAV, OGG）
- リアルタイム周波数解析（FFT）
- BPM検出
- 音楽データのuniform変数へのマッピング
- ビート同期エフェクト

### 4. サウンドプログラミング
- Web Audio APIを使用した音の生成
- オシレーター、フィルター、エフェクト
- ビジュアルと音の相互作用
- MIDIコントローラー対応（将来的）

### 5. VJモード
- フルスクリーン表示
- 複数ディスプレイ対応
- パフォーマンスモード（UIを最小化）
- キーボードショートカット
- シーン切り替えアニメーション

### 6. データ管理
- DuckDBによるプリセット管理
- プロジェクトファイルの保存/読み込み
- シェーダーコードのバージョン管理
- エクスポート機能（動画、静止画）

### 7. エクスポート機能
- **静止画エクスポート（PNG/JPG）**
  - 現在のフレームを高品質画像として保存
  - Canvas API（toBlob）を使用
  - 解像度指定可能（最大4K）
- **動画エクスポート（WebM）**
  - MediaRecorder APIによるリアルタイム録画
  - 設定可能な録画時間（最大5分）
  - VP9コーデック使用で高品質
  - フレームレート指定（25/30/60fps）
- **スタンドアロンHTMLエクスポート**
  - シェーダーコードを含む単一HTMLファイル
  - ES6テンプレートリテラルでコード埋め込み
  - 必要最小限のWebGLボイラープレート含む
  - パラメータ値の保存
- **音楽同期ビデオエクスポート**
  - 音楽ファイルと同期した動画出力
  - Web Audio APIとMediaRecorderの連携
  - 音楽データのビジュアル反映保持
  - WebMコンテナでの音声トラック統合

## アーキテクチャ

### フロントエンド構成
```
src/
├── components/
│   ├── Editor/           # コードエディタコンポーネント
│   ├── Preview/          # シェーダープレビュー
│   ├── Controls/         # パラメータコントロール
│   ├── AudioAnalyzer/    # 音楽解析ビジュアライザ
│   ├── Timeline/         # タイムラインコントロール
│   └── Export/           # エクスポート関連UI
│       ├── ImageExport/  # 静止画エクスポート設定
│       ├── VideoExport/  # 動画エクスポート設定
│       └── HTMLExport/   # HTMLエクスポート設定
├── lib/
│   ├── shader/          # シェーダー関連ユーティリティ
│   ├── audio/           # 音楽処理
│   ├── renderer/        # レンダリングエンジン
│   ├── database/        # DuckDB接続
│   └── export/          # エクスポート機能
│       ├── image.ts     # 静止画エクスポートロジック
│       ├── video.ts     # 動画録画ロジック
│       ├── html.ts      # HTMLジェネレータ
│       └── audio-sync.ts # 音楽同期エクスポート
├── stores/              # Svelteストア（状態管理）
└── routes/              # ページルーティング
```

### バックエンド構成（Tauri）
```
src-tauri/
├── src/
│   ├── commands/        # Tauriコマンド
│   ├── audio/           # ネイティブ音楽処理
│   ├── database/        # DuckDB操作
│   └── file_system/     # ファイル操作
```

## データスキーマ（DuckDB）

### presets テーブル
```sql
CREATE TABLE presets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    shader_code TEXT NOT NULL,
    language TEXT NOT NULL, -- 'glsl', 'wgsl', 'slang'
    uniforms JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### projects テーブル
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    shaders JSON, -- 複数のシェーダー情報
    audio_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## UI/UXデザイン

### レイアウト
- 3ペインレイアウト（エディタ、プレビュー、コントロール）
- レスポンシブデザイン
- ダークテーマデフォルト
- ドラッグ可能なペイン境界

### インタラクション
- ホットリロード（コード変更時に即座に反映）
- パラメータスライダーのリアルタイム更新
- ドラッグ&ドロップでの音楽ファイル読み込み
- キーボードショートカット充実

## パフォーマンス目標
- 60FPS以上でのレンダリング
- コード変更から反映まで100ms以内
- 音楽同期の遅延50ms以内
- メモリ使用量500MB以内

## セキュリティ考慮事項
- シェーダーコードのサンドボックス実行
- ファイルシステムアクセスの制限
- ネットワークアクセスの制御

## エクスポート機能技術詳細

### 静止画エクスポート実装
```typescript
// WebGLキャンバスの描画バッファ保持を考慮
async function exportImage(canvas: HTMLCanvasElement, format: 'png' | 'jpg') {
  // 再レンダリングしてから即座にキャプチャ
  renderFrame();
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, `image/${format}`);
  });
}
```

### 動画録画実装
```typescript
// MediaRecorder APIを使用した録画
function recordVideo(canvas: HTMLCanvasElement, duration: number) {
  const stream = canvas.captureStream(30); // 30fps
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8000000 // 8Mbps
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    // Tauriのファイルシステムで保存
  };
  
  recorder.start();
  setTimeout(() => recorder.stop(), duration);
}
```

### スタンドアロンHTML生成
```typescript
// 自己完結型HTMLファイルの生成
function generateStandaloneHTML(shaderCode: string, uniforms: object) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>body { margin: 0; overflow: hidden; }</style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const vertexShader = \`${defaultVertexShader}\`;
    const fragmentShader = \`${shaderCode}\`;
    const uniforms = ${JSON.stringify(uniforms)};
    // WebGLボイラープレートコード
  </script>
</body>
</html>`;
}
```

### 音楽同期エクスポート
```typescript
// 音楽と映像を同期してエクスポート
async function exportAudioSync(
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  duration: number
) {
  // CanvasとAudioの両方のストリームを結合
  const videoStream = canvas.captureStream(30);
  const audioContext = new AudioContext();
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  
  const audioDestination = audioContext.createMediaStreamDestination();
  audioSource.connect(audioDestination);
  
  // ストリームを結合
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks()
  ]);
  
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: 'video/webm;codecs=vp9,opus'
  });
  
  // 録画処理
}
```