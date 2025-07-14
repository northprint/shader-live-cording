import type { ImageExportOptions, ExportResult } from './types';

/**
 * Export canvas as image file
 */
export class ImageExporter {
  /**
   * Export current frame as image
   * @param canvas WebGL canvas element
   * @param options Export options
   * @param renderFrame Function to render a frame before capturing
   */
  static async exportImage(
    canvas: HTMLCanvasElement,
    options: ImageExportOptions,
    renderFrame?: () => void
  ): Promise<ExportResult> {
    try {
      // WebGLの描画バッファを保持するため、必要に応じて再レンダリング
      if (renderFrame) {
        renderFrame();
      }

      // 解像度の設定
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      
      if (options.width || options.height) {
        const width = options.width || originalWidth;
        const height = options.height || originalHeight;
        
        // 一時的にキャンバスサイズを変更
        canvas.width = width;
        canvas.height = height;
        
        // リサイズ後に再レンダリング
        if (renderFrame) {
          renderFrame();
        }
      }

      // Blobに変換
      const blob = await this.canvasToBlob(canvas, options);
      
      // 元のサイズに戻す
      if (options.width || options.height) {
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        
        if (renderFrame) {
          renderFrame();
        }
      }

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // ファイル名の生成
      const filename = options.filename || this.generateFilename(options.format);
      
      // ブラウザのFile APIを使用してダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename,
        blob
      };
    } catch (error) {
      console.error('Image export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert canvas to blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    options: ImageExportOptions
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = options.format === 'jpg' ? (options.quality || 0.9) : undefined;
      
      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        quality
      );
    });
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `shader-export-${timestamp}.${format}`;
  }

  /**
   * Create high-resolution screenshot
   * @param canvas Current canvas
   * @param width Target width
   * @param height Target height
   * @param renderFrame Render function
   */
  static async createHighResScreenshot(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    renderFrame: (canvas: HTMLCanvasElement) => void
  ): Promise<HTMLCanvasElement> {
    // 新しいキャンバスを作成
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    
    // WebGLコンテキストをコピー（新しいコンテキストで再レンダリング）
    renderFrame(offscreenCanvas);
    
    return offscreenCanvas;
  }
}