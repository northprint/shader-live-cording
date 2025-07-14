import type { VideoExportOptions, AudioSyncExportOptions, ExportResult } from './types';

/**
 * Video recording and export functionality
 */
export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recordingPromise: Promise<Blob> | null = null;

  /**
   * Start video recording
   */
  async startRecording(
    canvas: HTMLCanvasElement,
    options: VideoExportOptions
  ): Promise<void> {
    try {
      // キャンバスからストリームを取得
      const stream = canvas.captureStream(options.fps);
      
      // MediaRecorderの設定
      const mimeType = 'video/webm;codecs=vp9';
      const videoBitsPerSecond = options.videoBitsPerSecond || 8000000; // 8Mbps
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond
      });
      
      this.chunks = [];
      
      // データ収集
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      
      // 録画完了時の処理
      this.recordingPromise = new Promise((resolve) => {
        if (this.mediaRecorder) {
          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.chunks, { type: 'video/webm' });
            resolve(blob);
          };
        }
      });
      
      // 録画開始
      this.mediaRecorder.start();
      
      // 指定時間後に自動停止
      if (options.duration > 0) {
        setTimeout(() => this.stopRecording(), options.duration);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop video recording
   */
  async stopRecording(): Promise<ExportResult> {
    try {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        throw new Error('No active recording');
      }
      
      this.mediaRecorder.stop();
      
      // 録画完了を待つ
      const blob = await this.recordingPromise!;
      
      // ファイル名の生成
      const filename = this.generateFilename();
      
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
      console.error('Failed to stop recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.cleanup();
    }
  }

  /**
   * Record video with audio synchronization
   */
  static async recordWithAudio(
    canvas: HTMLCanvasElement,
    options: AudioSyncExportOptions
  ): Promise<ExportResult> {
    try {
      // ビデオストリームを取得
      const videoStream = canvas.captureStream(options.fps);
      
      // オーディオストリームを作成
      const audioDestination = options.audioContext.createMediaStreamDestination();
      const audioSource = options.audioContext.createBufferSource();
      audioSource.buffer = options.audioBuffer;
      audioSource.connect(audioDestination);
      
      // ストリームを結合
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);
      
      // MediaRecorderの設定
      const mimeType = 'video/webm;codecs=vp9,opus';
      const videoBitsPerSecond = options.videoBitsPerSecond || 8000000;
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      // 録画完了の Promise
      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });
      
      // 音声と同期して録画開始
      mediaRecorder.start();
      audioSource.start(0);
      
      // 指定時間後に停止
      setTimeout(() => {
        mediaRecorder.stop();
        audioSource.stop();
      }, options.duration);
      
      // 録画完了を待つ
      const blob = await recordingPromise;
      
      // ファイルの保存
      const filename = options.filename || VideoExporter.generateFilename();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      await save(uint8Array, {
        baseDir: BaseDirectory.Video,
        path: filename
      });
      
      return {
        success: true,
        filename,
        blob
      };
    } catch (error) {
      console.error('Audio sync recording failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recording state
   */
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.mediaRecorder = null;
    this.chunks = [];
    this.recordingPromise = null;
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `shader-recording-${timestamp}.webm`;
  }

  private generateFilename(): string {
    return VideoExporter.generateFilename();
  }
}