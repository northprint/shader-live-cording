export interface AudioAnalysisData {
  frequency: Float32Array;
  waveform: Float32Array;
  bpm: number;
  beat: boolean;
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  // エフェクトパラメータ（オプション）
  effectFilterFreq?: number;
  effectDelayTime?: number;
  effectReverbMix?: number;
  effectDistortion?: number;
  effectCompressor?: number;
}

export interface AudioSettings {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}