import { writable, derived } from 'svelte/store';

interface ProjectStoreState {
  recentProjects: any[];
  isLoading: boolean;
  error: string | null;
}

function createProjectStore() {
  const { subscribe, set, update } = writable<ProjectStoreState>({
    recentProjects: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,
    
    async loadRecentProjects() {
      // 現在は空の実装
      // 将来的にはTauri APIを使用してプロジェクトを読み込む
      update(state => ({ ...state, isLoading: false }));
    },
    
    clearError() {
      update(state => ({ ...state, error: null }));
    }
  };
}

export const projectStore = createProjectStore();

// 派生ストア
export const recentProjects = derived(
  projectStore,
  $projectStore => $projectStore.recentProjects
);