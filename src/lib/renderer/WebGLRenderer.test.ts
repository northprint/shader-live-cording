import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebGLRenderer } from './WebGLRenderer';
import { createMockWebGLContext } from '../../test/helpers';

describe('WebGLRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  let mockGl: ReturnType<typeof createMockWebGLContext>;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    mockGl = createMockWebGLContext();
    canvas.getContext = vi.fn(() => mockGl);
    renderer = new WebGLRenderer(canvas);
  });

  describe('initialization', () => {
    it('should create a WebGL context', () => {
      expect(canvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
    });

    it('should throw error if WebGL is not supported', () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.getContext = vi.fn(() => null);
      
      expect(() => new WebGLRenderer(mockCanvas)).toThrow('WebGL not supported');
    });

    it('should initialize vertex buffer', () => {
      expect(mockGl.createBuffer).toHaveBeenCalled();
      expect(mockGl.bindBuffer).toHaveBeenCalled();
      expect(mockGl.bufferData).toHaveBeenCalled();
    });
  });

  describe('shader compilation', () => {
    const vertexShader = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float time;
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;

    it('should compile shaders successfully', () => {
      const result = renderer.compile(vertexShader, fragmentShader);
      
      expect(result.success).toBe(true);
      expect(result.program).toBeDefined();
      expect(result.errors).toBeUndefined();
      expect(mockGl.createShader).toHaveBeenCalledTimes(2);
      expect(mockGl.compileShader).toHaveBeenCalledTimes(2);
      expect(mockGl.createProgram).toHaveBeenCalled();
      expect(mockGl.linkProgram).toHaveBeenCalled();
    });

    it('should handle vertex shader compilation errors', () => {
      mockGl.getShaderParameter = vi.fn(() => false);
      mockGl.getShaderInfoLog = vi.fn(() => 'Vertex shader error');

      const result = renderer.compile('invalid vertex shader', fragmentShader);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Vertex shader error');
    });

    it('should handle fragment shader compilation errors', () => {
      let callCount = 0;
      mockGl.getShaderParameter = vi.fn(() => {
        // First call (vertex shader) succeeds, second call (fragment shader) fails
        return callCount++ === 0;
      });
      mockGl.getShaderInfoLog = vi.fn(() => 'Fragment shader error');

      const result = renderer.compile(vertexShader, 'invalid fragment shader');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Fragment shader error');
    });

    it('should handle program linking errors', () => {
      mockGl.getProgramParameter = vi.fn(() => false);
      mockGl.getProgramInfoLog = vi.fn(() => 'Linking error');

      const result = renderer.compile(vertexShader, fragmentShader);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Linking error');
    });
  });

  describe('uniforms', () => {
    beforeEach(() => {
      const vertexShader = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;
      const fragmentShader = `
        precision highp float;
        uniform float time;
        uniform vec2 resolution;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `;
      renderer.compile(vertexShader, fragmentShader);
    });

    it('should set float uniforms', () => {
      mockGl.getUniformLocation = vi.fn(() => ({ location: 1 }));
      
      renderer.setUniform('time', 1.5);
      
      expect(mockGl.getUniformLocation).toHaveBeenCalled();
      expect(mockGl.uniform1f).toHaveBeenCalledWith({ location: 1 }, 1.5);
    });

    it('should set vec2 uniforms', () => {
      mockGl.getUniformLocation = vi.fn(() => ({ location: 2 }));
      
      renderer.setUniform('resolution', [800, 600]);
      
      expect(mockGl.uniform2fv).toHaveBeenCalledWith({ location: 2 }, [800, 600]);
    });

    it('should handle non-existent uniforms gracefully', () => {
      mockGl.getUniformLocation = vi.fn(() => null);
      
      // Should not throw
      expect(() => renderer.setUniform('nonExistent', 1.0)).not.toThrow();
    });
  });

  describe('audio data', () => {
    beforeEach(() => {
      const vertexShader = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
      const fragmentShader = `
        precision highp float;
        uniform float audioVolume;
        uniform float audioBass;
        void main() { gl_FragColor = vec4(1.0); }
      `;
      renderer.compile(vertexShader, fragmentShader);
    });

    it('should update audio data', () => {
      const audioData = {
        volume: 0.5,
        bass: 0.3,
        mid: 0.5,
        treble: 0.7,
        frequency: new Float32Array(1024),
        waveform: new Float32Array(1024),
        beat: false,
        bpm: 120
      };

      renderer.setAudioData(audioData);
      
      // Clear previous calls
      mockGl.uniform1f.mockClear();
      mockGl.getUniformLocation = vi.fn((program, name) => {
        if (name === 'audioVolume') return { location: 1 };
        if (name === 'audioBass') return { location: 2 };
        return null;
      });
      
      renderer.render();

      expect(mockGl.uniform1f).toHaveBeenCalledWith({ location: 1 }, 0.5);
      expect(mockGl.uniform1f).toHaveBeenCalledWith({ location: 2 }, 0.3);
    });
  });

  describe('lifecycle', () => {
    it('should start and stop animation', () => {
      renderer.start();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      
      renderer.stop();
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start animation twice', () => {
      renderer.start();
      const firstCallCount = (global.requestAnimationFrame as any).mock.calls.length;
      
      renderer.start();
      const secondCallCount = (global.requestAnimationFrame as any).mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should cleanup resources on destroy', () => {
      const vertexShader = 'attribute vec2 position; void main() {}';
      const fragmentShader = 'void main() { gl_FragColor = vec4(1.0); }';
      
      renderer.compile(vertexShader, fragmentShader);
      renderer.destroy();

      expect(mockGl.deleteProgram).toHaveBeenCalled();
      expect(mockGl.deleteBuffer).toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should resize canvas', () => {
      renderer.resize(1920, 1080);
      
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
      expect(mockGl.viewport).toHaveBeenCalledWith(0, 0, 1920, 1080);
    });

    it('should call onFrame callback', () => {
      const onFrame = vi.fn();
      renderer.setOnFrameCallback(onFrame);
      
      const vertexShader = 'attribute vec2 position; void main() {}';
      const fragmentShader = 'void main() { gl_FragColor = vec4(1.0); }';
      renderer.compile(vertexShader, fragmentShader);
      
      // renderFrameはonFrameコールバックを呼び出すはず
      renderer.renderFrame();
      
      expect(onFrame).toHaveBeenCalled();
    });

    it('should handle render without program gracefully', () => {
      // Should not throw
      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should return canvas', () => {
      expect(renderer.getCanvas()).toBe(canvas);
    });

    it('should return uniform values', () => {
      // キャンバスのサイズを設定
      canvas.width = 800;
      canvas.height = 600;
      
      const uniforms = renderer.getUniformValues();
      
      expect(uniforms).toHaveProperty('time');
      expect(uniforms).toHaveProperty('resolution');
      expect(uniforms.resolution).toEqual([800, 600]);
    });
  });
});