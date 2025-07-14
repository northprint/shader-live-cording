import { writable } from 'svelte/store';
import { DatabaseManager } from '../lib/database/DatabaseManager';
import { TauriDatabaseManager } from '../lib/database/TauriDatabaseManager';
import type { Preset, Project } from '../lib/database/DatabaseManager';

// Tauri環境かどうかを判定
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// 環境に応じて適切なDatabaseManagerを使用
export const databaseManager = isTauri ? new TauriDatabaseManager() : new DatabaseManager();
export const isDbInitialized = writable(false);
export const presets = writable<Preset[]>([]);
export const projects = writable<Project[]>([]);

// データベースの初期化
export async function initializeDatabase() {
  try {
    await databaseManager.initialize();
    isDbInitialized.set(true);
    
    // デフォルトプリセットをチェック
    const existingPresets = await databaseManager.listPresets();
    if (existingPresets.length === 0) {
      await databaseManager.addDefaultPresets();
    }
    
    // プリセットとプロジェクトをロード
    await refreshPresets();
    await refreshProjects();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    isDbInitialized.set(false);
  }
}

export async function refreshPresets() {
  try {
    const presetList = await databaseManager.listPresets();
    presets.set(presetList);
  } catch (error) {
    console.error('Failed to load presets:', error);
  }
}

export async function refreshProjects() {
  try {
    const projectList = await databaseManager.listProjects();
    projects.set(projectList);
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}