# テスト戦略とP5.jsモード実装計画

## 現状分析
- テスト環境が未設定
- 既存のGLSLモードは動作しているが、テストカバレッジなし
- P5.jsモード追加時に既存機能を壊さないことが重要

## テスト環境セットアップ

### 1. 必要なパッケージ
```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/svelte": "^5.2.0",
    "@vitest/ui": "^2.1.0",
    "jsdom": "^24.0.0",
    "happy-dom": "^14.0.0"
  }
}
```

### 2. テスト設定（vitest.config.ts）
```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

## 既存機能のテスト計画

### 1. コアコンポーネントのテスト
- [ ] WebGLRenderer.test.ts - シェーダーコンパイル、レンダリング
- [ ] AudioAnalyzer.test.ts - オーディオ解析、エフェクト処理
- [ ] Editor.test.ts - コード編集、シンタックスハイライト
- [ ] DatabaseManager.test.ts - プリセット保存/読み込み

### 2. 統合テスト
- [ ] App.test.ts - モード切り替え、全体的な動作
- [ ] AudioEffects.test.ts - エフェクトチェーン、パラメータ更新
- [ ] VJMode.test.ts - フルスクリーンモード、キーボードショートカット

## P5.jsモード実装の段階的アプローチ

### Phase 1: 基盤整備（既存機能を壊さない）
1. **テスト環境構築**
   - Vitestセットアップ
   - 既存機能の基本テスト作成
   - CI/CD設定（GitHub Actions）

2. **リファクタリング**
   - レンダラーの抽象化（WebGLRenderer → RendererInterface）
   - エディターの抽象化（言語別設定を分離）
   - 共通インターフェースの定義

### Phase 2: P5.jsモード基本実装
1. **モード管理**
   ```typescript
   // stores/modeStore.ts
   export type RenderMode = 'glsl' | 'p5js';
   export const currentMode = writable<RenderMode>('glsl');
   ```

2. **P5Renderer実装**
   ```typescript
   // lib/renderer/P5Renderer.ts
   export class P5Renderer implements RendererInterface {
     // 既存のWebGLRendererと同じインターフェース
   }
   ```

### Phase 3: 段階的機能追加
1. **基本機能**
   - P5.jsスケッチ実行
   - エラーハンドリング
   - キャンバスサイズ調整

2. **オーディオ統合**
   - 既存のAudioAnalyzerを再利用
   - P5.js向けAPI作成

3. **高度な機能**
   - プリセット
   - エクスポート
   - パフォーマンス最適化

## テスト駆動開発のフロー

### 1. 新機能追加時
```typescript
// 1. テストを先に書く
describe('P5Renderer', () => {
  it('should initialize p5 instance', () => {
    const renderer = new P5Renderer(canvas);
    expect(renderer.isInitialized()).toBe(true);
  });
});

// 2. 実装
// 3. テストが通ることを確認
// 4. リファクタリング
```

### 2. 既存機能の保護
```typescript
// GLSLモードのテスト
describe('GLSL Mode', () => {
  it('should compile and render GLSL shaders', () => {
    // 既存の動作を保証
  });
  
  it('should not be affected by P5.js mode', () => {
    // モード切り替え後も動作することを確認
  });
});
```

## CI/CD設定（.github/workflows/test.yml）
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

## 成功基準
1. 既存のGLSLモードが完全に動作する（テストカバレッジ80%以上）
2. P5.jsモード追加後も全てのテストが通る
3. モード切り替えが安全に行える
4. パフォーマンスの劣化がない（30fps以上維持）

## リスク管理
1. **破壊的変更の防止**
   - 全ての変更はテストでカバー
   - フィーチャーフラグで段階的リリース

2. **パフォーマンス監視**
   - ベンチマークテストの実装
   - メモリリーク検出

3. **後方互換性**
   - 保存されたプロジェクトの互換性維持
   - APIの変更は慎重に