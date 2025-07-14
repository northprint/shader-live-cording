import type { AudioAnalysisData, AudioSettings } from '../../types/audio';

export class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private dataArray: Uint8Array;
  private frequencyData: Float32Array;
  private settings: AudioSettings;
  private _audioBuffer: AudioBuffer | null = null;
  private currentUrl: string | null = null;
  
  // ビート検出用
  private beatDetector: BeatDetector;
  
  get audioBuffer(): AudioBuffer | null {
    return this._audioBuffer;
  }
  
  get audioContextInstance(): AudioContext {
    return this.audioContext;
  }
  
  constructor(settings?: Partial<AudioSettings>) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    
    this.settings = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      ...settings
    };
    
    this.analyser.fftSize = this.settings.fftSize;
    this.analyser.smoothingTimeConstant = this.settings.smoothingTimeConstant;
    this.analyser.minDecibels = this.settings.minDecibels;
    this.analyser.maxDecibels = this.settings.maxDecibels;
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.frequencyData = new Float32Array(bufferLength);
    
    this.beatDetector = new BeatDetector();
  }
  
  async loadAudioFile(file: File): Promise<void> {
    // 前のURLをクリーンアップ
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
    }
    
    const url = URL.createObjectURL(file);
    this.currentUrl = url;
    
    try {
      await this.loadAudioUrl(url);
    } catch (error) {
      // エラーが発生した場合はURLをクリーンアップ
      URL.revokeObjectURL(url);
      this.currentUrl = null;
      throw error;
    }
  }
  
  async loadAudioUrl(url: string): Promise<void> {
    // 既存のオーディオを停止
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.remove();
    }
    
    // AudioContextが一時停止状態の場合は再開
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.audioElement = new Audio(url);
    // ローカルファイルの場合はcrossOriginを設定しない
    if (!url.startsWith('blob:')) {
      this.audioElement.crossOrigin = 'anonymous';
    }
    
    // オーディオ要素にイベントリスナーを追加
    this.audioElement.addEventListener('canplaythrough', () => {
      console.log('Audio can play through');
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.error('Audio element error:', e);
    });
    
    // ファイルをロードしてから接続
    await new Promise<void>((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error('Audio element not created'));
        return;
      }
      
      this.audioElement.addEventListener('loadedmetadata', () => {
        resolve();
      }, { once: true });
      
      this.audioElement.addEventListener('error', (e) => {
        reject(new Error('Failed to load audio file'));
      }, { once: true });
      
      this.audioElement.load();
    });
    
    if (this.source) {
      this.source.disconnect();
    }
    
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // 自動再生はしない（ユーザーインタラクションが必要）
    console.log('Audio loaded successfully');
  }
  
  play(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }
  
  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }
  
  getAnalysisData(): AudioAnalysisData {
    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getFloatFrequencyData(this.frequencyData);
    
    // 周波数帯域の分割（低音、中音、高音）
    const bassEnd = Math.floor(this.dataArray.length * 0.1);
    const midEnd = Math.floor(this.dataArray.length * 0.5);
    
    let bass = 0, mid = 0, treble = 0;
    
    for (let i = 0; i < bassEnd; i++) {
      bass += this.dataArray[i];
    }
    bass /= bassEnd;
    
    for (let i = bassEnd; i < midEnd; i++) {
      mid += this.dataArray[i];
    }
    mid /= (midEnd - bassEnd);
    
    for (let i = midEnd; i < this.dataArray.length; i++) {
      treble += this.dataArray[i];
    }
    treble /= (this.dataArray.length - midEnd);
    
    // 全体のボリューム
    const volume = this.dataArray.reduce((sum, val) => sum + val, 0) / this.dataArray.length;
    
    // ビート検出
    const beat = this.beatDetector.detect(bass);
    const bpm = this.beatDetector.getBPM();
    
    // 波形データ（時間領域）
    const waveform = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(waveform);
    
    return {
      frequency: this.frequencyData,
      waveform,
      bpm,
      beat,
      bass: bass / 255,
      mid: mid / 255,
      treble: treble / 255,
      volume: volume / 255
    };
  }
  
  destroy(): void {
    // オーディオを停止
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.remove();
      this.audioElement = null;
    }
    
    // ソースを切断
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // アナライザーを切断
    if (this.analyser) {
      this.analyser.disconnect();
    }
    
    // URLをクリーンアップ
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    
    // オーディオコンテキストを閉じる
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// 簡易的なビート検出クラス
class BeatDetector {
  private history: number[] = [];
  private beatTimes: number[] = [];
  private threshold = 1.3;
  private historySize = 43;
  
  detect(energy: number): boolean {
    this.history.push(energy);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
    
    if (this.history.length < this.historySize) {
      return false;
    }
    
    const average = this.history.reduce((a, b) => a + b) / this.history.length;
    const isBeat = energy > average * this.threshold;
    
    if (isBeat) {
      const now = Date.now();
      this.beatTimes.push(now);
      
      // 古いビート情報を削除（10秒以上前）
      this.beatTimes = this.beatTimes.filter(time => now - time < 10000);
    }
    
    return isBeat;
  }
  
  getBPM(): number {
    if (this.beatTimes.length < 2) {
      return 0;
    }
    
    const intervals: number[] = [];
    for (let i = 1; i < this.beatTimes.length; i++) {
      intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
    }
    
    if (intervals.length === 0) {
      return 0;
    }
    
    const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    return Math.round(60000 / averageInterval);
  }
}