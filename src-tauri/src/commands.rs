use crate::database::{Database, Preset, Project};
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

pub type DbState = Arc<Mutex<Database>>;

// プリセット関連のコマンド
#[tauri::command]
pub async fn save_preset(
    db: State<'_, DbState>,
    preset: Preset,
) -> Result<i64, String> {
    let db = db.lock().await;
    db.save_preset(preset)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_preset(
    db: State<'_, DbState>,
    id: i64,
) -> Result<Option<Preset>, String> {
    let db = db.lock().await;
    db.get_preset(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_presets(
    db: State<'_, DbState>,
) -> Result<Vec<Preset>, String> {
    let db = db.lock().await;
    db.list_presets()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_preset(
    db: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_preset(id)
        .await
        .map_err(|e| e.to_string())
}

// プロジェクト関連のコマンド
#[tauri::command]
pub async fn save_project(
    db: State<'_, DbState>,
    project: Project,
) -> Result<i64, String> {
    let db = db.lock().await;
    db.save_project(project)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_project(
    db: State<'_, DbState>,
    id: i64,
) -> Result<Option<Project>, String> {
    let db = db.lock().await;
    db.get_project(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_projects(
    db: State<'_, DbState>,
) -> Result<Vec<Project>, String> {
    let db = db.lock().await;
    db.list_projects()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(
    db: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_project(id)
        .await
        .map_err(|e| e.to_string())
}