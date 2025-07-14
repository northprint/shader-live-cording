export interface GLSLFunction {
  name: string;
  category: 'sdf' | 'noise' | 'util' | 'raymarching' | 'color' | 'transform';
  description: string;
  code: string;
}

export const glslFunctions: GLSLFunction[] = [
  // SDF (Signed Distance Functions)
  {
    name: 'sdSphere',
    category: 'sdf',
    description: 'Sphere SDF',
    code: `float sdSphere(vec3 p, float r) {
    return length(p) - r;
}`
  },
  {
    name: 'sdBox',
    category: 'sdf',
    description: 'Box SDF',
    code: `float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}`
  },
  {
    name: 'sdTorus',
    category: 'sdf',
    description: 'Torus SDF',
    code: `float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}`
  },
  {
    name: 'sdCylinder',
    category: 'sdf',
    description: 'Cylinder SDF',
    code: `float sdCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}`
  },
  {
    name: 'opUnion',
    category: 'sdf',
    description: 'SDF Union operation',
    code: `float opUnion(float d1, float d2) {
    return min(d1, d2);
}`
  },
  {
    name: 'opSubtraction',
    category: 'sdf',
    description: 'SDF Subtraction operation',
    code: `float opSubtraction(float d1, float d2) {
    return max(-d1, d2);
}`
  },
  {
    name: 'opIntersection',
    category: 'sdf',
    description: 'SDF Intersection operation',
    code: `float opIntersection(float d1, float d2) {
    return max(d1, d2);
}`
  },
  {
    name: 'opSmoothUnion',
    category: 'sdf',
    description: 'Smooth SDF Union',
    code: `float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}`
  },
  
  // Noise Functions
  {
    name: 'hash',
    category: 'noise',
    description: 'Simple hash function',
    code: `float hash(vec2 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * (p.x + p.y));
}`
  },
  {
    name: 'noise2D',
    category: 'noise',
    description: 'Value noise 2D',
    code: `float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}`
  },
  {
    name: 'fbm',
    category: 'noise',
    description: 'Fractal Brownian Motion',
    code: `float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}`
  },
  {
    name: 'simplexNoise',
    category: 'noise',
    description: 'Simplex noise 2D',
    code: `vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}`
  },
  
  // Utility Functions
  {
    name: 'rotate2D',
    category: 'util',
    description: 'Rotate 2D coordinates',
    code: `mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}`
  },
  {
    name: 'rotate3D',
    category: 'util',
    description: 'Rotate 3D around Y axis',
    code: `mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c
    );
}`
  },
  {
    name: 'smoothMin',
    category: 'util',
    description: 'Smooth minimum function',
    code: `float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}`
  },
  {
    name: 'map',
    category: 'util',
    description: 'Remap value from one range to another',
    code: `float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}`
  },
  
  // Raymarching
  {
    name: 'raymarch',
    category: 'raymarching',
    description: 'Basic raymarching function',
    code: `float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = map(p); // Your SDF function here
        if (d < 0.001) break;
        t += d;
        if (t > 100.0) break;
    }
    return t;
}`
  },
  {
    name: 'calcNormal',
    category: 'raymarching',
    description: 'Calculate normal using gradient',
    code: `vec3 calcNormal(vec3 p) {
    const float eps = 0.001;
    const vec2 h = vec2(eps, 0);
    return normalize(vec3(
        map(p + h.xyy) - map(p - h.xyy),
        map(p + h.yxy) - map(p - h.yxy),
        map(p + h.yyx) - map(p - h.yyx)
    ));
}`
  },
  {
    name: 'softShadow',
    category: 'raymarching',
    description: 'Soft shadow calculation',
    code: `float softShadow(vec3 ro, vec3 rd, float mint, float tmax) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 16; i++) {
        float h = map(ro + rd * t);
        res = min(res, 8.0 * h / t);
        t += clamp(h, 0.02, 0.10);
        if (h < 0.001 || t > tmax) break;
    }
    return clamp(res, 0.0, 1.0);
}`
  },
  {
    name: 'ao',
    category: 'raymarching',
    description: 'Ambient occlusion',
    code: `float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = map(pos + h * nor);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}`
  },
  
  // Color Functions
  {
    name: 'palette',
    category: 'color',
    description: 'IQ\'s palette function',
    code: `vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}`
  },
  {
    name: 'hsv2rgb',
    category: 'color',
    description: 'HSV to RGB conversion',
    code: `vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`
  },
  {
    name: 'rgb2hsv',
    category: 'color',
    description: 'RGB to HSV conversion',
    code: `vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}`
  },
  
  // Transform Functions
  {
    name: 'opRep',
    category: 'transform',
    description: 'Repetition operator',
    code: `vec3 opRep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}`
  },
  {
    name: 'opTwist',
    category: 'transform',
    description: 'Twist deformation',
    code: `vec3 opTwist(vec3 p, float k) {
    float c = cos(k * p.y);
    float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    return vec3(m * p.xz, p.y);
}`
  },
  {
    name: 'opBend',
    category: 'transform',
    description: 'Bend deformation',
    code: `vec3 opBend(vec3 p, float k) {
    float c = cos(k * p.x);
    float s = sin(k * p.x);
    mat2 m = mat2(c, -s, s, c);
    return vec3(p.x, m * p.yz);
}`
  }
];

// 完全なレイマーチングテンプレート
export const raymarchingTemplate = `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// 距離関数
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// シーンのSDF
float map(vec3 p) {
    float sphere = sdSphere(p - vec3(0.0, 0.0, 0.0), 1.0);
    float box = sdBox(p - vec3(2.0, 0.0, 0.0), vec3(0.8));
    return min(sphere, box);
}

// 法線の計算
vec3 calcNormal(vec3 p) {
    const float eps = 0.001;
    const vec2 h = vec2(eps, 0);
    return normalize(vec3(
        map(p + h.xyy) - map(p - h.xyy),
        map(p + h.yxy) - map(p - h.yxy),
        map(p + h.yyx) - map(p - h.yyx)
    ));
}

// レイマーチング
float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) break;
        t += d;
        if (t > 100.0) break;
    }
    return t;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
    
    // カメラ
    vec3 ro = vec3(5.0 * cos(time * 0.5), 2.0, 5.0 * sin(time * 0.5));
    vec3 ta = vec3(0.0, 0.0, 0.0);
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.5 * ww);
    
    // レンダリング
    vec3 col = vec3(0.0);
    float t = raymarch(ro, rd);
    
    if (t < 100.0) {
        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal(pos);
        vec3 lig = normalize(vec3(0.5, 0.8, 0.6));
        float dif = clamp(dot(nor, lig), 0.0, 1.0);
        col = vec3(0.9, 0.6, 0.3) * dif;
    }
    
    gl_FragColor = vec4(col, 1.0);
}`;

// ノイズを使ったテンプレート
export const noiseTemplate = `precision highp float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

float hash(vec2 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // ノイズベースのパターン
    float n = fbm(uv * 5.0 + time * 0.5);
    
    // カラーマッピング
    vec3 col = vec3(n);
    col = mix(vec3(0.1, 0.2, 0.4), vec3(0.9, 0.7, 0.5), n);
    col = mix(col, vec3(1.0, 0.3, 0.1), smoothstep(0.5, 0.8, n));
    
    gl_FragColor = vec4(col, 1.0);
}`;