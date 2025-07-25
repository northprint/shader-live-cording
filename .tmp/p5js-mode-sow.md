# P5.js モード実装 SOW (Statement of Work)

## 概要
Shader Live Coding アプリケーションに、P5.jsベースのクリエイティブコーディングモードを追加する。これにより、GLSLシェーダーだけでなく、P5.jsを使用したビジュアルプログラミングも可能になる。

## プロジェクトの目的
- アーティストやクリエイターにとってより親しみやすいP5.js環境を提供
- GLSLシェーダーとP5.jsコードをシームレスに切り替え可能に
- VJパフォーマンスでの表現の幅を拡大
- 音楽に反応するP5.jsスケッチの作成を可能に

## 主要機能

### 1. モード切り替え機能
- GLSL/P5.jsモードの切り替えUI
- 各モードの状態を保持（コード、設定など）
- ホットキーでの高速切り替え

### 2. P5.jsエディター統合
- Monaco EditorでのJavaScript/P5.js構文サポート
- P5.js専用のオートコンプリート
- リアルタイムエラー表示
- P5.jsリファレンスへのクイックアクセス

### 3. P5.jsレンダリング
- キャンバスサイズの自動調整
- フレームレート管理
- WebGLモード対応（3D描画）
- インスタンスモード実装（グローバル汚染回避）

### 4. オーディオ連携
- 既存のオーディオアナライザーとの統合
- P5.js内で使用可能な音楽データAPI
  - `getVolume()`, `getBass()`, `getMid()`, `getTreble()`
  - `getFrequency(index)`, `getWaveform()`
  - `getBeat()`, `getBPM()`
- エフェクトパラメータへのアクセス

### 5. プリセット・テンプレート
- P5.js用プリセットの追加
- 基本的なテンプレート
  - 音楽ビジュアライザー
  - パーティクルシステム
  - 3Dグラフィックス
  - ジェネラティブアート

### 6. エクスポート機能
- P5.jsスケッチの動画エクスポート
- スタンドアロンHTMLエクスポート
- コード + 音楽の同期エクスポート

## 技術的実装詳細

### アーキテクチャ
```
┌─────────────────┐
│   Mode Selector │ ← GLSL / P5.js
└────────┬────────┘
         │
┌────────┴────────┐
│  Editor Layer   │
├─────────────────┤
│ GLSL │   P5.js  │
└──┬───┴────┬─────┘
   │        │
┌──┴────────┴─────┐
│ Renderer Layer  │
├─────────────────┤
│WebGL │ P5Canvas │
└──┬───┴────┬─────┘
   │        │
┌──┴────────┴─────┐
│  Audio System   │ ← 共通
└─────────────────┘
```

### 主要コンポーネント
1. **P5ModeManager**: モード管理とステート保持
2. **P5Editor**: P5.js専用エディター設定
3. **P5Renderer**: P5.jsスケッチ実行環境
4. **P5AudioBridge**: オーディオデータ連携
5. **P5PresetManager**: プリセット管理

### P5.js実行環境
```javascript
// インスタンスモードで実行
const sketch = (p) => {
  // オーディオデータ注入
  p.audioData = audioAnalyzer.getData();
  
  p.setup = function() {
    p.createCanvas(width, height, p.WEBGL);
  };
  
  p.draw = function() {
    // ユーザーコード実行
  };
};

new p5(sketch, 'preview-container');
```

## 実装フェーズ

### Phase 1: 基礎実装（1週間）
- [ ] モード切り替えUI実装
- [ ] P5.jsライブラリ統合
- [ ] 基本的なP5.jsレンダリング
- [ ] エディターのJavaScriptモード対応

### Phase 2: オーディオ統合（3-4日）
- [ ] オーディオデータブリッジ実装
- [ ] P5.js用オーディオAPI設計
- [ ] リアルタイムデータ更新
- [ ] エフェクトパラメータ連携

### Phase 3: 高度な機能（1週間）
- [ ] プリセット・テンプレート作成
- [ ] エラーハンドリング改善
- [ ] パフォーマンス最適化
- [ ] エクスポート機能拡張

### Phase 4: 仕上げ（3-4日）
- [ ] UI/UXの洗練
- [ ] ドキュメント作成
- [ ] サンプルコード追加
- [ ] テスト実装

## 期待される成果
- GLSLに不慣れなユーザーでもビジュアルプログラミングが可能
- P5.jsコミュニティの既存アセットを活用可能
- より直感的な音楽ビジュアライゼーション作成
- 教育用途での活用拡大

## リスクと対策
1. **パフォーマンス**: P5.jsはGLSLより遅い
   - 対策: FPS制限、最適化ガイドライン提供

2. **コード互換性**: GLSL↔P5.js変換は不可能
   - 対策: 各モード独立、明確な切り替え

3. **ファイルサイズ**: P5.jsライブラリ追加
   - 対策: 動的ロード、必要時のみ読み込み

## 必要リソース
- P5.js v1.7.0以上
- Monaco EditorのJavaScript言語サポート
- 追加のnpmパッケージ（p5, @types/p5）

## 総工数見積もり
約3週間（実装2週間 + テスト・調整1週間）

## 成功指標
- GLSLモードと同等のパフォーマンス（30fps以上）
- 音楽との同期精度（遅延50ms以下）
- 5つ以上の実用的なプリセット
- エラーなく動作する基本機能