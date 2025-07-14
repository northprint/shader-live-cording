import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { P5Renderer } from './P5Renderer';
import type { AudioAnalysisData } from '../../types/audio';

// P5.jsのモック
vi.mock('p5', () => ({
  default: vi.fn().mockImplementation((sketch, container) => {
    const mockP5 = {
      createCanvas: vi.fn(),
      resizeCanvas: vi.fn(),
      redraw: vi.fn(),
      loop: vi.fn(),
      noLoop: vi.fn(),
      remove: vi.fn(),
      frameCount: 0,
      canvas: document.createElement('canvas')
    };
    
    // スケッチ関数を実行してsetupとdrawを設定
    sketch(mockP5);
    
    return mockP5;
  })
}));

describe('P5Renderer', () => {
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let renderer: P5Renderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    container = document.createElement('div');
    container.appendChild(canvas);
    document.body.appendChild(container);
    
    renderer = new P5Renderer(canvas);
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should create a P5Renderer instance', () => {
      expect(renderer).toBeDefined();
      expect(renderer.getCanvas()).toBeDefined();
    });
  });

  describe('code compilation', () => {
    const validP5Code = `
      function setup() {
        createCanvas(800, 600);
      }
      
      function draw() {
        background(0);
        fill(255);
        circle(mouseX, mouseY, 50);
      }
    `;

    const invalidP5Code = `
      // Missing setup and draw functions
      let x = 0;
    `;

    it('should compile valid P5.js code', () => {
      const result = renderer.compile(validP5Code);
      
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject code without setup and draw functions', () => {
      const result = renderer.compile(invalidP5Code);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('P5.js code must include setup() and draw() functions');
    });

    it('should handle syntax errors', () => {
      const syntaxErrorCode = `
        function setup() {
          createCanvas(800, 600
        }
        
        function draw() {
          background(0);
        }
      `;

      const result = renderer.compile(syntaxErrorCode);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('missing ) after argument list');
    });
  });

  describe('audio data integration', () => {
    it('should set audio data', () => {
      const audioData: AudioAnalysisData = {
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
      
      // グローバル変数として設定されているか確認
      expect((window as any).audioData).toEqual(audioData);
    });

    it('should provide audio data to P5.js sketch', () => {
      const p5CodeWithAudio = `
        function setup() {
          createCanvas(800, 600);
        }
        
        function draw() {
          if (audioData) {
            background(audioData.volume * 255);
          }
        }
      `;

      const audioData: AudioAnalysisData = {
        volume: 0.5,
        bass: 0.3,
        mid: 0.5,
        treble: 0.7,
        frequency: new Float32Array(1024),
        waveform: new Float32Array(1024),
        beat: false,
        bpm: 120
      };

      renderer.compile(p5CodeWithAudio);
      renderer.setAudioData(audioData);
      
      const uniformValues = renderer.getUniformValues();
      expect(uniformValues.audioVolume).toBe(0.5);
      expect(uniformValues.audioBass).toBe(0.3);
    });
  });

  describe('lifecycle methods', () => {
    beforeEach(() => {
      const validCode = `
        function setup() {
          createCanvas(800, 600);
        }
        function draw() {
          background(0);
        }
      `;
      renderer.compile(validCode);
    });

    it('should start and stop animation', () => {
      const p5Instance = (renderer as any).p5Instance;
      
      renderer.start();
      expect(p5Instance.loop).toHaveBeenCalled();
      
      renderer.stop();
      expect(p5Instance.noLoop).toHaveBeenCalled();
    });

    it('should handle resize', () => {
      const p5Instance = (renderer as any).p5Instance;
      
      renderer.resize(1920, 1080);
      
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
      expect(p5Instance.resizeCanvas).toHaveBeenCalledWith(1920, 1080);
    });

    it('should render frame', () => {
      const p5Instance = (renderer as any).p5Instance;
      const onFrame = vi.fn();
      
      renderer.setOnFrameCallback(onFrame);
      renderer.renderFrame();
      
      expect(p5Instance.redraw).toHaveBeenCalled();
      expect(onFrame).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const validCode = `
        function setup() {
          createCanvas(800, 600);
        }
        function draw() {
          background(0);
        }
      `;
      
      renderer.compile(validCode);
      const p5Instance = (renderer as any).p5Instance;
      
      renderer.destroy();
      
      expect(p5Instance.remove).toHaveBeenCalled();
      expect((window as any).audioData).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should return canvas', () => {
      const validCode = `
        function setup() {
          createCanvas(800, 600);
        }
        function draw() {
          background(0);
        }
      `;
      
      renderer.compile(validCode);
      const canvas = renderer.getCanvas();
      
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should return uniform values', () => {
      const values = renderer.getUniformValues();
      
      expect(values).toHaveProperty('frameCount');
      expect(values).toHaveProperty('width');
      expect(values).toHaveProperty('height');
    });
  });
});