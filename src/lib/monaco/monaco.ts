import * as monaco from 'monaco-editor';

// Monaco Editorのワーカー設定
// vite-plugin-monaco-editorがワーカーのロードを処理します
declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (workerId: string, label: string) => Worker;
    };
  }
}

// GLSLのシンタックスハイライト定義
monaco.languages.register({ id: 'glsl' });

monaco.languages.setMonarchTokensProvider('glsl', {
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/\d+\.\d*|\.\d+/, 'number.float'],
      [/\d+/, 'number'],
      [/".*?"/, 'string'],
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
    ],
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ]
  },
  keywords: [
    'attribute', 'bool', 'break', 'const', 'continue', 'discard', 'do', 'else',
    'false', 'float', 'for', 'highp', 'if', 'in', 'inout', 'int', 'invariant',
    'lowp', 'mat2', 'mat3', 'mat4', 'mediump', 'out', 'precision', 'return',
    'sampler2D', 'samplerCube', 'struct', 'true', 'uniform', 'varying', 'vec2',
    'vec3', 'vec4', 'void', 'while'
  ]
});

export default monaco;