import type { 
  ProjectFile, 
  ProjectSaveOptions, 
  ProjectLoadResult, 
  ProjectOperations,
  ProjectMetadata
} from '../../types/project';

/**
 * Project Manager class that handles save/load operations for shader live coding projects
 */
export class ProjectManager implements ProjectOperations {
  private static readonly FILE_EXTENSION = 'shlc';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly MAGIC_HEADER = 'SHLC';

  /**
   * Saves the current project to a file
   * @param data Project data to save
   * @param options Save options including compression preferences
   * @returns Promise that resolves when save is complete
   */
  async saveProject(data: ProjectFile, options?: ProjectSaveOptions): Promise<ProjectLoadResult> {
    try {
      // プロジェクトデータを準備
      const projectToSave: ProjectFile = {
        ...data,
        metadata: {
          ...data.metadata,
          lastModified: new Date(),
          version: ProjectManager.CURRENT_VERSION
        }
      };

      // データをシリアライズ
      let serializedData: string;
      if (options?.compress) {
        // 圧縮オプション
        serializedData = await this.compressData(projectToSave);
      } else {
        // 圧縮しない場合は整形されたJSON
        serializedData = JSON.stringify(projectToSave, null, 2);
      }

      // ブラウザ環境でのファイル保存
      const blob = new Blob([serializedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = options?.defaultFilename || 
        `${projectToSave.metadata.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${ProjectManager.FILE_EXTENSION}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        data: projectToSave
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Loads a project from a file
   * @param filePath Optional file path. If not provided, shows file picker dialog
   * @returns Promise that resolves with the loaded project data
   */
  async loadProject(filePath?: string): Promise<ProjectLoadResult> {
    try {
      // ブラウザ環境でのファイル読み込み
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = `.${ProjectManager.FILE_EXTENSION},.json`;
        
        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve({
              success: false,
              error: 'No file selected'
            });
            return;
          }

          try {
            const content = await file.text();
            const result = await this.processFileContent(content, file.name);
            resolve(result);
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to read file'
            });
          }
        };

        input.click();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process file content
   * @param fileContent File content string
   * @param filePath File path for reference
   * @returns Load result
   */
  private async processFileContent(fileContent: string, filePath?: string): Promise<ProjectLoadResult> {
    // データをパース
    let projectData: ProjectFile;
    try {
      // 圧縮されているかチェック
      if (this.isCompressedData(fileContent)) {
        projectData = await this.decompressData(fileContent);
      } else {
        projectData = JSON.parse(fileContent);
      }
    } catch (error) {
      return {
        success: false,
        error: 'Invalid project file format'
      };
    }

    // バリデーション
    const validation = this.validateProject(projectData);
    if (!validation.success) {
      return validation;
    }

    // バージョン移行が必要な場合
    if (projectData.metadata.version !== ProjectManager.CURRENT_VERSION) {
      projectData = await this.migrateProject(projectData);
    }

    return {
      success: true,
      data: projectData,
      filePath
    };
  }

  /**
   * Validates project data structure
   * @param data Project data to validate
   * @returns Validation result
   */
  validateProject(data: any): ProjectLoadResult {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid project data');
      }

      // メタデータの検証
      if (!data.metadata || typeof data.metadata !== 'object') {
        throw new Error('Missing or invalid metadata');
      }

      if (!data.metadata.name || typeof data.metadata.name !== 'string') {
        throw new Error('Missing project name');
      }

      if (!data.metadata.version || typeof data.metadata.version !== 'string') {
        throw new Error('Missing project version');
      }

      // シェーダープログラムの検証
      if (!Array.isArray(data.shaderPrograms) || data.shaderPrograms.length === 0) {
        throw new Error('No shader programs found');
      }

      for (const shader of data.shaderPrograms) {
        if (!shader.id || !shader.name || !shader.fragmentShader) {
          throw new Error('Invalid shader program structure');
        }
      }

      return {
        success: true,
        data: data as ProjectFile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid project structure'
      };
    }
  }

  /**
   * Migrates project from older version
   * @param data Old project data
   * @returns Migrated project data
   */
  async migrateProject(data: ProjectFile): Promise<ProjectFile> {
    console.log(`Migrating project from version ${data.metadata.version} to ${ProjectManager.CURRENT_VERSION}`);
    
    // 現在は単純にバージョンを更新
    return {
      ...data,
      metadata: {
        ...data.metadata,
        version: ProjectManager.CURRENT_VERSION,
        lastModified: new Date()
      }
    };
  }

  /**
   * Exports project to different formats
   * @param data Project data
   * @param format Export format
   * @returns Exported data as string
   */
  async exportProject(data: ProjectFile, format: 'json' | 'glsl'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'glsl':
        // GLSLコードのみをエクスポート
        return data.shaderPrograms
          .map(shader => `// ${shader.name}\n${shader.fragmentShader}`)
          .join('\n\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Imports project from JSON
   * @param jsonString JSON string to import
   * @returns Import result
   */
  async importProject(jsonString: string): Promise<ProjectLoadResult> {
    try {
      const data = JSON.parse(jsonString);
      return this.validateProject(data);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Checks if data is compressed
   * @param data Data to check
   * @returns True if compressed
   */
  private isCompressedData(data: string): boolean {
    return data.startsWith(ProjectManager.MAGIC_HEADER);
  }

  /**
   * Compresses project data
   * @param data Data to compress
   * @returns Compressed data as base64 string
   */
  private async compressData(data: ProjectFile): Promise<string> {
    const jsonString = JSON.stringify(data);
    // 簡単な圧縮実装（実際にはより効率的な圧縮アルゴリズムを使用）
    const compressed = btoa(jsonString);
    return `${ProjectManager.MAGIC_HEADER}:${compressed}`;
  }

  /**
   * Decompresses project data
   * @param data Compressed data
   * @returns Decompressed project data
   */
  private async decompressData(data: string): Promise<ProjectFile> {
    if (!data.startsWith(ProjectManager.MAGIC_HEADER)) {
      throw new Error('Invalid compressed data format');
    }
    
    const compressed = data.substring(ProjectManager.MAGIC_HEADER.length + 1);
    const jsonString = atob(compressed);
    return JSON.parse(jsonString);
  }

  /**
   * Merges two projects (for collaboration)
   * @param base Base project
   * @param incoming Incoming project to merge
   * @returns Merged project
   */
  async mergeProjects(base: ProjectFile, incoming: ProjectFile): Promise<ProjectFile> {
    // 簡単なマージ実装
    return {
      ...base,
      shaderPrograms: [...base.shaderPrograms, ...incoming.shaderPrograms],
      presets: [...(base.presets || []), ...(incoming.presets || [])],
      metadata: {
        ...base.metadata,
        lastModified: new Date(),
        description: `Merged from ${base.metadata.name} and ${incoming.metadata.name}`
      }
    };
  }

  /**
   * Creates an empty project with default values
   * @param name Project name
   * @returns New empty project
   */
  createEmptyProject(name: string): ProjectFile {
    return {
      metadata: {
        name,
        description: '',
        author: '',
        version: ProjectManager.CURRENT_VERSION,
        createdAt: new Date(),
        lastModified: new Date(),
        tags: []
      },
      shaderPrograms: [{
        id: 'default',
        name: 'Main Shader',
        language: 'glsl',
        vertexShader: `attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`,
        fragmentShader: `precision highp float;
uniform float time;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}`,
        uniforms: [],
        lastModified: new Date()
      }],
      audioState: {
        enabled: false,
        volume: 1.0,
        fileReference: null,
        analysisSettings: {
          fftSize: 2048,
          smoothingTimeConstant: 0.8,
          minDecibels: -90,
          maxDecibels: -10
        }
      },
      soundProgrammingState: {
        enabled: false,
        synthesizerSettings: {},
        sequencerPatterns: [],
        effectChains: []
      },
      presets: [],
      uiState: {
        selectedTab: 0,
        paneSizes: {
          editor: 0.4,
          preview: 0.4,
          controls: 0.2
        },
        vjModeEnabled: false,
        theme: 'dark'
      },
      customData: {}
    };
  }
}

// シングルトンインスタンス
export const projectManager = new ProjectManager();