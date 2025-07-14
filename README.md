# Shader Live Coding

[日本語版は下にあります / Japanese version below](#shader-live-coding-日本語)

A real-time shader live coding application for VJ performances, built with Tauri 2.0 and Svelte 5.

![Shader Live Coding App](docs/images/screenshot.png)

## Features

- **Real-time Shader Editing**: Live code your GLSL shaders with instant preview using Monaco Editor
- **P5.js Mode**: Creative coding with JavaScript using P5.js
- **Audio Reactive**: Sync visuals with music using real-time FFT analysis
- **Audio Effects**: Apply filters, delay, reverb, distortion, and compression to your music
- **Preset Management**: Save and load your favorite shader presets
- **VJ Mode**: Fullscreen performance mode with keyboard shortcuts and live coding overlay
- **Export Capabilities**: Export as images (PNG/JPEG), videos (WebM), or standalone HTML
- **Cross-platform**: Works on macOS, Windows, and Linux

## Installation

### Download Pre-built Binaries

Download the latest release from the [Releases page](https://github.com/northprint/shader-live-cording/releases):

- **macOS**: `.dmg` file
  - Apple Silicon (M1/M2): `shader-live-coding_0.0.2_aarch64.dmg`
  - Intel: `shader-live-coding_0.0.2_x64.dmg`
- **Windows**: `.msi` installer
- **Linux**: `.AppImage` or `.deb` file

### Build from Source

Prerequisites:
- [Node.js](https://nodejs.org/) 18+ (LTS version)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)

```bash
# Clone the repository
git clone https://github.com/northprint/shader-live-cording.git
cd shader-live-cording

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

## Usage

### Basic Workflow

1. **Choose Mode**: Select between GLSL shader mode or P5.js mode
2. **Write Code**: Use the Monaco editor to write your code
3. **Load Audio** (optional): Load music files to create audio-reactive visuals
4. **Apply Effects**: Use the audio effects panel to modify your music
5. **Save Presets**: Save your favorite creations for later use

### Keyboard Shortcuts

#### General
- `Space`: Play/Pause audio
- `F11`: Toggle fullscreen
- `Esc`: Exit fullscreen

#### VJ Mode
- `Ctrl+E`: Toggle live coding editor overlay
- `Ctrl+Enter`: Apply code (in live editor)
- `1-4`: Switch between presets

### Built-in Shader Variables

- `iResolution` - Screen resolution (vec3)
- `iTime` - Elapsed time in seconds (float)
- `iMouse` - Mouse coordinates (vec4)
- `iAudioData` - Audio waveform data (sampler2D)
- `iFrequency` - Frequency spectrum data (sampler2D)
- `iBass`, `iMid`, `iTreble` - Low, mid, high frequency intensity (float)

### Shader Template

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    
    // Your shader code here
    vec3 color = vec3(uv, 0.5 + 0.5 * sin(iTime));
    
    fragColor = vec4(color, 1.0);
}
```

### Export Options

- **Image Export**: PNG or JPEG format with customizable resolution
- **Video Export**: WebM format with 30/60 FPS options
- **HTML Export**: Self-contained HTML file that runs in any modern browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/) for cross-platform desktop support
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Svelte](https://svelte.dev/) for the reactive UI
- [P5.js](https://p5js.org/) for creative coding
- [Tone.js](https://tonejs.github.io/) for audio processing

---

# Shader Live Coding 【日本語】

リアルタイムシェーダーライブコーディングアプリケーション。VJパフォーマンスや創造的なビジュアル表現のために設計されています。

![Shader Live Coding App](docs/images/screenshot.png)

## 機能

- **リアルタイムシェーダー編集**: Monaco Editorを使用したGLSLシェーダーのライブコーディング
- **P5.jsモード**: JavaScriptによるクリエイティブコーディング
- **音楽同期**: リアルタイムFFT分析による音楽連動ビジュアル
- **オーディオエフェクト**: フィルター、ディレイ、リバーブ、ディストーション、コンプレッサー
- **プリセット管理**: お気に入りのシェーダーを保存・読み込み
- **VJモード**: フルスクリーン表示とライブコーディングオーバーレイ
- **エクスポート機能**: 画像（PNG/JPEG）、動画（WebM）、スタンドアロンHTMLとして出力
- **クロスプラットフォーム**: macOS、Windows、Linuxで動作

## インストール

### ビルド済みバイナリのダウンロード

最新のリリースは[リリースページ](https://github.com/northprint/shader-live-cording/releases)からダウンロードできます：

- **macOS**: `.dmg`ファイル
  - Apple Silicon (M1/M2): `shader-live-coding_0.0.2_aarch64.dmg`
  - Intel: `shader-live-coding_0.0.2_x64.dmg`
- **Windows**: `.msi`インストーラー
- **Linux**: `.AppImage`または`.deb`ファイル

### ソースからビルド

必要な環境:
- [Node.js](https://nodejs.org/) 18以降 (LTSバージョン)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)

```bash
# リポジトリをクローン
git clone https://github.com/northprint/shader-live-cording.git
cd shader-live-cording

# 依存関係のインストール
pnpm install

# 開発モードで実行
pnpm tauri:dev

# プロダクションビルド
pnpm tauri:build
```

## 使い方

### 基本的なワークフロー

1. **モード選択**: GLSLシェーダーモードまたはP5.jsモードを選択
2. **コード作成**: Monacoエディタでコードを記述
3. **音楽読み込み**（オプション）: 音楽ファイルを読み込んで音楽連動ビジュアルを作成
4. **エフェクト適用**: オーディオエフェクトパネルで音楽を加工
5. **プリセット保存**: お気に入りの作品を保存

### キーボードショートカット

#### 一般
- `Space`: 音楽の再生/一時停止
- `F11`: フルスクリーン切り替え
- `Esc`: フルスクリーン終了

#### VJモード
- `Ctrl+E`: ライブコーディングエディタの表示/非表示
- `Ctrl+Enter`: コードの適用（ライブエディタ内）
- `1-4`: プリセットの切り替え

### 組み込みシェーダー変数

- `iResolution` - 画面の解像度（vec3）
- `iTime` - 経過時間（float）
- `iMouse` - マウスの座標（vec4）
- `iAudioData` - オーディオの波形データ（sampler2D）
- `iFrequency` - 周波数データ（sampler2D）
- `iBass`, `iMid`, `iTreble` - 低音、中音、高音の強度（float）

### シェーダーテンプレート

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    
    // ここにシェーダーコードを記述
    vec3 color = vec3(uv, 0.5 + 0.5 * sin(iTime));
    
    fragColor = vec4(color, 1.0);
}
```

### エクスポートオプション

- **画像エクスポート**: PNG/JPEG形式、解像度カスタマイズ可能
- **動画エクスポート**: WebM形式、30/60 FPSオプション
- **HTMLエクスポート**: ブラウザで実行可能な自己完結型HTMLファイル

## 貢献

プルリクエストは歓迎します！

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 謝辞

- [Tauri](https://tauri.app/) - クロスプラットフォームデスクトップサポート
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - コードエディタ
- [Svelte](https://svelte.dev/) - リアクティブUI
- [P5.js](https://p5js.org/) - クリエイティブコーディング
- [Tone.js](https://tonejs.github.io/) - オーディオ処理