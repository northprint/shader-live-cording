import * as duckdb from '@duckdb/duckdb-wasm';
import type { ShaderProgram } from '../../types/shader';
import { IndexedDBStorage } from './IndexedDBStorage';

export interface Preset {
  id?: number;
  name: string;
  shader_code: string;
  language: string;
  uniforms: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Project {
  id?: number;
  name: string;
  shaders: string;
  audio_settings: string;
  created_at?: Date;
  updated_at?: Date;
}

export class DatabaseManager {
  private db: duckdb.AsyncDuckDB | null = null;
  private connection: duckdb.AsyncDuckDBConnection | null = null;
  private initialized = false;
  private storage: IndexedDBStorage;
  
  constructor() {
    this.storage = new IndexedDBStorage();
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // IndexedDBの初期化
    await this.storage.initialize();
    
    // DuckDB WASMの初期化
    const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
      mvp: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).href,
      },
      eh: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).href,
      },
    };
    
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(bundle.mainModule);
    
    this.connection = await this.db.connect();
    
    // テーブルの作成
    await this.createTables();
    
    // IndexedDBからデータを復元
    await this.restoreFromIndexedDB();
    
    this.initialized = true;
  }
  
  private async createTables(): Promise<void> {
    if (!this.connection) return;
    
    // presetsテーブル（idを手動で管理）
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS presets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        shader_code TEXT NOT NULL,
        language TEXT NOT NULL,
        uniforms TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // projectsテーブル（idを手動で管理）
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        shaders TEXT NOT NULL,
        audio_settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  
  // IndexedDBからデータを復元
  private async restoreFromIndexedDB(): Promise<void> {
    if (!this.connection) return;
    
    try {
      // プリセットの復元
      const presets = await this.storage.getAllPresets();
      for (const preset of presets) {
        const stmt = await this.connection.prepare(`
          INSERT INTO presets (id, name, shader_code, language, uniforms, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        await stmt.query(
          preset.id,
          preset.name,
          preset.shader_code,
          preset.language,
          preset.uniforms || '',
          preset.created_at,
          preset.updated_at
        );
        
        stmt.close();
      }
      
      // プロジェクトの復元
      const projects = await this.storage.getAllProjects();
      for (const project of projects) {
        const stmt = await this.connection.prepare(`
          INSERT INTO projects (id, name, shaders, audio_settings, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        await stmt.query(
          project.id,
          project.name,
          project.shaders,
          project.audio_settings || '',
          project.created_at,
          project.updated_at
        );
        
        stmt.close();
      }
      
      console.log(`Restored ${presets.length} presets and ${projects.length} projects from IndexedDB`);
    } catch (error) {
      console.error('Failed to restore from IndexedDB:', error);
    }
  }
  
  // プリセット操作
  async savePreset(preset: Preset): Promise<number> {
    if (!this.connection) throw new Error('Database not initialized');
    
    // 新しいIDを生成（現在の最大ID + 1）
    const maxIdResult = await this.connection.query(`
      SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM presets
    `);
    const newId = maxIdResult.toArray()[0].new_id as number;
    
    // IDを含めてINSERT
    const stmt = await this.connection.prepare(`
      INSERT INTO presets (id, name, shader_code, language, uniforms)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    await stmt.query(
      newId,
      preset.name, 
      preset.shader_code, 
      preset.language, 
      preset.uniforms || ''
    );
    
    stmt.close();
    
    // IndexedDBにも保存
    const savedPreset = {
      ...preset,
      id: newId,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.storage.savePreset(savedPreset);
    
    return newId;
  }
  
  async loadPreset(id: number): Promise<Preset | null> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const stmt = await this.connection.prepare(`
      SELECT * FROM presets WHERE id = ?
    `);
    
    const result = await stmt.query(id);
    const rows = result.toArray();
    stmt.close();
    
    if (rows.length === 0) return null;
    
    return rows[0] as Preset;
  }
  
  async listPresets(): Promise<Preset[]> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const result = await this.connection.query(`
      SELECT * FROM presets ORDER BY updated_at DESC
    `);
    
    return result.toArray() as Preset[];
  }
  
  async deletePreset(id: number): Promise<void> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const stmt = await this.connection.prepare(`
      DELETE FROM presets WHERE id = ?
    `);
    
    await stmt.query(id);
    stmt.close();
    
    // IndexedDBからも削除
    await this.storage.deletePreset(id);
  }
  
  // プロジェクト操作
  async saveProject(project: Project): Promise<number> {
    if (!this.connection) throw new Error('Database not initialized');
    
    // 新しいIDを生成（現在の最大ID + 1）
    const maxIdResult = await this.connection.query(`
      SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM projects
    `);
    const newId = maxIdResult.toArray()[0].new_id as number;
    
    // IDを含めてINSERT
    const stmt = await this.connection.prepare(`
      INSERT INTO projects (id, name, shaders, audio_settings)
      VALUES (?, ?, ?, ?)
    `);
    
    await stmt.query(
      newId,
      project.name,
      project.shaders,
      project.audio_settings || ''
    );
    
    stmt.close();
    
    // IndexedDBにも保存
    const savedProject = {
      ...project,
      id: newId,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.storage.saveProject(savedProject);
    
    return newId;
  }
  
  async loadProject(id: number): Promise<Project | null> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const stmt = await this.connection.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);
    
    const result = await stmt.query(id);
    
    const rows = result.toArray();
    stmt.close();
    
    if (rows.length === 0) return null;
    
    return rows[0] as Project;
  }
  
  async listProjects(): Promise<Project[]> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const result = await this.connection.query(`
      SELECT * FROM projects ORDER BY updated_at DESC
    `);
    
    return result.toArray() as Project[];
  }
  
  async deleteProject(id: number): Promise<void> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const stmt = await this.connection.prepare(`
      DELETE FROM projects WHERE id = ?
    `);
    
    await stmt.query(id);
    stmt.close();
    
    // IndexedDBからも削除
    await this.storage.deleteProject(id);
  }
  
  // デフォルトプリセットの追加
  async addDefaultPresets(): Promise<void> {
    if (!this.connection) throw new Error('Database not initialized');
    
    const defaultPresets = [
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
    if (this.connection) {
      await this.connection.close();
    }
    if (this.db) {
      await this.db.terminate();
    }
    this.storage.close();
    this.initialized = false;
  }
}