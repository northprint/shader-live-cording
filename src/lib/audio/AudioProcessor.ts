/**
 * オーディオ処理の統合クラス
 * AudioAnalyzerとAudioEffectsを橋渡しする
 */

import { AudioAnalyzer } from './AudioAnalyzer';
import type { AudioAnalysisData } from '../../types/audio';

export interface AudioProcessorOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export interface EffectParameters {
  filterFreq: number;
  filterType: BiquadFilterType;
  delayTime: number;
  delayFeedback: number;
  reverbMix: number;
  distortionAmount: number;
  compressorThreshold: number;
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private analyzer: AudioAnalyzer;
  private sourceNode: AudioNode | null = null;
  
  // エフェクトノード
  private inputGain: GainNode;
  private filter: BiquadFilterNode;
  private delay: DelayNode;
  private delayFeedback: GainNode;
  private reverb: ConvolverNode | null = null;
  private distortion: WaveShaperNode;
  private compressor: DynamicsCompressorNode;
  private outputGain: GainNode;
  
  // エフェクトパラメータ
  private effectParams: EffectParameters = {
    filterFreq: 1000,
    filterType: 'lowpass',
    delayTime: 0.25,
    delayFeedback: 0.3,
    reverbMix: 0.2,
    distortionAmount: 0,
    compressorThreshold: -12
  };
  
  constructor(options: AudioProcessorOptions = {}) {
    this.audioContext = new AudioContext();
    this.analyzer = new AudioAnalyzer(options);
    
    // エフェクトチェーンの構築
    this.inputGain = this.audioContext.createGain();
    this.filter = this.audioContext.createBiquadFilter();
    this.delay = this.audioContext.createDelay(2);
    this.delayFeedback = this.audioContext.createGain();
    this.distortion = this.audioContext.createWaveShaper();
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.outputGain = this.audioContext.createGain();
    
    // デフォルト設定
    this.setupEffects();
    this.connectEffectChain();
  }
  
  private setupEffects() {
    // フィルター
    this.filter.type = this.effectParams.filterType;
    this.filter.frequency.value = this.effectParams.filterFreq;
    
    // ディレイ
    this.delay.delayTime.value = this.effectParams.delayTime;
    this.delayFeedback.gain.value = this.effectParams.delayFeedback;
    
    // ディストーション
    this.updateDistortionCurve(this.effectParams.distortionAmount);
    
    // コンプレッサー
    this.compressor.threshold.value = this.effectParams.compressorThreshold;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
  }
  
  private connectEffectChain() {
    // エフェクトチェーンの接続
    // Input -> Filter -> Delay -> Distortion -> Compressor -> Output
    this.inputGain.connect(this.filter);
    this.filter.connect(this.delay);
    this.filter.connect(this.distortion); // ドライシグナル
    
    // ディレイフィードバックループ
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    this.delay.connect(this.distortion);
    
    this.distortion.connect(this.compressor);
    this.compressor.connect(this.outputGain);
    
    // アナライザーに接続
    this.outputGain.connect(this.analyzer.getAnalyserNode());
  }
  
  /**
   * オーディオファイルを読み込み
   */
  async loadAudioFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // 既存のソースを停止
    this.stopCurrentSource();
    
    // 新しいソースを作成
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    
    // エフェクトチェーンに接続
    source.connect(this.inputGain);
    source.start();
    
    this.sourceNode = source;
  }
  
  /**
   * マイク入力を開始
   */
  async startMicrophoneInput(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // 既存のソースを停止
    this.stopCurrentSource();
    
    // エフェクトチェーンに接続
    source.connect(this.inputGain);
    this.sourceNode = source;
  }
  
  /**
   * 現在のソースを停止
   */
  private stopCurrentSource() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      if ('stop' in this.sourceNode) {
        (this.sourceNode as AudioBufferSourceNode).stop();
      }
      this.sourceNode = null;
    }
  }
  
  /**
   * エフェクトパラメータを更新
   */
  updateEffectParameters(params: Partial<EffectParameters>) {
    Object.assign(this.effectParams, params);
    
    if (params.filterFreq !== undefined) {
      this.filter.frequency.value = params.filterFreq;
    }
    if (params.filterType !== undefined) {
      this.filter.type = params.filterType;
    }
    if (params.delayTime !== undefined) {
      this.delay.delayTime.value = params.delayTime;
    }
    if (params.delayFeedback !== undefined) {
      this.delayFeedback.gain.value = params.delayFeedback;
    }
    if (params.distortionAmount !== undefined) {
      this.updateDistortionCurve(params.distortionAmount);
    }
    if (params.compressorThreshold !== undefined) {
      this.compressor.threshold.value = params.compressorThreshold;
    }
  }
  
  /**
   * ディストーションカーブを更新
   */
  private updateDistortionCurve(amount: number) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    this.distortion.curve = curve;
  }
  
  /**
   * 分析データを取得（エフェクトパラメータ付き）
   */
  getAnalysisData(): AudioAnalysisData & { effects: EffectParameters } {
    const analysisData = this.analyzer.getAnalysisData();
    
    return {
      ...analysisData,
      effects: { ...this.effectParams }
    };
  }
  
  /**
   * リソースをクリーンアップ
   */
  destroy() {
    this.stopCurrentSource();
    this.analyzer.destroy();
    
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}