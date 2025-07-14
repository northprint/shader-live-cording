import type { AudioAnalysisData } from '../../types/audio';

export interface CompileResult {
  success: boolean;
  program?: any;
  errors?: string[];
  warnings?: string[];
}

export interface RendererInterface {
  /**
   * Compile and prepare the code for rendering
   */
  compile(code: string, secondaryCode?: string): CompileResult;
  
  /**
   * Set audio analysis data
   */
  setAudioData(data: AudioAnalysisData): void;
  
  /**
   * Render a frame
   */
  render(): void;
  
  /**
   * Force render a single frame
   */
  renderFrame(): void;
  
  /**
   * Start animation loop
   */
  start(): void;
  
  /**
   * Stop animation loop
   */
  stop(): void;
  
  /**
   * Resize the rendering canvas
   */
  resize(width: number, height: number): void;
  
  /**
   * Clean up resources
   */
  destroy(): void;
  
  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement;
  
  /**
   * Set callback for frame updates
   */
  setOnFrameCallback?(callback: () => void): void;
  
  /**
   * Get current uniform values (for export)
   */
  getUniformValues?(): Record<string, number | number[]>;
}