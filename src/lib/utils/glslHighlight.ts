/**
 * Simple GLSL syntax highlighter
 */

export interface Token {
  type: 'keyword' | 'function' | 'number' | 'comment' | 'string' | 'operator' | 'type' | 'builtin' | 'default';
  value: string;
}

// GLSL keywords
const keywords = [
  'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'return',
  'discard', 'struct', 'in', 'out', 'inout', 'uniform', 'varying',
  'attribute', 'const', 'precision', 'highp', 'mediump', 'lowp',
  'invariant', 'smooth', 'flat', 'layout'
];

// GLSL types
const types = [
  'void', 'bool', 'int', 'uint', 'float', 'double',
  'vec2', 'vec3', 'vec4', 'dvec2', 'dvec3', 'dvec4',
  'bvec2', 'bvec3', 'bvec4', 'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4', 'mat2', 'mat3', 'mat4',
  'mat2x2', 'mat2x3', 'mat2x4', 'mat3x2', 'mat3x3', 'mat3x4',
  'mat4x2', 'mat4x3', 'mat4x4', 'sampler2D', 'sampler3D',
  'samplerCube', 'sampler2DShadow', 'samplerCubeShadow'
];

// GLSL built-in variables
const builtins = [
  'gl_Position', 'gl_FragCoord', 'gl_FragColor', 'gl_FragData',
  'gl_VertexID', 'gl_InstanceID', 'gl_PointSize', 'gl_ClipDistance',
  'iTime', 'iResolution', 'iMouse', 'iAudioData', 'iFrequency',
  'iBass', 'iMid', 'iTreble', 'iBeat', 'iAudioVolume', 'iAudioBPM'
];

// GLSL built-in functions
const functions = [
  'radians', 'degrees', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt',
  'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max',
  'clamp', 'mix', 'step', 'smoothstep', 'length', 'distance', 'dot',
  'cross', 'normalize', 'faceforward', 'reflect', 'refract',
  'texture', 'texture2D', 'textureCube', 'dFdx', 'dFdy', 'fwidth',
  'mainImage', 'main'
];

export function tokenizeGLSL(code: string): Token[] {
  const tokens: Token[] = [];
  
  // Regular expressions for different token types
  const patterns = [
    { regex: /\/\/.*$/gm, type: 'comment' },
    { regex: /\/\*[\s\S]*?\*\//gm, type: 'comment' },
    { regex: /"([^"\\]|\\.)*"/g, type: 'string' },
    { regex: /'([^'\\]|\\.)*'/g, type: 'string' },
    { regex: /\b\d+\.?\d*([eE][+-]?\d+)?[fFdD]?\b/g, type: 'number' },
    { regex: /\b0[xX][0-9a-fA-F]+\b/g, type: 'number' },
  ];
  
  // Create a map to track which characters have been tokenized
  const tokenized = new Array(code.length).fill(false);
  
  // First pass: comments, strings, and numbers
  patterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(code)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Check if this range has already been tokenized
      let alreadyTokenized = false;
      for (let i = start; i < end; i++) {
        if (tokenized[i]) {
          alreadyTokenized = true;
          break;
        }
      }
      
      if (!alreadyTokenized) {
        tokens.push({ type: type as Token['type'], value: match[0] });
        for (let i = start; i < end; i++) {
          tokenized[i] = true;
        }
      }
    }
  });
  
  // Second pass: identifiers and operators
  const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  let match;
  
  while ((match = identifierRegex.exec(code)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    
    // Check if already tokenized
    let alreadyTokenized = false;
    for (let i = start; i < end; i++) {
      if (tokenized[i]) {
        alreadyTokenized = true;
        break;
      }
    }
    
    if (!alreadyTokenized) {
      const word = match[0];
      let type: Token['type'] = 'default';
      
      if (keywords.includes(word)) {
        type = 'keyword';
      } else if (types.includes(word)) {
        type = 'type';
      } else if (builtins.includes(word)) {
        type = 'builtin';
      } else if (functions.includes(word)) {
        type = 'function';
      }
      
      tokens.push({ type, value: word });
      for (let i = start; i < end; i++) {
        tokenized[i] = true;
      }
    }
  }
  
  // Third pass: operators
  const operatorRegex = /[+\-*/%=<>!&|^~?:,;.()[\]{}]/g;
  
  while ((match = operatorRegex.exec(code)) !== null) {
    const start = match.index;
    
    if (!tokenized[start]) {
      tokens.push({ type: 'operator', value: match[0] });
      tokenized[start] = true;
    }
  }
  
  // Final pass: collect remaining characters
  let currentToken = '';
  let currentStart = 0;
  
  for (let i = 0; i < code.length; i++) {
    if (!tokenized[i]) {
      if (currentToken === '') {
        currentStart = i;
      }
      currentToken += code[i];
    } else if (currentToken !== '') {
      tokens.push({ type: 'default', value: currentToken });
      currentToken = '';
    }
  }
  
  if (currentToken !== '') {
    tokens.push({ type: 'default', value: currentToken });
  }
  
  // Sort tokens by their position in the original code
  return tokens.sort((a, b) => {
    const aIndex = code.indexOf(a.value);
    const bIndex = code.indexOf(b.value);
    return aIndex - bIndex;
  });
}

export function highlightGLSL(code: string): string {
  const tokens = tokenizeGLSL(code);
  
  return tokens.map(token => {
    const escaped = escapeHtml(token.value);
    
    switch (token.type) {
      case 'keyword':
        return `<span class="glsl-keyword">${escaped}</span>`;
      case 'type':
        return `<span class="glsl-type">${escaped}</span>`;
      case 'builtin':
        return `<span class="glsl-builtin">${escaped}</span>`;
      case 'function':
        return `<span class="glsl-function">${escaped}</span>`;
      case 'number':
        return `<span class="glsl-number">${escaped}</span>`;
      case 'string':
        return `<span class="glsl-string">${escaped}</span>`;
      case 'comment':
        return `<span class="glsl-comment">${escaped}</span>`;
      case 'operator':
        return `<span class="glsl-operator">${escaped}</span>`;
      default:
        return escaped;
    }
  }).join('');
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}