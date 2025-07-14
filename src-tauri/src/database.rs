use chrono::Utc;
use rusqlite::{params, Connection, Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Preset {
    pub id: Option<i64>,
    pub name: String,
    pub shader_code: String,
    pub language: String,
    pub uniforms: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: Option<i64>,
    pub name: String,
    pub shaders: String,
    pub audio_settings: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub async fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        // アプリケーションのデータディレクトリを取得
        let app_data_dir = app_handle.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;
        
        // データベースファイルのパスを作成
        std::fs::create_dir_all(&app_data_dir)?;
        let db_path = app_data_dir.join("shader_live_coding.db");
        
        // SQLite接続を作成
        let conn = Connection::open(db_path)?;
        
        let db = Self {
            conn: Mutex::new(conn),
        };
        
        // テーブルを作成
        db.create_tables()?;
        
        Ok(db)
    }
    
    fn create_tables(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        
        // プリセットテーブル
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS presets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                shader_code TEXT NOT NULL,
                language TEXT NOT NULL,
                uniforms TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            "#,
            [],
        )?;
        
        // プロジェクトテーブル
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                shaders TEXT NOT NULL,
                audio_settings TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            "#,
            [],
        )?;
        
        // インデックスの作成
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_presets_updated_at ON presets(updated_at)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at)",
            [],
        )?;
        
        Ok(())
    }
    
    // プリセット操作
    pub async fn save_preset(&self, preset: Preset) -> Result<i64, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();
        
        if let Some(id) = preset.id {
            // 更新
            conn.execute(
                r#"
                UPDATE presets 
                SET name = ?1, shader_code = ?2, language = ?3, uniforms = ?4, updated_at = ?5
                WHERE id = ?6
                "#,
                params![&preset.name, &preset.shader_code, &preset.language, &preset.uniforms, &now, id],
            )?;
            
            Ok(id)
        } else {
            // 新規作成
            conn.execute(
                r#"
                INSERT INTO presets (name, shader_code, language, uniforms, created_at, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                "#,
                params![&preset.name, &preset.shader_code, &preset.language, &preset.uniforms, &now, &now],
            )?;
            
            Ok(conn.last_insert_rowid())
        }
    }
    
    pub async fn get_preset(&self, id: i64) -> Result<Option<Preset>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, shader_code, language, uniforms, created_at, updated_at
            FROM presets 
            WHERE id = ?1
            "#
        )?;
        
        let preset = stmt.query_row(params![id], |row| {
            Ok(Preset {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                shader_code: row.get(2)?,
                language: row.get(3)?,
                uniforms: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }).optional()?;
        
        Ok(preset)
    }
    
    pub async fn list_presets(&self) -> Result<Vec<Preset>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, shader_code, language, uniforms, created_at, updated_at
            FROM presets 
            ORDER BY updated_at DESC
            "#
        )?;
        
        let presets = stmt.query_map([], |row| {
            Ok(Preset {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                shader_code: row.get(2)?,
                language: row.get(3)?,
                uniforms: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
        
        Ok(presets)
    }
    
    pub async fn delete_preset(&self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM presets WHERE id = ?1", params![id])?;
        Ok(())
    }
    
    // プロジェクト操作
    pub async fn save_project(&self, project: Project) -> Result<i64, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();
        
        if let Some(id) = project.id {
            // 更新
            conn.execute(
                r#"
                UPDATE projects 
                SET name = ?1, shaders = ?2, audio_settings = ?3, updated_at = ?4
                WHERE id = ?5
                "#,
                params![&project.name, &project.shaders, &project.audio_settings, &now, id],
            )?;
            
            Ok(id)
        } else {
            // 新規作成
            conn.execute(
                r#"
                INSERT INTO projects (name, shaders, audio_settings, created_at, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5)
                "#,
                params![&project.name, &project.shaders, &project.audio_settings, &now, &now],
            )?;
            
            Ok(conn.last_insert_rowid())
        }
    }
    
    pub async fn get_project(&self, id: i64) -> Result<Option<Project>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, shaders, audio_settings, created_at, updated_at
            FROM projects 
            WHERE id = ?1
            "#
        )?;
        
        let project = stmt.query_row(params![id], |row| {
            Ok(Project {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                shaders: row.get(2)?,
                audio_settings: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        }).optional()?;
        
        Ok(project)
    }
    
    pub async fn list_projects(&self) -> Result<Vec<Project>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, name, shaders, audio_settings, created_at, updated_at
            FROM projects 
            ORDER BY updated_at DESC
            "#
        )?;
        
        let projects = stmt.query_map([], |row| {
            Ok(Project {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                shaders: row.get(2)?,
                audio_settings: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
        
        Ok(projects)
    }
    
    pub async fn delete_project(&self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }
}