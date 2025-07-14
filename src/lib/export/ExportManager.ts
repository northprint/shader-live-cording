import { ImageExporter } from './imageExporter';
import { VideoExporter } from './videoExporter';
import { HTMLExporter } from './htmlExporter';
import type {
  ImageExportOptions,
  VideoExportOptions,
  HTMLExportOptions,
  AudioSyncExportOptions,
  ExportResult,
  CanvasPreservationOptions
} from './types';

/**
 * Main export manager that coordinates all export functionality
 */
export class ExportManager {
  private canvas: HTMLCanvasElement;
  private renderFrame: () => void;
  private videoExporter: VideoExporter;

  constructor(canvas: HTMLCanvasElement, renderFrame: () => void) {
    this.canvas = canvas;
    this.renderFrame = renderFrame;
    this.videoExporter = new VideoExporter();
  }

  /**
   * Export current frame as image
   */
  async exportImage(options: ImageExportOptions): Promise<ExportResult> {
    return ImageExporter.exportImage(this.canvas, options, this.renderFrame);
  }

  /**
   * Start video recording
   */
  async startVideoRecording(options: VideoExportOptions): Promise<void> {
    return this.videoExporter.startRecording(this.canvas, options);
  }

  /**
   * Stop video recording and save file
   */
  async stopVideoRecording(): Promise<ExportResult> {
    return this.videoExporter.stopRecording();
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.videoExporter.isRecording();
  }

  /**
   * Export as standalone HTML file
   */
  async exportHTML(
    fragmentShaderCode: string,
    options: HTMLExportOptions
  ): Promise<ExportResult> {
    return HTMLExporter.exportHTML(fragmentShaderCode, options);
  }

  /**
   * Export HTML with audio visualization support
   */
  async exportHTMLWithAudio(
    fragmentShaderCode: string,
    options: HTMLExportOptions & { audioVisualization: boolean }
  ): Promise<ExportResult> {
    return HTMLExporter.exportHTMLWithAudio(fragmentShaderCode, options);
  }

  /**
   * Record video with synchronized audio
   */
  async recordWithAudio(options: AudioSyncExportOptions): Promise<ExportResult> {
    return VideoExporter.recordWithAudio(this.canvas, options);
  }

  /**
   * Export high-resolution screenshot
   */
  async exportHighResImage(
    width: number,
    height: number,
    options: ImageExportOptions
  ): Promise<ExportResult> {
    try {
      // 高解像度のスクリーンショットを作成
      const highResCanvas = await ImageExporter.createHighResScreenshot(
        this.canvas,
        width,
        height,
        (canvas) => {
          // カスタムレンダリング関数を呼び出す
          // これは実装側で提供される必要がある
          if (this.renderFrame) {
            this.renderFrame();
          }
        }
      );

      // 高解像度キャンバスから画像をエクスポート
      return ImageExporter.exportImage(highResCanvas, options);
    } catch (error) {
      console.error('High-res export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create canvas with proper WebGL context for export
   */
  static createExportCanvas(
    width: number,
    height: number,
    options?: CanvasPreservationOptions
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // WebGLコンテキストの取得（エクスポート用の設定）
    const contextOptions = {
      preserveDrawingBuffer: options?.preserveDrawingBuffer ?? true,
      antialias: options?.antialias ?? true,
      alpha: options?.alpha ?? false
    };

    const gl = canvas.getContext('webgl2', contextOptions) || 
               canvas.getContext('webgl', contextOptions);

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    return canvas;
  }

  /**
   * Batch export multiple formats
   */
  async batchExport(
    fragmentShaderCode: string,
    options: {
      image?: ImageExportOptions;
      html?: HTMLExportOptions;
      video?: VideoExportOptions;
    }
  ): Promise<Record<string, ExportResult>> {
    const results: Record<string, ExportResult> = {};

    // 画像エクスポート
    if (options.image) {
      results.image = await this.exportImage(options.image);
    }

    // HTMLエクスポート
    if (options.html) {
      results.html = await this.exportHTML(fragmentShaderCode, options.html);
    }

    // ビデオエクスポート
    if (options.video) {
      await this.startVideoRecording(options.video);
      // 録画時間待機
      await new Promise(resolve => setTimeout(resolve, options.video.duration));
      results.video = await this.stopVideoRecording();
    }

    return results;
  }

  /**
   * Update canvas reference (useful when canvas is recreated)
   */
  updateCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  /**
   * Update render function
   */
  updateRenderFunction(renderFrame: () => void): void {
    this.renderFrame = renderFrame;
  }
}