import type { ShaderCompileResult, ShaderUniform } from '../../types/shader';
import type { AudioAnalysisData } from '../../types/audio';
import type { RendererInterface, CompileResult } from './RendererInterface';

export class WebGLRenderer implements RendererInterface {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private animationId: number | null = null;
  private startTime: number = Date.now();
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private audioData: AudioAnalysisData | null = null;
  private audioTexture: WebGLTexture | null = null;
  private onFrame?: () => void;
  private mouseX: number = 0;
  private mouseY: number = 0;
  
  constructor(canvas: HTMLCanvasElement, preserveDrawingBuffer: boolean = false) {
    this.canvas = canvas;
    const contextOptions = {
      preserveDrawingBuffer,
      antialias: true,
      alpha: false
    };
    
    const gl = canvas.getContext('webgl2', contextOptions) || 
               canvas.getContext('webgl', contextOptions);
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;
    this.initializeBuffers();
  }
  
  private initializeBuffers(): void {
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ]);
    
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }
  
  compile(vertexSource: string, fragmentSource?: string): CompileResult {
    // P5.jsモードとの互換性のため、第2引数をオプショナルに
    if (!fragmentSource) {
      // GLSLモードでは両方必要
      return { success: false, errors: ['Fragment shader is required for GLSL mode'] };
    }
    const gl = this.gl;
    
    // バーテックスシェーダーのコンパイル
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      return { success: false, errors: ['Failed to create vertex shader'] };
    }
    
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vertexShader) || 'Unknown vertex shader error';
      gl.deleteShader(vertexShader);
      return { success: false, errors: [error] };
    }
    
    // フラグメントシェーダーのコンパイル
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      gl.deleteShader(vertexShader);
      return { success: false, errors: ['Failed to create fragment shader'] };
    }
    
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader) || 'Unknown fragment shader error';
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return { success: false, errors: [error] };
    }
    
    // プログラムのリンク
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return { success: false, errors: ['Failed to create shader program'] };
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program) || 'Unknown linking error';
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return { success: false, errors: [error] };
    }
    
    // 古いプログラムをクリーンアップ
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    
    this.program = program;
    this.uniforms.clear();
    
    // デフォルトのuniform変数を取得
    const defaultUniforms = [
      'time', 'resolution', 'mouse',
      'audioVolume', 'audioBass', 'audioMid', 'audioTreble',
      'audioBeat', 'audioBPM', 'audioFrequency'
    ];
    defaultUniforms.forEach(name => {
      const location = gl.getUniformLocation(program, name);
      if (location) {
        this.uniforms.set(name, location);
      }
    });
    
    // 音楽用テクスチャの初期化
    if (!this.audioTexture) {
      this.audioTexture = gl.createTexture();
    }
    
    return { success: true, program };
  }
  
  setUniform(name: string, value: number | number[]): void {
    if (!this.program) return;
    
    const location = this.gl.getUniformLocation(this.program, name);
    if (!location) return;
    
    this.gl.useProgram(this.program);
    
    if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (value.length === 2) {
      this.gl.uniform2fv(location, value);
    } else if (value.length === 3) {
      this.gl.uniform3fv(location, value);
    } else if (value.length === 4) {
      this.gl.uniform4fv(location, value);
    }
  }
  
  render(): void {
    if (!this.program || !this.vertexBuffer) return;
    
    const gl = this.gl;
    
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    
    // バーテックスバッファをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    const positionLocation = gl.getAttribLocation(this.program, 'position');
    if (positionLocation !== -1) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }
    
    // デフォルトのuniform変数を設定
    const time = (Date.now() - this.startTime) / 1000;
    this.setUniform('time', time);
    this.setUniform('resolution', [gl.canvas.width, gl.canvas.height]);
    this.setUniform('mouse', [this.mouseX, this.mouseY]);
    
    // 音楽データの設定
    if (this.audioData) {
      this.setUniform('audioVolume', this.audioData.volume);
      this.setUniform('audioBass', this.audioData.bass);
      this.setUniform('audioMid', this.audioData.mid);
      this.setUniform('audioTreble', this.audioData.treble);
      this.setUniform('audioBeat', this.audioData.beat ? 1.0 : 0.0);
      this.setUniform('audioBPM', this.audioData.bpm);
      
      // 周波数データをテクスチャとして送信
      this.updateAudioTexture();
    }
    
    // 描画
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  setAudioData(data: AudioAnalysisData): void {
    this.audioData = data;
  }
  
  private updateAudioTexture(): void {
    if (!this.audioTexture || !this.audioData || !this.program) return;
    
    const gl = this.gl;
    const location = gl.getUniformLocation(this.program, 'audioFrequency');
    if (!location) return;
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
    
    // 周波数データを0-255の範囲に正規化
    const normalizedData = new Uint8Array(this.audioData.frequency.length);
    for (let i = 0; i < this.audioData.frequency.length; i++) {
      // dBFSから0-1の範囲に変換（-90dB to 0dB）
      const normalized = (this.audioData.frequency[i] + 90) / 90;
      normalizedData[i] = Math.floor(Math.max(0, Math.min(1, normalized)) * 255);
    }
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      normalizedData.length,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      normalizedData
    );
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.uniform1i(location, 0);
  }
  
  start(): void {
    if (this.animationId !== null) return;
    
    const animate = () => {
      this.render();
      if (this.onFrame) {
        this.onFrame();
      }
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }
  
  destroy(): void {
    this.stop();
    
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
    }
    
    if (this.audioTexture) {
      this.gl.deleteTexture(this.audioTexture);
    }
  }
  
  setOnFrameCallback(callback: () => void): void {
    this.onFrame = callback;
  }
  
  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Get the current fragment shader source
   */
  getCurrentFragmentShader(): string | null {
    // この情報は外部で管理される必要があります
    // ExportManagerと統合する際に、シェーダーコードを渡す必要があります
    return null;
  }
  
  /**
   * Force render a single frame (useful for exports)
   */
  renderFrame(): void {
    this.render();
    if (this.onFrame) {
      this.onFrame();
    }
  }
  
  /**
   * Get current uniform values
   */
  getUniformValues(): Record<string, number | number[]> {
    // 現在のuniform値を返す（エクスポート用）
    const values: Record<string, number | number[]> = {
      time: (Date.now() - this.startTime) / 1000,
      resolution: [this.canvas.width, this.canvas.height],
      mouse: [this.mouseX, this.mouseY]
    };
    
    if (this.audioData) {
      values.audioVolume = this.audioData.volume;
      values.audioBass = this.audioData.bass;
      values.audioMid = this.audioData.mid;
      values.audioTreble = this.audioData.treble;
      values.audioBeat = this.audioData.beat ? 1.0 : 0.0;
      values.audioBPM = this.audioData.bpm;
    }
    
    return values;
  }
  
  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }
}