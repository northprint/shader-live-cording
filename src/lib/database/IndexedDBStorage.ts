/**
 * IndexedDB wrapper for persisting DuckDB data
 */
export class IndexedDBStorage {
  private dbName = 'ShaderLiveCodingDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // presetsストアの作成
        if (!db.objectStoreNames.contains('presets')) {
          const presetsStore = db.createObjectStore('presets', { keyPath: 'id' });
          presetsStore.createIndex('name', 'name', { unique: false });
          presetsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // projectsストアの作成
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('name', 'name', { unique: false });
          projectsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // metadataストア（最大IDなどを保存）
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // プリセットの保存
  async savePreset(preset: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['presets'], 'readwrite');
    const store = transaction.objectStore('presets');
    
    return new Promise((resolve, reject) => {
      const request = store.put(preset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save preset'));
    });
  }

  // プリセットの読み込み
  async loadPreset(id: number): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['presets'], 'readonly');
    const store = transaction.objectStore('presets');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to load preset'));
    });
  }

  // すべてのプリセットを取得
  async getAllPresets(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['presets'], 'readonly');
    const store = transaction.objectStore('presets');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to load presets'));
    });
  }

  // プリセットの削除
  async deletePreset(id: number): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['presets'], 'readwrite');
    const store = transaction.objectStore('presets');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete preset'));
    });
  }

  // プロジェクトの保存
  async saveProject(project: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save project'));
    });
  }

  // プロジェクトの読み込み
  async loadProject(id: number): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to load project'));
    });
  }

  // すべてのプロジェクトを取得
  async getAllProjects(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to load projects'));
    });
  }

  // プロジェクトの削除
  async deleteProject(id: number): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete project'));
    });
  }

  // メタデータの保存（最大IDなど）
  async saveMetadata(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save metadata'));
    });
  }

  // メタデータの読み込み
  async loadMetadata(key: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(new Error('Failed to load metadata'));
    });
  }

  // データベースを閉じる
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}