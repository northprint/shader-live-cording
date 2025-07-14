import { writable } from 'svelte/store';
import type { ShaderProgram, ShaderLanguage } from '../types/shader';

interface AppState {
  shaderProgram: ShaderProgram;
  selectedLanguage: ShaderLanguage;
  isPlaying: boolean;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
}

function createAppStore() {
  const defaultShaderProgram: ShaderProgram = {
    id: 'default',
    name: 'Default Shader',
    language: 'glsl',
    vertexShader: `attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}`,
    uniforms: [],
    lastModified: new Date()
  };

  const { subscribe, set, update } = writable<AppState>({
    shaderProgram: defaultShaderProgram,
    selectedLanguage: 'glsl',
    isPlaying: true,
    resolution: {
      width: 800,
      height: 600
    },
    fps: 60
  });

  return {
    subscribe,
    updateShaderProgram: (program: Partial<ShaderProgram>) => {
      update(state => ({
        ...state,
        shaderProgram: {
          ...state.shaderProgram,
          ...program,
          lastModified: new Date()
        }
      }));
    },
    setResolution: (width: number, height: number) => {
      update(state => ({
        ...state,
        resolution: { width, height }
      }));
    },
    setPlayState: (isPlaying: boolean) => {
      update(state => ({ ...state, isPlaying }));
    },
    setFPS: (fps: number) => {
      update(state => ({ ...state, fps }));
    },
    loadProject: (projectData: any) => {
      update(state => ({
        ...state,
        shaderProgram: {
          ...state.shaderProgram,
          fragmentShader: projectData.shaderCode || state.shaderProgram.fragmentShader,
          language: projectData.language || state.shaderProgram.language,
          lastModified: new Date()
        },
        resolution: projectData.resolution || state.resolution,
        fps: projectData.fps || state.fps
      }));
    }
  };
}

export const appStore = createAppStore();