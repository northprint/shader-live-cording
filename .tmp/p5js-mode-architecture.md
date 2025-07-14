# P5.jsモード アーキテクチャ設計

## 設計方針
既存のGLSLモードを壊さずに、P5.jsモードを追加する

## アーキテクチャ

### 1. レンダラーインターフェース

```typescript
// src/lib/renderer/RendererInterface.ts
export interface RendererInterface {
  compile(vertexSource: string, fragmentSource: string): ShaderCompileResult;
  setAudioData(data: AudioAnalysisData): void;
  render(): void;
  renderFrame(): void;
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  destroy(): void;
  getCanvas(): HTMLCanvasElement;
}
```

### 2. モード管理

```typescript
// src/stores/renderModeStore.ts
import { writable } from 'svelte/store';

export type RenderMode = 'glsl' | 'p5js';

export const renderMode = writable<RenderMode>('glsl');
```

### 3. P5Renderer実装

```typescript
// src/lib/renderer/P5Renderer.ts
import type { RendererInterface } from './RendererInterface';
import p5 from 'p5';

export class P5Renderer implements RendererInterface {
  private p5Instance: p5 | null = null;
  private canvas: HTMLCanvasElement;
  private userCode: string = '';
  private audioData: AudioAnalysisData | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }
  
  compile(code: string): CompileResult {
    // P5.jsコードのバリデーション
    try {
      // 簡易的なシンタックスチェック
      new Function(code);
      this.userCode = code;
      this.initP5();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errors: [error.message] 
      };
    }
  }
  
  private initP5(): void {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
    
    const sketch = (p: p5) => {
      // オーディオデータを注入
      (p as any).audioData = this.audioData;
      
      // ユーザーコードを実行
      try {
        eval(`
          with(p) {
            ${this.userCode}
          }
        `);
      } catch (error) {
        console.error('P5.js execution error:', error);
      }
    };
    
    this.p5Instance = new p5(sketch, this.canvas.parentElement);
  }
}
```

### 4. エディター設定の分離

```typescript
// src/lib/editor/editorConfigs.ts
export const glslConfig = {
  language: 'glsl',
  theme: 'vs-dark',
  // GLSL特有の設定
};

export const p5jsConfig = {
  language: 'javascript',
  theme: 'vs-dark',
  // P5.js特有の設定
};
```

### 5. Previewコンポーネントの修正

```svelte
<script lang="ts">
  import { renderMode } from '../../stores/renderModeStore';
  import { WebGLRenderer } from '../../lib/renderer/WebGLRenderer';
  import { P5Renderer } from '../../lib/renderer/P5Renderer';
  
  let renderer: RendererInterface;
  
  $: {
    if ($renderMode === 'glsl') {
      renderer = new WebGLRenderer(canvas);
    } else {
      renderer = new P5Renderer(canvas);
    }
  }
</script>
```

## テスト戦略

### 1. P5Rendererのユニットテスト

```typescript
// src/lib/renderer/P5Renderer.test.ts
describe('P5Renderer', () => {
  it('should initialize p5 instance', () => {
    // テスト実装
  });
  
  it('should handle syntax errors', () => {
    // テスト実装
  });
  
  it('should inject audio data', () => {
    // テスト実装
  });
});
```

### 2. モード切り替えのインテグレーションテスト

```typescript
describe('Mode Switching', () => {
  it('should switch between GLSL and P5.js modes', () => {
    // テスト実装
  });
  
  it('should preserve state when switching modes', () => {
    // テスト実装
  });
});
```

## 実装順序

1. **Phase 1: 基盤作成**
   - [ ] RendererInterfaceの定義
   - [ ] WebGLRendererのリファクタリング
   - [ ] renderModeStoreの実装
   - [ ] 既存テストが通ることを確認

2. **Phase 2: P5.js基本実装**
   - [ ] P5Rendererのスケルトン実装
   - [ ] P5Rendererのテスト作成
   - [ ] モード切り替えUI実装
   - [ ] エディター設定の分離

3. **Phase 3: オーディオ統合**
   - [ ] P5.js用オーディオAPIの実装
   - [ ] 既存AudioAnalyzerとの統合
   - [ ] オーディオ関連のテスト

4. **Phase 4: 高度な機能**
   - [ ] P5.jsプリセット
   - [ ] エラーハンドリング強化
   - [ ] パフォーマンス最適化

## リスク管理

1. **既存機能への影響**
   - インターフェースを使った抽象化により最小化
   - 各フェーズでテストを実行

2. **パフォーマンス**
   - 遅延読み込みでP5.jsライブラリを必要時のみロード
   - 未使用モードのレンダラーは破棄

3. **後方互換性**
   - 保存されたプロジェクトにモード情報を追加
   - デフォルトはGLSLモード