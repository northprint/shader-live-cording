import { writable } from 'svelte/store';
import type { AudioAnalysisData } from '../types/audio';

// デフォルトの音楽解析データ
const defaultAudioData: AudioAnalysisData = {
  frequency: new Float32Array(1024),
  waveform: new Float32Array(2048),
  bpm: 0,
  beat: false,
  bass: 0,
  mid: 0,
  treble: 0,
  volume: 0
};

export const audioData = writable<AudioAnalysisData>(defaultAudioData);
export const isAudioLoaded = writable<boolean>(false);
export const audioFileName = writable<string>('');