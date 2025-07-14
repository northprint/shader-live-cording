import type { RendererInterface, CompileResult } from './RendererInterface';
import type { AudioAnalysisData } from '../../types/audio';
import p5 from 'p5';

export class P5Renderer implements RendererInterface {
  private canvas: HTMLCanvasElement;
  private p5Instance: p5 | null = null;
  private userCode: string = '';
  private audioData: AudioAnalysisData | null = null;
  private onFrame?: () => void;
  private isRunning = false;
  private containerElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // P5.jsはcanvasの親要素にマウントする
    this.containerElement = canvas.parentElement || document.body;
  }

  compile(code: string): CompileResult {
    this.userCode = code;
    
    try {
      // 基本的なシンタックスチェック
      // setupとdraw関数が存在するかチェック
      if (!code.includes('function setup') && !code.includes('function draw')) {
        return {
          success: false,
          errors: ['P5.js code must include setup() and draw() functions']
        };
      }

      // シンタックスチェック
      new Function(`
        let audioData = {};
        ${code}
      `);

      // P5インスタンスを再初期化
      this.initP5Instance();
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  private initP5Instance(): void {
    // 既存のインスタンスをクリーンアップ
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }

    // グローバル変数としてaudioDataを設定
    (window as any).audioData = this.audioData;

    const sketch = (p: p5) => {
      // ユーザーコードを実行して関数を取得
      let setupFn: Function | null = null;
      let drawFn: Function | null = null;
      let windowResizedFn: Function | null = null;

      // ユーザーコードを評価
      try {
        const evalCode = new Function('p', `
          with (p) {
            // ユーザーコード
          
            ${this.userCode}
            
            // 関数を返す
            return {
              setup: typeof setup !== 'undefined' ? setup : null,
              draw: typeof draw !== 'undefined' ? draw : null,
              windowResized: typeof windowResized !== 'undefined' ? windowResized : null
            };
          }
        `);
        
        const result = evalCode(p);
        setupFn = result.setup;
        drawFn = result.draw;
        windowResizedFn = result.windowResized;
      } catch (error) {
        console.error('Error evaluating P5.js code:', error);
      }

      p.setup = () => {
        // 既存のcanvasを削除
        if (this.canvas.parentElement) {
          this.canvas.style.display = 'none';
        }
        
        // P5.jsのcanvasを作成
        p.createCanvas(this.canvas.width, this.canvas.height);
        
        // ユーザーのsetup関数を実行
        if (setupFn) {
          try {
            setupFn();
          } catch (error) {
            console.error('Error in setup():', error);
          }
        }
      };

      p.draw = () => {
        // audioDataを更新
        (window as any).audioData = this.audioData;

        // ユーザーのdraw関数を実行
        if (drawFn) {
          try {
            drawFn();
          } catch (error) {
            console.error('Error in draw():', error);
          }
        }

        // フレームコールバック
        if (this.onFrame && this.isRunning) {
          this.onFrame();
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(this.canvas.width, this.canvas.height);
        
        // ユーザーのwindowResized関数を実行
        if (windowResizedFn) {
          try {
            windowResizedFn();
          } catch (error) {
            console.error('Error in windowResized():', error);
          }
        }
      };
    };

    // P5インスタンスを作成
    this.p5Instance = new p5(sketch, this.containerElement);
  }

  setAudioData(data: AudioAnalysisData): void {
    this.audioData = data;
    // グローバル変数も更新
    (window as any).audioData = data;
  }

  render(): void {
    // P5.jsは自動的にdraw()を呼び出すため、特別な処理は不要
  }

  renderFrame(): void {
    // P5.jsの場合、redraw()を呼び出す
    if (this.p5Instance) {
      this.p5Instance.redraw();
    }
    
    if (this.onFrame) {
      this.onFrame();
    }
  }

  start(): void {
    this.isRunning = true;
    if (this.p5Instance) {
      this.p5Instance.loop();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.p5Instance) {
      this.p5Instance.noLoop();
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.p5Instance) {
      this.p5Instance.resizeCanvas(width, height);
    }
  }

  destroy(): void {
    this.stop();
    
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }

    // 元のcanvasを表示
    this.canvas.style.display = 'block';

    // グローバル変数をクリーンアップ
    delete (window as any).audioData;
  }

  getCanvas(): HTMLCanvasElement {
    // P5.jsが作成したcanvasを返す
    if (this.p5Instance && this.p5Instance.canvas) {
      return this.p5Instance.canvas as HTMLCanvasElement;
    }
    return this.canvas;
  }

  setOnFrameCallback(callback: () => void): void {
    this.onFrame = callback;
  }

  getUniformValues(): Record<string, number | number[]> {
    // P5.jsの場合、audioDataの値を返す
    const values: Record<string, any> = {
      frameCount: this.p5Instance ? this.p5Instance.frameCount : 0,
      width: this.canvas.width,
      height: this.canvas.height
    };

    if (this.audioData) {
      values.audioVolume = this.audioData.volume;
      values.audioBass = this.audioData.bass;
      values.audioMid = this.audioData.mid;
      values.audioTreble = this.audioData.treble;
      values.audioBeat = this.audioData.beat;
      values.audioBPM = this.audioData.bpm;
    }

    return values;
  }
}