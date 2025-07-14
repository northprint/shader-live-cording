/**
 * Export format options
 */
export type ImageFormat = 'png' | 'jpg';
export type VideoFormat = 'webm';

/**
 * Image export options
 */
export interface ImageExportOptions {
  format: ImageFormat;
  quality?: number; // 0-1, JPEGの場合のみ有効
  width?: number;
  height?: number;
  filename?: string;
}

/**
 * Video export options
 */
export interface VideoExportOptions {
  format: VideoFormat;
  duration: number; // ミリ秒単位
  fps: 25 | 30 | 60;
  videoBitsPerSecond?: number;
  filename?: string;
  includeAudio?: boolean;
}

/**
 * HTML export options
 */
export interface HTMLExportOptions {
  includeAudio?: boolean;
  minify?: boolean;
  filename?: string;
  uniforms?: Record<string, any>;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  blob?: Blob;
}

/**
 * Audio sync export options
 */
export interface AudioSyncExportOptions extends VideoExportOptions {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
}

/**
 * Canvas preservation options
 */
export interface CanvasPreservationOptions {
  preserveDrawingBuffer?: boolean;
  antialias?: boolean;
  alpha?: boolean;
}