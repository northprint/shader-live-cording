<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let shaderCode = '';
  
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let program: WebGLProgram | null = null;
  let animationId: number;
  let startTime = Date.now();
  
  const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
  
  function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }
  
  function updateShader() {
    if (!gl) return;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaderCode);
    
    if (!vertexShader || !fragmentShader) return;
    
    const newProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!newProgram) return;
    
    if (program) {
      gl.deleteProgram(program);
    }
    
    program = newProgram;
  }
  
  function render() {
    if (!gl || !program) return;
    
    gl.useProgram(program);
    
    // Set uniforms
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    
    if (timeLocation) {
      gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000.0);
    }
    
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    animationId = requestAnimationFrame(render);
  }
  
  onMount(() => {
    const context = canvas.getContext('webgl');
    if (!context) {
      console.error('WebGL not supported');
      return;
    }
    
    gl = context;
    
    // Set up vertex buffer
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    updateShader();
    render();
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
  
  $: if (gl) {
    updateShader();
  }
</script>

<div class="preview">
  <canvas bind:this={canvas} width="800" height="600" />
</div>

<style>
  .preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #0a0a0a;
    padding: 1rem;
  }
  
  canvas {
    max-width: 100%;
    max-height: 100%;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
  }
</style>