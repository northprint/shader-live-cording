import type { ShaderProgram, ShaderLanguage } from './shader';
import type { AudioSettings } from './audio';

/**
 * Project file format version for compatibility checking
 */
export const PROJECT_FILE_VERSION = '1.0.0';

/**
 * Project metadata information
 */
export interface ProjectMetadata {
  name: string;
  description?: string;
  author?: string;
  version: string;
  createdAt: Date | string; // ISO 8601 date string or Date object
  lastModified: Date | string; // ISO 8601 date string or Date object
  version: string; // ファイルフォーマットのバージョン
  tags?: string[];
}

/**
 * Tone.js synthesizer configuration
 */
export interface ToneSynthConfig {
  oscillator: {
    type: string; // Tone.ToneOscillatorType
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  volume: number;
}

/**
 * Tone.js sequence pattern
 */
export interface ToneSequencePattern {
  note: string;
  time: string;
}

/**
 * Sound programming state
 */
export interface SoundProgrammingState {
  isEnabled: boolean;
  synthConfig: ToneSynthConfig;
  sequencerPatterns: ToneSequencePattern[];
  bpm: number;
  selectedWaveform: string; // Tone.ToneOscillatorType
  customCode?: string; // カスタムTone.jsコード
}

/**
 * Audio state including loaded files and settings
 */
export interface AudioState {
  settings: AudioSettings;
  loadedFile?: {
    fileName: string;
    fileData?: string; // Base64エンコードされたオーディオデータ（オプション）
    fileReference?: string; // ファイルパスまたはURL
  };
  isEnabled: boolean;
}

/**
 * UI state for restoring interface configuration
 */
export interface UIState {
  selectedTab?: string;
  editorTheme?: string;
  paneSizes?: {
    editor?: number;
    preview?: number;
    controls?: number;
  };
  isVJMode?: boolean;
  isFullscreen?: boolean;
  showKeyboardHelp?: boolean;
  expandedPanels?: string[]; // 展開されているUIパネルのID
}

/**
 * Shader preset definition
 */
export interface ShaderPreset {
  id: string;
  name: string;
  shaderCode: string;
  language: ShaderLanguage;
  uniforms: string; // JSON文字列としてのuniform定義
  tags?: string[];
  thumbnailData?: string; // Base64エンコードされたサムネイル画像
}

/**
 * Complete project file structure
 */
export interface ProjectFile {
  // メタデータ
  metadata: ProjectMetadata;
  
  // シェーダープログラムの状態
  shaderPrograms: ShaderProgram[];
  
  // オーディオ設定と状態
  audioState: {
    enabled: boolean;
    volume: number;
    fileReference: string | null;
    analysisSettings: {
      fftSize: number;
      smoothingTimeConstant: number;
      minDecibels: number;
      maxDecibels: number;
    };
  };
  
  // サウンドプログラミング（Tone.js）の状態
  soundProgrammingState: {
    enabled: boolean;
    synthesizerSettings: Record<string, any>;
    sequencerPatterns: any[];
    effectChains: any[];
  };
  
  // 保存されたプリセット
  presets: ShaderPreset[];
  
  // UI状態
  uiState: {
    selectedTab: number;
    paneSizes: {
      editor: number;
      preview: number;
      controls: number;
    };
    vjModeEnabled: boolean;
    theme: string;
  };
  
  // 拡張用のカスタムデータ
  customData?: Record<string, unknown>;
}

/**
 * Project file validation result
 */
export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Project save/load operations interface
 */
/**
 * Project save options
 */
export interface ProjectSaveOptions {
  compress?: boolean;
  defaultFilename?: string;
  includeAudioData?: boolean;
}

/**
 * Project load result
 */
export interface ProjectLoadResult {
  success: boolean;
  data?: ProjectFile;
  error?: string;
  filePath?: string;
}

export interface ProjectOperations {
  /**
   * Save project to file
   * @param project Project data to save
   * @param filePath Optional file path
   * @returns Promise with saved file path
   */
  saveProject(project: ProjectFile, options?: ProjectSaveOptions): Promise<ProjectLoadResult>;
  
  /**
   * Load project from file
   * @param filePath File path or File object
   * @returns Promise with loaded project data
   */
  loadProject(filePath?: string): Promise<ProjectLoadResult>;
  
  /**
   * Export project as JSON string
   * @param project Project data to export
   * @param prettify Whether to format JSON
   * @returns JSON string
   */
  exportProject(project: ProjectFile, format: 'json' | 'glsl'): Promise<string>;
  
  /**
   * Import project from JSON string
   * @param jsonString JSON string to import
   * @returns Parsed project data
   */
  importProject(jsonString: string): Promise<ProjectLoadResult>;
  
  /**
   * Validate project file structure
   * @param project Project data to validate
   * @returns Validation result
   */
  validateProject(project: unknown): ProjectLoadResult;
  
  /**
   * Migrate project from older version
   * @param project Project data to migrate
   * @param fromVersion Source version
   * @returns Migrated project data
   */
  migrateProject(project: ProjectFile): Promise<ProjectFile>;
  
  /**
   * Create empty project with defaults
   * @param name Project name
   * @returns New project data
   */
  createEmptyProject(name: string): ProjectFile;
  
  /**
   * Merge projects (for collaboration)
   * @param base Base project
   * @param incoming Incoming project changes
   * @returns Merged project
   */
  mergeProjects(base: ProjectFile, incoming: ProjectFile): Promise<ProjectFile>;
}

/**
 * Project file export options
 */
export interface ProjectExportOptions {
  includeAudioData?: boolean; // オーディオファイルをBase64として含めるか
  includeThumbnails?: boolean; // プリセットのサムネイルを含めるか
  compressData?: boolean; // データを圧縮するか
  excludeUIState?: boolean; // UI状態を除外するか
}

/**
 * Project file import options
 */
export interface ProjectImportOptions {
  validateVersion?: boolean; // バージョン互換性をチェックするか
  mergeWithCurrent?: boolean; // 現在のプロジェクトとマージするか
  preserveUIState?: boolean; // UI状態を保持するか
  autoMigrate?: boolean; // 自動的に新しいバージョンに移行するか
}