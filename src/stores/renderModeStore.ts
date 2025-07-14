import { writable } from 'svelte/store';

export type RenderMode = 'glsl' | 'p5js';

export const renderMode = writable<RenderMode>('glsl');

// デフォルトのコード
export const defaultGLSLCode = {
  vertex: `attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`,
  fragment: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}`
};

export const defaultP5Code = `// P5.js Mode
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  // パーティクルを初期化
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(5, 20)
    });
  }
}

function draw() {
  background(0, 0, 10, 10);
  
  // オーディオデータが利用可能な場合
  if (audioData) {
    let volume = audioData.volume;
    let bass = audioData.bass;
    
    particles.forEach(p => {
      // 音量で色相を変更
      let hue = (frameCount + p.x * 0.1) % 360;
      let brightness = 50 + volume * 50;
      
      fill(hue, 80, brightness, 30);
      noStroke();
      
      // ベース音で大きさを変更
      let size = p.size * (1 + bass);
      circle(p.x, p.y, size);
      
      // パーティクルを移動
      p.x += p.vx;
      p.y += p.vy;
      
      // 画面端で反射
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}`;