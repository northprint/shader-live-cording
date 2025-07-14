# Export Module Usage Guide

## Overview
This module provides comprehensive export functionality for the shader live coding application, including image export, video recording, and standalone HTML generation.

## Basic Usage

### Initialize ExportManager
```typescript
import { ExportManager } from './lib/export';
import { WebGLRenderer } from './lib/renderer/WebGLRenderer';

// Create renderer with preserveDrawingBuffer enabled for exports
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas, true);

// Create export manager
const exportManager = new ExportManager(
  renderer.getCanvas(),
  () => renderer.renderFrame()
);
```

### Export Image
```typescript
// Export current frame as PNG
const result = await exportManager.exportImage({
  format: 'png',
  filename: 'my-shader.png'
});

// Export high-resolution image
const hiResResult = await exportManager.exportHighResImage(3840, 2160, {
  format: 'jpg',
  quality: 0.95
});
```

### Record Video
```typescript
// Start recording
await exportManager.startVideoRecording({
  format: 'webm',
  duration: 10000, // 10 seconds
  fps: 60,
  videoBitsPerSecond: 10000000 // 10Mbps
});

// Stop recording manually
const videoResult = await exportManager.stopVideoRecording();
```

### Export Standalone HTML
```typescript
const htmlResult = await exportManager.exportHTML(fragmentShaderCode, {
  filename: 'shader.html',
  minify: true,
  uniforms: renderer.getUniformValues()
});
```

### Audio-Synchronized Video Export
```typescript
// Assuming you have an AudioBuffer and AudioContext
const audioSyncResult = await exportManager.recordWithAudio({
  format: 'webm',
  duration: audioBuffer.duration * 1000,
  fps: 30,
  audioBuffer: audioBuffer,
  audioContext: audioContext
});
```

## Integration with UI Components

### Export Button Component Example
```svelte
<script lang="ts">
  import { ExportManager } from '$lib/export';
  import type { WebGLRenderer } from '$lib/renderer/WebGLRenderer';
  
  export let renderer: WebGLRenderer;
  export let shaderCode: string;
  
  let exportManager: ExportManager;
  let isRecording = false;
  
  $: if (renderer) {
    exportManager = new ExportManager(
      renderer.getCanvas(),
      () => renderer.renderFrame()
    );
  }
  
  async function exportImage() {
    const result = await exportManager.exportImage({
      format: 'png'
    });
    
    if (result.success) {
      console.log('Image exported:', result.filename);
    } else {
      console.error('Export failed:', result.error);
    }
  }
  
  async function toggleRecording() {
    if (isRecording) {
      const result = await exportManager.stopVideoRecording();
      isRecording = false;
    } else {
      await exportManager.startVideoRecording({
        format: 'webm',
        duration: 30000, // 30 seconds max
        fps: 30
      });
      isRecording = true;
    }
  }
</script>

<button on:click={exportImage}>Export Image</button>
<button on:click={toggleRecording}>
  {isRecording ? 'Stop Recording' : 'Start Recording'}
</button>
```

## Important Notes

1. **WebGL Context**: Always create the WebGL context with `preserveDrawingBuffer: true` when you need export functionality.

2. **File Permissions**: The export functions use Tauri's file system APIs, so ensure your application has the necessary permissions in `tauri.conf.json`.

3. **Memory Management**: Video recording can consume significant memory. Implement proper cleanup and limit recording duration.

4. **Browser Compatibility**: Video recording uses MediaRecorder API which may have limited codec support across browsers. WebM with VP9 is widely supported.

5. **Performance**: High-resolution exports may cause temporary freezing. Consider showing a loading indicator during export operations.