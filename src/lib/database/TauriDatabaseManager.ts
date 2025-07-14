import { invoke } from '@tauri-apps/api/core';
import type { ShaderProgram } from '../../types/shader';

export interface Preset {
  id?: number;
  name: string;
  shader_code: string;
  language: string;
  uniforms?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id?: number;
  name: string;
  shaders: string;
  audio_settings?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tauri backend database manager using SQLite
 */
export class TauriDatabaseManager {
  private initialized = false;
  
  async initialize(): Promise<void> {
    // Tauri側でデータベースは自動的に初期化される
    this.initialized = true;
  }
  
  // プリセット操作
  async savePreset(preset: Preset): Promise<number> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const id = await invoke<number>('save_preset', { preset });
      return id;
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  }
  
  async loadPreset(id: number): Promise<Preset | null> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const preset = await invoke<Preset | null>('get_preset', { id });
      return preset;
    } catch (error) {
      console.error('Failed to load preset:', error);
      throw error;
    }
  }
  
  async listPresets(): Promise<Preset[]> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const presets = await invoke<Preset[]>('list_presets');
      return presets;
    } catch (error) {
      console.error('Failed to list presets:', error);
      throw error;
    }
  }
  
  async deletePreset(id: number): Promise<void> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      await invoke('delete_preset', { id });
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  }
  
  // プロジェクト操作
  async saveProject(project: Project): Promise<number> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const id = await invoke<number>('save_project', { project });
      return id;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }
  
  async loadProject(id: number): Promise<Project | null> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const project = await invoke<Project | null>('get_project', { id });
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }
  
  async listProjects(): Promise<Project[]> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      const projects = await invoke<Project[]>('list_projects');
      return projects;
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw error;
    }
  }
  
  async deleteProject(id: number): Promise<void> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    try {
      await invoke('delete_project', { id });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }
  
  // デフォルトプリセットの追加
  async addDefaultPresets(): Promise<void> {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const defaultPresets: Preset[] = [
      {
        name: 'Classic Rainbow',
        shader_code: `precision highp float;
uniform float time;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}`,
        language: 'glsl',
        uniforms: '[]'
      },
      {
        name: 'Audio Reactive Circles',
        shader_code: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform float audioVolume;
uniform float audioBass;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 0.5;
    float radius = 0.3 + audioBass * 0.2;
    float dist = length(uv);
    vec3 col = vec3(0.0);
    if (dist < radius) {
        col = vec3(1.0, 0.5, 0.0) * audioVolume;
    }
    gl_FragColor = vec4(col, 1.0);
}`,
        language: 'glsl',
        uniforms: '[]'
      }
    ];
    
    for (const preset of defaultPresets) {
      await this.savePreset(preset);
    }
  }
  
  async close(): Promise<void> {
    // Tauri側で管理されるため、特に何もしない
    this.initialized = false;
  }
}