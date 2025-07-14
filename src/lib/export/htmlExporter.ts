import type { HTMLExportOptions, ExportResult } from './types';

/**
 * Standalone HTML file generator
 */
export class HTMLExporter {
  /**
   * Default vertex shader for fullscreen quad
   */
  private static readonly DEFAULT_VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  /**
   * Generate standalone HTML file with embedded shader
   */
  static async exportHTML(
    fragmentShaderCode: string,
    options: HTMLExportOptions
  ): Promise<ExportResult> {
    try {
      // HTMLテンプレートを生成
      const htmlContent = this.generateHTMLTemplate(
        fragmentShaderCode,
        options.uniforms || {},
        options.minify || false
      );
      
      // ファイル名の生成
      const filename = options.filename || this.generateFilename();
      
      // ブラウザのFile APIを使用してダウンロード
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        filename
      };
    } catch (error) {
      console.error('HTML export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate HTML template with embedded shader code
   */
  private static generateHTMLTemplate(
    fragmentShaderCode: string,
    uniforms: Record<string, any>,
    minify: boolean
  ): string {
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shader Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    canvas { display: block; width: 100vw; height: 100vh; }
    .error { position: fixed; top: 10px; left: 10px; color: #ff0000; font-family: monospace; z-index: 100; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="error" class="error"></div>
  <script>
    // Vertex shader
    const vertexShaderSource = \`${this.DEFAULT_VERTEX_SHADER}\`;
    
    // Fragment shader
    const fragmentShaderSource = \`${fragmentShaderCode}\`;
    
    // Uniforms configuration
    const uniformsConfig = ${JSON.stringify(uniforms, null, minify ? 0 : 2)};
    
    // WebGL setup
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2', {
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false
    });
    
    if (!gl) {
      document.getElementById('error').textContent = 'WebGL2 not supported';
      throw new Error('WebGL2 not supported');
    }
    
    // Shader compilation
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        document.getElementById('error').textContent = 'Shader error: ' + error;
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    // Program creation
    function createProgram(gl, vertexShader, fragmentShader) {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        document.getElementById('error').textContent = 'Program error: ' + error;
        return null;
      }
      
      return program;
    }
    
    // Initialize shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    if (!program) {
      throw new Error('Failed to create shader program');
    }
    
    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'position');
    
    // Get uniform locations
    const uniformLocations = {
      time: gl.getUniformLocation(program, 'time'),
      resolution: gl.getUniformLocation(program, 'resolution'),
      mouse: gl.getUniformLocation(program, 'mouse')
    };
    
    // Add custom uniform locations
    Object.keys(uniformsConfig).forEach(key => {
      if (!uniformLocations[key]) {
        uniformLocations[key] = gl.getUniformLocation(program, key);
      }
    });
    
    // Mouse tracking
    let mouseX = 0, mouseY = 0;
    canvas.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = canvas.height - e.clientY;
    });
    
    // Resize handling
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // Animation loop
    const startTime = Date.now();
    
    function render() {
      const currentTime = (Date.now() - startTime) * 0.001;
      
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(program);
      
      // Set uniforms
      if (uniformLocations.time) {
        gl.uniform1f(uniformLocations.time, currentTime);
      }
      
      if (uniformLocations.resolution) {
        gl.uniform2f(uniformLocations.resolution, canvas.width, canvas.height);
      }
      
      if (uniformLocations.mouse) {
        gl.uniform2f(uniformLocations.mouse, mouseX, mouseY);
      }
      
      // Set custom uniforms
      Object.entries(uniformsConfig).forEach(([key, value]) => {
        const location = uniformLocations[key];
        if (location) {
          if (typeof value === 'number') {
            gl.uniform1f(location, value);
          } else if (Array.isArray(value)) {
            switch (value.length) {
              case 2:
                gl.uniform2f(location, value[0], value[1]);
                break;
              case 3:
                gl.uniform3f(location, value[0], value[1], value[2]);
                break;
              case 4:
                gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                break;
            }
          }
        }
      });
      
      // Draw
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      requestAnimationFrame(render);
    }
    
    render();
  </script>
</body>
</html>`;

    return minify ? template.replace(/\s+/g, ' ').trim() : template;
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `shader-export-${timestamp}.html`;
  }

  /**
   * Generate HTML with audio visualization support
   */
  static async exportHTMLWithAudio(
    fragmentShaderCode: string,
    options: HTMLExportOptions & { audioVisualization: boolean }
  ): Promise<ExportResult> {
    try {
      // 音声ビジュアライゼーション対応のHTMLテンプレートを生成
      const htmlContent = this.generateAudioHTMLTemplate(
        fragmentShaderCode,
        options.uniforms || {},
        options.minify || false
      );
      
      const filename = options.filename || this.generateFilename();
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(htmlContent);
      
      await save(uint8Array, {
        baseDir: BaseDirectory.Document,
        path: filename
      });
      
      return {
        success: true,
        filename
      };
    } catch (error) {
      console.error('HTML with audio export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate HTML template with audio visualization support
   */
  private static generateAudioHTMLTemplate(
    fragmentShaderCode: string,
    uniforms: Record<string, any>,
    minify: boolean
  ): string {
    // 音声解析機能を含むHTMLテンプレート
    const audioScript = `
    // Audio setup
    let audioContext;
    let analyser;
    let frequencyData;
    let audioTexture;
    
    // Initialize audio on user interaction
    document.addEventListener('click', initAudio, { once: true });
    
    async function initAudio() {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      
      // Create audio texture
      audioTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, audioTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, analyser.frequencyBinCount, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      // Get microphone input
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (e) {
        console.error('Microphone access denied:', e);
      }
    }
    
    // Update audio data in render loop
    function updateAudioData() {
      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        gl.bindTexture(gl.TEXTURE_2D, audioTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, analyser.frequencyBinCount, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, frequencyData);
      }
    }`;

    // 基本テンプレートに音声機能を追加
    return this.generateHTMLTemplate(fragmentShaderCode, uniforms, minify)
      .replace('// Animation loop', audioScript + '\n\n    // Animation loop')
      .replace('function render() {', 'function render() {\n      updateAudioData();');
  }
}