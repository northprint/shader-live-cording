import '@testing-library/jest-dom';
import { vi } from 'vitest';

// WebGL のモック
const createMockWebGLContext = () => ({
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  useProgram: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  getAttribLocation: vi.fn(() => 0),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  drawArrays: vi.fn(),
  viewport: vi.fn(),
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  activeTexture: vi.fn(),
  uniform1f: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform4fv: vi.fn(),
  uniform1i: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  COLOR_BUFFER_BIT: 16384,
  TRIANGLE_STRIP: 5,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  LUMINANCE: 6409,
  UNSIGNED_BYTE: 5121,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  LINEAR: 9729,
  CLAMP_TO_EDGE: 33071,
  FLOAT: 5126,
  canvas: {
    width: 800,
    height: 600
  }
});

// Canvas のモック
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return createMockWebGLContext();
  }
  return null;
});

// Monaco Editor のモック
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getModel: vi.fn(() => ({
        getLineCount: vi.fn(() => 1)
      })),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      trigger: vi.fn()
    })),
    defineTheme: vi.fn(),
    setTheme: vi.fn()
  },
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    setLanguageConfiguration: vi.fn()
  },
  Range: vi.fn()
}));

// Tone.js のモック
vi.mock('tone', () => ({
  Player: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    buffer: null,
    loaded: Promise.resolve()
  })),
  Analyser: vi.fn(() => ({
    getValue: vi.fn(() => new Float32Array(1024)),
    connect: vi.fn(),
    toDestination: vi.fn(),
    dispose: vi.fn()
  })),
  FFT: vi.fn(() => ({
    getValue: vi.fn(() => new Float32Array(1024)),
    connect: vi.fn(),
    dispose: vi.fn()
  })),
  Meter: vi.fn(() => ({
    getValue: vi.fn(() => 0),
    connect: vi.fn(),
    toDestination: vi.fn(),
    dispose: vi.fn()
  })),
  Filter: vi.fn(() => ({
    connect: vi.fn(),
    dispose: vi.fn(),
    frequency: { value: 1000 },
    type: 'lowpass'
  })),
  Delay: vi.fn(() => ({
    connect: vi.fn(),
    dispose: vi.fn(),
    delayTime: { value: 0.25 },
    feedback: { value: 0.3 },
    wet: { value: 0 }
  })),
  Reverb: vi.fn(() => ({
    connect: vi.fn(),
    dispose: vi.fn(),
    wet: { value: 0 }
  })),
  Distortion: vi.fn(() => ({
    connect: vi.fn(),
    dispose: vi.fn(),
    distortion: 0,
    wet: { value: 0 }
  })),
  Compressor: vi.fn(() => ({
    connect: vi.fn(),
    fan: vi.fn(),
    dispose: vi.fn(),
    threshold: { value: -12 }
  })),
  start: vi.fn(() => Promise.resolve()),
  context: {
    state: 'running'
  },
  Destination: {
    volume: { value: 0 }
  }
}));

// requestAnimationFrame のモック
let animationFrameId = 1;
const animationFrameCallbacks = new Map();

global.requestAnimationFrame = vi.fn((cb) => {
  const id = animationFrameId++;
  animationFrameCallbacks.set(id, cb);
  // テスト環境では即座に実行しない
  return id;
});

global.cancelAnimationFrame = vi.fn((id) => {
  animationFrameCallbacks.delete(id);
});

// URL.createObjectURL のモック
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();