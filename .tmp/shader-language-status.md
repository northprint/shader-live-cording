# シェーダー言語対応状況

## 現在の状態

### 対応している言語
- **GLSL ES 3.0** - ✅ 完全対応
  - WebGL 2.0でネイティブサポート
  - シンタックスハイライト
  - エラー表示
  - プリセット

### 未対応の言語
- **WGSL (WebGPU Shading Language)** - ❌ 未実装
  - WebGPUのサポートが必要
  - ブラウザサポートがまだ限定的
  - 実装には大幅な変更が必要

## 実装に必要な作業

### WGSL対応
1. WebGPUレンダラーの実装
2. WGSLパーサー/バリデーター
3. エディタのWGSLモード追加
4. WGSLプリセットの作成

## 推奨事項
現時点では、GLSLのみをサポートし、WGSL対応は将来的な拡張として検討することを推奨します。