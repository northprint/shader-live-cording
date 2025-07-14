export type ShaderLanguage = 'glsl' | 'wgsl';

export interface ShaderUniform {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat4' | 'sampler2D';
  value: number | number[] | WebGLTexture;
  min?: number;
  max?: number;
}

export interface ShaderProgram {
  id: string;
  name: string;
  language: ShaderLanguage;
  vertexShader: string;
  fragmentShader: string;
  uniforms: ShaderUniform[];
  errors?: string[];
  lastModified: Date;
}

export interface ShaderCompileResult {
  success: boolean;
  program?: WebGLProgram;
  errors?: string[];
  warnings?: string[];
}