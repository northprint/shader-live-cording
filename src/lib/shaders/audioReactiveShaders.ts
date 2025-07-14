export const audioReactiveShaders = {
  audioVisualizer: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float audioVolume;
uniform float audioBass;
uniform float audioMid;
uniform float audioTreble;
uniform float audioBeat;
uniform float audioBPM;
uniform sampler2D audioFrequency;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 center = uv - 0.5;
    
    // 音楽に反応する円
    float radius = 0.3 + audioBass * 0.2;
    float dist = length(center);
    
    // 周波数データから色を生成
    float freq = texture2D(audioFrequency, vec2(uv.x, 0.5)).r;
    
    // ビートに反応するパルス
    float pulse = 1.0 + audioBeat * 0.5;
    
    // 色の生成
    vec3 col = vec3(0.0);
    col.r = audioBass * pulse;
    col.g = audioMid * (1.0 + sin(time * 2.0) * 0.5);
    col.b = audioTreble * (1.0 + cos(time * 3.0) * 0.5);
    
    // 円形のビジュアライザー
    if (dist < radius) {
        col += vec3(freq) * 0.5;
    }
    
    // 波形表示
    float wave = sin(uv.x * 20.0 + time * audioBPM * 0.01) * audioMid;
    if (abs(uv.y - 0.5 - wave * 0.1) < 0.01) {
        col += vec3(1.0, 0.5, 0.0);
    }
    
    gl_FragColor = vec4(col, 1.0);
}`,

  spectrumBars: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform float audioVolume;
uniform float audioBass;
uniform float audioMid;
uniform float audioTreble;
uniform float audioBeat;
uniform sampler2D audioFrequency;

#define NUM_BARS 64

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // スペクトラムバー
    float barWidth = 0.01;
    float barSpacing = 1.0 / float(NUM_BARS);
    
    vec3 col = vec3(0.0);
    
    for (int i = 0; i < NUM_BARS; i++) {
        float x = float(i) * barSpacing;
        float freq = texture2D(audioFrequency, vec2(x, 0.5)).r;
        float height = freq * 0.8;
        
        if (uv.x > x && uv.x < x + barWidth && uv.y < height) {
            // バーの色をグラデーションに
            col.r = 1.0 - uv.y;
            col.g = 0.5 + audioBeat * 0.5;
            col.b = uv.y;
        }
    }
    
    // 背景のグラデーション
    col += vec3(0.05, 0.05, 0.1) * (1.0 - uv.y);
    
    // ビートフラッシュ
    col += vec3(audioBeat * 0.1);
    
    gl_FragColor = vec4(col, 1.0);
}`,

  waveformTunnel: `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform float audioVolume;
uniform float audioBass;
uniform float audioMid;
uniform float audioTreble;
uniform float audioBeat;
uniform sampler2D audioFrequency;

#define PI 3.14159265359

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 0.5;
    uv.x *= resolution.x / resolution.y;
    
    // 極座標変換
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // 音楽データから歪みを生成
    float freq = texture2D(audioFrequency, vec2((angle + PI) / (2.0 * PI), 0.5)).r;
    float distortion = 0.1 + freq * 0.2 + audioBass * 0.1;
    
    // トンネル効果
    float tunnel = 1.0 / (radius + distortion);
    float pattern = sin(tunnel * 5.0 - time * 2.0 + angle * 10.0);
    
    // 色の計算
    vec3 col = vec3(0.0);
    col.r = pattern * audioBass;
    col.g = pattern * audioMid * 0.8;
    col.b = pattern * audioTreble * 0.6;
    
    // ビートに反応する明るさ
    col *= 1.0 + audioBeat * 0.5;
    
    // 中心部の輝き
    col += vec3(0.2, 0.5, 1.0) * exp(-radius * 3.0) * audioVolume;
    
    gl_FragColor = vec4(col, 1.0);
}`
};