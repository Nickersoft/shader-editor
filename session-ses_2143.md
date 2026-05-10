# Shader presets mapping to Paper Design shaders 1:1 review

**Session ID:** ses_2143d7c26ffeBZDkRO43p7ML5k
**Created:** 5/2/2026, 10:54:46 PM
**Updated:** 5/2/2026, 11:46:21 PM

---

## User

i need you to review all of the shaders in https://github.com/paper-design/shaders and make sure our presets map to them 1:1. adjust the
primitives if needed to achieve the exact effects, including adding image support

---

## Assistant (Plan · GPT-5.5 · 9.2s)

Certainly, Mr. Nickerson. I shall treat this as a planning pass only: inspect the local shader/preset architecture and the upstream `paper-design/shaders` API, then return a concrete implementation plan without touching files.

**Tool: glob**

**Input:**

```json
{
  "pattern": "**/*shader*",
  "path": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor"
}
```

**Output:**

```
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-preview.tsx
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-editor.tsx
```

**Tool: glob**

**Input:**

```json
{
  "pattern": "**/*preset*",
  "path": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor"
}
```

**Output:**

```
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts
```

**Tool: glob**

**Input:**

```json
{
  "pattern": "**/package.json",
  "path": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor"
}
```

**Output:**

```
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/package.json
```

**Tool: grep**

**Input:**

```json
{
  "pattern": "paper-design|Shader|preset|primitive|image|texture",
  "path": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor",
  "include": "*.{ts,tsx,js,jsx,json,md}"
}
```

**Output:**

```
Found 298 matches (showing first 100)
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/scripts/check-generator.ts:
  Line 1: // Smoke test: generate fragment shaders for the new atom + image-source +

  Line 10: import { generateShader } from '../src/lib/shader-composer/generator'

  Line 31:   const result = generateShader(layers, name)

  Line 32:   const all = result.passes.map((p) => p.fragmentShader).join('\n')

  Line 51: check('ImageSourceAlone', [inst('image-source')], [

  Line 52:   'uniform sampler2D u_imagesource_image;',

  Line 53:   'uniform vec4 u_imagesource_image_meta;',

  Line 54:   'uniform vec2 u_imagesource_image_offset;',

  Line 58: check('ColorRampOnImage', [inst('image-source'), inst('color-ramp')], [

  Line 59:   'uniform sampler2D u_imagesource_image;',

  Line 71: check('WaterRippleOnImage', [inst('image-source'), inst('water-ripple')], [

  Line 72:   'uniform sampler2D u_imagesource_image;',

  Line 76: check('CmykSeparate', [inst('image-source'), inst('cmyk-separate')], [


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts:
  Line 1: // Paper preset gallery, expressed as compositions of our atoms.

  Line 7: // atoms; everything else is built from existing primitives plus the new

  Line 8: // foundations (image-source, color-ramp, vec4-array palettes, water-ripple).

  Line 39:   presets: PaperPreset[]

  Line 68:     presets: [

  Line 135:     presets: [

  Line 162:     presets: [

  Line 203:     presets: [

  Line 233:     presets: [

  Line 262:     presets: [

  Line 303:     presets: [

  Line 398:     presets: [

  Line 422:     presets: [

  Line 447:     presets: [

  Line 471:     presets: [

  Line 496:     presets: [

  Line 518:     presets: [

  Line 544:     presets: [

  Line 576:     presets: [

  Line 609:     presets: [

  Line 702:   // Image-driven presets (require user-supplied image to render anything) ----

  Line 707:     presets: [

  Line 713:             layerType: 'image-source',

  Line 714:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 738:     slug: 'image-dithering',

  Line 741:     presets: [

  Line 747:             layerType: 'image-source',

  Line 748:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 767:     presets: [

  Line 773:             layerType: 'image-source',

  Line 774:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 794:     presets: [

  Line 800:             layerType: 'image-source',

  Line 801:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 830:     slug: 'paper-texture',

  Line 833:     presets: [

  Line 839:             layerType: 'image-source',

  Line 840:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 854:     presets: [

  Line 860:             layerType: 'image-source',

  Line 861:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },

  Line 881: // Flat list for the existing preset picker UI -----------------------------

  Line 893:     group.presets.map((p) => ({


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/shapes.ts:
  Line 3: // Shared SDF helpers each primitive depends on.

  Line 204: // Faithful port of paper-design/shaders' pulsing-border. Spots travel around

  Line 211: // pattern isn't reducible to existing primitives — see `color-array-radial-

  Line 272:   // hash21 returns a uniform-ish [0,1] scalar, matching Paper's noise-texture


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts:
  Line 2: import { PAPER_FLAT_PRESETS } from './paper-presets'

  Line 4: // Built-in preset gallery. Each preset is a layer-stack recipe; the runtime

  Line 7: // Most entries are **compositions of atomic primitives** that approximate

  Line 12: // `paper-presets.ts` is the source of truth for Paper-equivalent recipes

  Line 30: export { PAPER_GROUPS, PAPER_FLAT_PRESETS } from './paper-presets'

  Line 31: export type { PaperGroup, PaperPreset, PaperFidelity } from './paper-presets'

  Line 33: // New canonical preset list, derived from paper-presets.ts. Mapped to the


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/property-panel.tsx:
  Line 236:               : "Drop or paste an image"}

  Line 246:             aria-label="Clear image"

  Line 255:         accept="image/*"


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts:
  Line 8: // Two-color pattern primitive helpers. Each pattern computes a 0..1 mask `m`

  Line 278: // port of paper-design/shaders' color-panels algorithm; kept as a single

  Line 279: // atom because the panel-rotation field isn't reducible to existing primitives.


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/distorters.ts:
  Line 22: return texture(u_prevPass, distorted);`,

  Line 42: return texture(u_prevPass, uv + vec2(dx, dy) * {{amount}});`,

  Line 61: return texture(u_prevPass, c + d);`,

  Line 85: return texture(u_prevPass, c + rd);`,

  Line 107: return texture(u_prevPass, c + rd);`,

  Line 131: return texture(u_prevPass, c + rd);`,

  Line 151: return texture(u_prevPass, uv + offset);`,

  Line 174: return texture(u_prevPass, uv + offset);`,

  Line 197: return texture(u_prevPass, uv + normalize(d + 1e-6) * wave);`,

  Line 216: return texture(u_prevPass, uv + offset);`,

  Line 238: return texture(u_prevPass, c + rotate2D(d, a));`,

  Line 262: return texture(u_prevPass, c + rd);`,

  Line 292: return texture(u_prevPass, q);`,

  Line 311: return texture(u_prevPass, q + 0.5);`,

  Line 327: return texture(u_prevPass, q);`,

  Line 349: return texture(u_prevPass, uv + grad * {{amount}});`,

  Line 371: return texture(u_prevPass, q2);`,

  Line 393: float r = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;

  Line 394: float g = texture(u_prevPass, q).g;

  Line 395: float b = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;

  Line 417: float r = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;

  Line 418: float g = texture(u_prevPass, q).g;

  Line 419: float b = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;

  Line 446: float rch = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;

  Line 447: float gch = texture(u_prevPass, q).g;

  Line 448: float bch = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;

  Line 459: // `image-source` (or any prev-pass) for caustic-style water surfaces.


(Results truncated: showing 100 of 298 matches (198 hidden). Consider using a more specific path or pattern.)
```

---

## Assistant (Plan · GPT-5.5 · 4.7s)

**Tool: skill**

**Input:**

```json
{
  "name": "threejs-shaders"
}
```

**Output:**

````
<skill_content name="threejs-shaders">
# Skill: threejs-shaders

# Three.js Shaders

## Quick Start

```javascript
import * as THREE from "three";

const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff0000) },
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

// Update in animation loop
material.uniforms.time.value = clock.getElapsedTime();
````

## ShaderMaterial vs RawShaderMaterial

### ShaderMaterial

Three.js provides built-in uniforms and attributes.

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `
    // Built-in uniforms available:
    // uniform mat4 modelMatrix;
    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;
    // uniform mat4 viewMatrix;
    // uniform mat3 normalMatrix;
    // uniform vec3 cameraPosition;

    // Built-in attributes available:
    // attribute vec3 position;
    // attribute vec3 normal;
    // attribute vec2 uv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `,
});
```

### RawShaderMaterial

Full control - you define everything.

```javascript
const material = new THREE.RawShaderMaterial({
  uniforms: {
    projectionMatrix: { value: camera.projectionMatrix },
    modelViewMatrix: { value: new THREE.Matrix4() },
  },
  vertexShader: `
    precision highp float;

    attribute vec3 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `,
});
```

## Uniforms

### Uniform Types

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    // Numbers
    floatValue: { value: 1.5 },
    intValue: { value: 1 },

    // Vectors
    vec2Value: { value: new THREE.Vector2(1, 2) },
    vec3Value: { value: new THREE.Vector3(1, 2, 3) },
    vec4Value: { value: new THREE.Vector4(1, 2, 3, 4) },

    // Colors (converted to vec3)
    colorValue: { value: new THREE.Color(0xff0000) },

    // Matrices
    mat3Value: { value: new THREE.Matrix3() },
    mat4Value: { value: new THREE.Matrix4() },

    // Textures
    textureValue: { value: texture },
    cubeTextureValue: { value: cubeTexture },

    // Arrays
    floatArray: { value: [1.0, 2.0, 3.0] },
    vec3Array: {
      value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)],
    },
  },
});
```

### GLSL Declarations

```glsl
// In shader
uniform float floatValue;
uniform int intValue;
uniform vec2 vec2Value;
uniform vec3 vec3Value;
uniform vec3 colorValue;    // Color becomes vec3
uniform vec4 vec4Value;
uniform mat3 mat3Value;
uniform mat4 mat4Value;
uniform sampler2D textureValue;
uniform samplerCube cubeTextureValue;
uniform float floatArray[3];
uniform vec3 vec3Array[2];
```

### Updating Uniforms

```javascript
// Direct assignment
material.uniforms.time.value = clock.getElapsedTime();

// Vector/Color updates
material.uniforms.position.value.set(x, y, z);
material.uniforms.color.value.setHSL(hue, 1, 0.5);

// Matrix updates
material.uniforms.matrix.value.copy(mesh.matrixWorld);
```

## Varyings

Pass data from vertex to fragment shader.

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Use interpolated values
      gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
    }
  `,
});
```

## Common Shader Patterns

### Texture Sampling

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    map: { value: texture },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(map, vUv);
      gl_FragColor = texColor;
    }
  `,
});
```

### Vertex Displacement

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    amplitude: { value: 0.5 },
  },
  vertexShader: `
    uniform float time;
    uniform float amplitude;

    void main() {
      vec3 pos = position;

      // Wave displacement
      pos.z += sin(pos.x * 5.0 + time) * amplitude;
      pos.z += sin(pos.y * 5.0 + time) * amplitude;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(0.5, 0.8, 1.0, 1.0);
    }
  `,
});
```

### Fresnel Effect

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      // cameraPosition is auto-provided by ShaderMaterial
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);

      vec3 baseColor = vec3(0.0, 0.0, 0.5);
      vec3 fresnelColor = vec3(0.5, 0.8, 1.0);

      gl_FragColor = vec4(mix(baseColor, fresnelColor, fresnel), 1.0);
    }
  `,
});
```

### Noise-Based Effects

```glsl
// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// Value noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Usage
float n = noise(vUv * 10.0 + time);
```

### Gradient

```glsl
// Linear gradient
vec3 color = mix(colorA, colorB, vUv.y);

// Radial gradient
float dist = distance(vUv, vec2(0.5));
vec3 color = mix(centerColor, edgeColor, dist * 2.0);

// Smooth gradient with custom curve
float t = smoothstep(0.0, 1.0, vUv.y);
vec3 color = mix(colorA, colorB, t);
```

### Rim Lighting

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 viewDir = normalize(-vViewPosition);
      float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
      rim = pow(rim, 4.0);

      vec3 baseColor = vec3(0.2, 0.2, 0.8);
      vec3 rimColor = vec3(1.0, 0.5, 0.0);

      gl_FragColor = vec4(baseColor + rimColor * rim, 1.0);
    }
  `,
});
```

### Dissolve Effect

```glsl
uniform float progress;
uniform sampler2D noiseMap;

void main() {
  float noise = texture2D(noiseMap, vUv).r;

  if (noise < progress) {
    discard;
  }

  // Edge glow
  float edge = smoothstep(progress, progress + 0.1, noise);
  vec3 edgeColor = vec3(1.0, 0.5, 0.0);
  vec3 baseColor = vec3(0.5);

  gl_FragColor = vec4(mix(edgeColor, baseColor, edge), 1.0);
}
```

## Extending Built-in Materials

### onBeforeCompile

Modify existing material shaders.

```javascript
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

material.onBeforeCompile = (shader) => {
  // Add custom uniform
  shader.uniforms.time = { value: 0 };

  // Store reference for updates
  material.userData.shader = shader;

  // Modify vertex shader
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
    #include <begin_vertex>
    transformed.y += sin(position.x * 10.0 + time) * 0.1;
    `,
  );

  // Add uniform declaration
  shader.vertexShader = "uniform float time;\n" + shader.vertexShader;
};

// Update in animation loop
if (material.userData.shader) {
  material.userData.shader.uniforms.time.value = clock.getElapsedTime();
}
```

### Common Injection Points

```javascript
// Vertex shader chunks
"#include <begin_vertex>"; // After position is calculated
"#include <project_vertex>"; // After gl_Position
"#include <beginnormal_vertex>"; // Normal calculation start

// Fragment shader chunks
"#include <color_fragment>"; // After diffuse color
"#include <output_fragment>"; // Final output
"#include <fog_fragment>"; // After fog applied
```

## GLSL Built-in Functions

### Math Functions

```glsl
// Basic
abs(x), sign(x), floor(x), ceil(x), fract(x)
mod(x, y), min(x, y), max(x, y), clamp(x, min, max)
mix(a, b, t), step(edge, x), smoothstep(edge0, edge1, x)

// Trigonometry
sin(x), cos(x), tan(x)
asin(x), acos(x), atan(y, x), atan(x)
radians(degrees), degrees(radians)

// Exponential
pow(x, y), exp(x), log(x), exp2(x), log2(x)
sqrt(x), inversesqrt(x)
```

### Vector Functions

```glsl
// Length and distance
length(v), distance(p0, p1), dot(x, y), cross(x, y)

// Normalization
normalize(v)

// Reflection and refraction
reflect(I, N), refract(I, N, eta)

// Component-wise
lessThan(x, y), lessThanEqual(x, y)
greaterThan(x, y), greaterThanEqual(x, y)
equal(x, y), notEqual(x, y)
any(bvec), all(bvec)
```

### Texture Functions

```glsl
// GLSL 1.0 (default) - use texture2D/textureCube
texture2D(sampler, coord)
texture2D(sampler, coord, bias)
textureCube(sampler, coord)

// GLSL 3.0 (glslVersion: THREE.GLSL3) - use texture()
// texture(sampler, coord) replaces texture2D/textureCube
// Also use: out vec4 fragColor instead of gl_FragColor

// Texture size (GLSL 1.30+)
textureSize(sampler, lod)
```

## Common Material Properties

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    /* ... */
  },
  vertexShader: "/* ... */",
  fragmentShader: "/* ... */",

  // Rendering
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: true,

  // Blending
  blending: THREE.NormalBlending,
  // AdditiveBlending, SubtractiveBlending, MultiplyBlending

  // Wireframe
  wireframe: false,
  wireframeLinewidth: 1, // Note: >1 has no effect on most platforms (WebGL limitation)

  // Extensions
  extensions: {
    derivatives: true, // For fwidth, dFdx, dFdy
    fragDepth: true, // gl_FragDepth
    drawBuffers: true, // Multiple render targets
    shaderTextureLOD: true, // texture2DLod
  },

  // GLSL version
  glslVersion: THREE.GLSL3, // For WebGL2 features
});
```

## Shader Includes

### Using Three.js Shader Chunks

```javascript
import { ShaderChunk } from "three";

const fragmentShader = `
  ${ShaderChunk.common}
  ${ShaderChunk.packing}

  uniform sampler2D depthTexture;
  varying vec2 vUv;

  void main() {
    float depth = texture2D(depthTexture, vUv).r;
    float linearDepth = perspectiveDepthToViewZ(depth, 0.1, 1000.0);
    gl_FragColor = vec4(vec3(-linearDepth / 100.0), 1.0);
  }
`;
```

### External Shader Files

```javascript
// With vite/webpack
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
});
```

## Instanced Shaders

```javascript
// Instanced attribute
const offsets = new Float32Array(instanceCount * 3);
// Fill offsets...
geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(offsets, 3));

const material = new THREE.ShaderMaterial({
  vertexShader: `
    attribute vec3 offset;

    void main() {
      vec3 pos = position + offset;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `,
});
```

## Debugging Shaders

```javascript
// Check for compile errors
material.onBeforeCompile = (shader) => {
  console.log("Vertex Shader:", shader.vertexShader);
  console.log("Fragment Shader:", shader.fragmentShader);
};

// Visual debugging
fragmentShader: `
  void main() {
    // Debug UV
    gl_FragColor = vec4(vUv, 0.0, 1.0);

    // Debug normals
    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);

    // Debug position
    gl_FragColor = vec4(vPosition * 0.1 + 0.5, 1.0);
  }
`;

// Check WebGL errors
renderer.debug.checkShaderErrors = true;
```

## Performance Tips

1. **Minimize uniforms**: Group related values into vectors
2. **Avoid conditionals**: Use mix/step instead of if/else
3. **Precalculate**: Move calculations to JS when possible
4. **Use textures**: For complex functions, use lookup tables
5. **Limit overdraw**: Avoid transparent objects when possible

```glsl
// Instead of:
if (value > 0.5) {
  color = colorA;
} else {
  color = colorB;
}

// Use:
color = mix(colorB, colorA, step(0.5, value));
```

## See Also

- `threejs-materials` - Built-in material types
- `threejs-postprocessing` - Full-screen shader effects
- `threejs-textures` - Texture sampling in shaders

Base directory for this skill: file:///Users/tjnickerson/.agents/skills/threejs-shaders
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>

</skill_files>
</skill_content>

````

---

## Assistant (Plan · GPT-5.5 · 3.6s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/package.json",
  "offset": 1,
  "limit": 220
}
````

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/package.json</path>
<type>file</type>
<content>
1: {
2:   "name": "shader-composer",
3:   "version": "0.1.0",
4:   "private": true,
5:   "type": "module",
6:   "scripts": {
7:     "dev": "vite dev",
8:     "build": "vite build",
9:     "start": "node .output/server/index.mjs"
10:   },
11:   "dependencies": {
12:     "@dnd-kit/core": "^6.3.1",
13:     "@dnd-kit/sortable": "^10.0.0",
14:     "@dnd-kit/utilities": "^3.2.2",
15:     "@hookform/resolvers": "^3.9.1",
16:     "@radix-ui/react-accordion": "1.2.12",
17:     "@radix-ui/react-alert-dialog": "1.1.15",
18:     "@radix-ui/react-aspect-ratio": "1.1.8",
19:     "@radix-ui/react-avatar": "1.1.11",
20:     "@radix-ui/react-checkbox": "1.3.3",
21:     "@radix-ui/react-collapsible": "1.1.12",
22:     "@radix-ui/react-context-menu": "2.2.16",
23:     "@radix-ui/react-dialog": "1.1.15",
24:     "@radix-ui/react-dropdown-menu": "2.1.16",
25:     "@radix-ui/react-hover-card": "1.1.15",
26:     "@radix-ui/react-label": "2.1.8",
27:     "@radix-ui/react-menubar": "1.1.16",
28:     "@radix-ui/react-navigation-menu": "1.2.14",
29:     "@radix-ui/react-popover": "1.1.15",
30:     "@radix-ui/react-progress": "1.1.8",
31:     "@radix-ui/react-radio-group": "1.3.8",
32:     "@radix-ui/react-scroll-area": "1.2.10",
33:     "@radix-ui/react-select": "2.2.6",
34:     "@radix-ui/react-separator": "1.1.8",
35:     "@radix-ui/react-slider": "1.3.6",
36:     "@radix-ui/react-slot": "1.2.4",
37:     "@radix-ui/react-switch": "1.2.6",
38:     "@radix-ui/react-tabs": "1.1.13",
39:     "@radix-ui/react-toast": "1.2.15",
40:     "@radix-ui/react-toggle": "1.1.10",
41:     "@radix-ui/react-toggle-group": "1.1.11",
42:     "@radix-ui/react-tooltip": "1.2.8",
43:     "@tanstack/react-router": "^1.169.1",
44:     "@tanstack/react-start": "^1.167.58",
45:     "@vercel/analytics": "1.6.1",
46:     "autoprefixer": "^10.4.20",
47:     "class-variance-authority": "^0.7.1",
48:     "clsx": "^2.1.1",
49:     "cmdk": "1.1.1",
50:     "date-fns": "4.1.0",
51:     "embla-carousel-react": "8.6.0",
52:     "input-otp": "1.4.2",
53:     "lucide-react": "^0.564.0",
54:     "next-themes": "^0.4.6",
55:     "nitro": "3.0.260429-beta",
56:     "prism-react-renderer": "^2.4.1",
57:     "radix-ui": "^1.4.3",
58:     "react": "^19",
59:     "react-day-picker": "9.13.2",
60:     "react-dom": "^19",
61:     "react-hook-form": "^7.54.1",
62:     "react-resizable-panels": "^2.1.7",
63:     "recharts": "2.15.0",
64:     "sonner": "^1.7.1",
65:     "tailwind-merge": "^3.3.1",
66:     "vaul": "^1.1.2",
67:     "vite": "^8.0.10",
68:     "@vitejs/plugin-react": "^6.0.1",
69:     "zod": "^3.24.1"
70:   },
71:   "devDependencies": {
72:     "@tailwindcss/vite": "^4.2.0",
73:     "@types/node": "^22",
74:     "@types/react": "^19",
75:     "@types/react-dom": "^19",
76:     "tailwindcss": "^4.2.0",
77:     "tw-animate-css": "1.3.3",
78:     "typescript": "5.7.3"
79:   }
80: }

(End of file - total 80 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts",
  "offset": 1,
  "limit": 980
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts</path>
<type>file</type>
<content>
1: // Paper preset gallery, expressed as compositions of our atoms.
2: //
3: // Most entries deliberately use multiple stacked layers rather than a single
4: // monolithic Paper port — this is the editor's reason for being. Some Paper
5: // shaders that have no obvious decomposition (mesh-gradient, neuro-noise,
6: // swirl, spiral, simplex-noise, color-panels) lean on their corresponding
7: // atoms; everything else is built from existing primitives plus the new
8: // foundations (image-source, color-ramp, vec4-array palettes, water-ripple).
9: //
10: // `fidelity` describes how close the composition is expected to look to
11: // Paper's render at the same uniform values:
12: //   exact       — same algorithm, same parameter mapping; visual parity.
13: //   approx      — composition produces the same family of looks but
14: //                 isn't the identical algorithm; small differences expected.
15: //   placeholder — atom is missing or only partially expressible today; the
16: //                 composition is the best current approximation.
17:
18: import type { BlendMode, UniformValue, Vec4ArrayValue } from './types'
19:
20: export type PaperFidelity = 'exact' | 'approx' | 'placeholder'
21:
22: export interface PaperLayerSpec {
23:   layerType: string
24:   uniformValues: Record<string, UniformValue>
25:   blendMode?: BlendMode
26:   opacity?: number
27: }
28:
29: export interface PaperPreset {
30:   name: string
31:   fidelity: PaperFidelity
32:   layers: PaperLayerSpec[]
33: }
34:
35: export interface PaperGroup {
36:   slug: string
37:   name: string
38:   description: string
39:   presets: PaperPreset[]
40: }
41:
42: // Helpers -----------------------------------------------------------------
43:
44: const palette = (...colors: number[][]): Vec4ArrayValue => ({
45:   values: colors.map((c) => (c.length === 4 ? c : [c[0], c[1], c[2], 1])),
46:   length: colors.length,
47: })
48:
49: const hex = (s: string): number[] => {
50:   const v = s.replace('#', '')
51:   const n = v.length
52:   const r = parseInt(v.substring(0, 2), 16) / 255
53:   const g = parseInt(v.substring(2, 4), 16) / 255
54:   const b = parseInt(v.substring(4, 6), 16) / 255
55:   const a = n === 8 ? parseInt(v.substring(6, 8), 16) / 255 : 1
56:   return [r, g, b, a]
57: }
58:
59: const noImage = { url: null, sourceKind: 'url' as const, fit: 'cover' as const }
60:
61: // Groups -------------------------------------------------------------------
62:
63: export const PAPER_GROUPS: PaperGroup[] = [
64:   {
65:     slug: 'mesh-gradient',
66:     name: 'Mesh Gradient',
67:     description: 'IDW colour spots over distorted UV',
68:     presets: [
69:       {
70:         name: 'Default',
71:         fidelity: 'exact',
72:         layers: [
73:           {
74:             layerType: 'paper-mesh-gradient',
75:             uniformValues: {
76:               color1: hex('#e0eaff').slice(0, 3),
77:               color2: hex('#241d9a').slice(0, 3),
78:               color3: hex('#f75092').slice(0, 3),
79:               color4: hex('#9f50d3').slice(0, 3),
80:               distortion: 0.8,
81:               swirl: 0.1,
82:               grainMixer: 0,
83:               grainOverlay: 0,
84:               speed: 1,
85:             },
86:           },
87:         ],
88:       },
89:       {
90:         name: 'Purple',
91:         fidelity: 'exact',
92:         layers: [
93:           {
94:             layerType: 'paper-mesh-gradient',
95:             uniformValues: {
96:               color1: hex('#aaa7d7').slice(0, 3),
97:               color2: hex('#3c2b8e').slice(0, 3),
98:               color3: hex('#aaa7d7').slice(0, 3),
99:               color4: hex('#3c2b8e').slice(0, 3),
100:               distortion: 1,
101:               swirl: 1,
102:               grainMixer: 0,
103:               grainOverlay: 0,
104:               speed: 0.6,
105:             },
106:           },
107:         ],
108:       },
109:       {
110:         name: 'Beach',
111:         fidelity: 'exact',
112:         layers: [
113:           {
114:             layerType: 'paper-mesh-gradient',
115:             uniformValues: {
116:               color1: hex('#ffe6a3').slice(0, 3),
117:               color2: hex('#ff7e5f').slice(0, 3),
118:               color3: hex('#feb47b').slice(0, 3),
119:               color4: hex('#86a8e7').slice(0, 3),
120:               distortion: 0.7,
121:               swirl: 0.4,
122:               grainMixer: 0.2,
123:               grainOverlay: 0.15,
124:               speed: 0.4,
125:             },
126:           },
127:         ],
128:       },
129:     ],
130:   },
131:   {
132:     slug: 'static-mesh-gradient',
133:     name: 'Static Mesh',
134:     description: 'Mesh gradient with motion frozen',
135:     presets: [
136:       {
137:         name: 'Default',
138:         fidelity: 'exact',
139:         layers: [
140:           {
141:             layerType: 'paper-mesh-gradient',
142:             uniformValues: {
143:               color1: hex('#e0eaff').slice(0, 3),
144:               color2: hex('#241d9a').slice(0, 3),
145:               color3: hex('#f75092').slice(0, 3),
146:               color4: hex('#9f50d3').slice(0, 3),
147:               distortion: 0.6,
148:               swirl: 0.3,
149:               grainMixer: 0,
150:               grainOverlay: 0,
151:               speed: 0,
152:             },
153:           },
154:         ],
155:       },
156:     ],
157:   },
158:   {
159:     slug: 'neuro-noise',
160:     name: 'Neuro Noise',
161:     description: 'Synaptic web through 3-color ramp',
162:     presets: [
163:       {
164:         name: 'Default',
165:         fidelity: 'exact',
166:         layers: [
167:           {
168:             layerType: 'paper-neuro-noise',
169:             uniformValues: {
170:               colorBack: [0, 0, 0],
171:               colorMid: hex('#477aff').slice(0, 3),
172:               colorFront: [1, 1, 1],
173:               brightness: 0.5,
174:               contrast: 0.4,
175:               speed: 0.3,
176:             },
177:           },
178:         ],
179:       },
180:       {
181:         name: 'Cyan',
182:         fidelity: 'exact',
183:         layers: [
184:           {
185:             layerType: 'paper-neuro-noise',
186:             uniformValues: {
187:               colorBack: [0, 0, 0],
188:               colorMid: hex('#0aa9ff').slice(0, 3),
189:               colorFront: hex('#aff5ff').slice(0, 3),
190:               brightness: 0.6,
191:               contrast: 0.55,
192:               speed: 0.5,
193:             },
194:           },
195:         ],
196:       },
197:     ],
198:   },
199:   {
200:     slug: 'swirl',
201:     name: 'Swirl',
202:     description: 'Twisting radial bands',
203:     presets: [
204:       {
205:         name: 'Default',
206:         fidelity: 'exact',
207:         layers: [
208:           {
209:             layerType: 'paper-swirl',
210:             uniformValues: {
211:               colorBack: [0.02, 0.02, 0.05],
212:               color1: [1, 0.9, 0.4],
213:               color2: [0.95, 0.3, 0.5],
214:               color3: [0.3, 0.5, 1],
215:               bandCount: 4,
216:               twist: 0.4,
217:               centerSize: 0.3,
218:               proportion: 0.5,
219:               softness: 0,
220:               noiseAmount: 0,
221:               noiseFrequency: 0.5,
222:               speed: 0.4,
223:             },
224:           },
225:         ],
226:       },
227:     ],
228:   },
229:   {
230:     slug: 'spiral',
231:     name: 'Spiral',
232:     description: 'Animated logarithmic spiral',
233:     presets: [
234:       {
235:         name: 'Default',
236:         fidelity: 'exact',
237:         layers: [
238:           {
239:             layerType: 'paper-spiral',
240:             uniformValues: {
241:               colorBack: [0.05, 0.05, 0.08],
242:               colorFront: [0.95, 0.85, 0.4],
243:               density: 0.5,
244:               distortion: 0,
245:               strokeWidth: 0.5,
246:               strokeTaper: 0,
247:               strokeCap: 0,
248:               noiseAmount: 0,
249:               noiseFrequency: 0.5,
250:               softness: 0,
251:               speed: 0.5,
252:             },
253:           },
254:         ],
255:       },
256:     ],
257:   },
258:   {
259:     slug: 'simplex-noise',
260:     name: 'Simplex Noise',
261:     description: 'Two-sample simplex through stepped 3-color ramp',
262:     presets: [
263:       {
264:         name: 'Default',
265:         fidelity: 'exact',
266:         layers: [
267:           {
268:             layerType: 'paper-simplex-noise',
269:             uniformValues: {
270:               color1: [0, 0, 0.05],
271:               color2: [0.4, 0.6, 1],
272:               color3: [1, 0.95, 0.85],
273:               softness: 1,
274:               stepsPerColor: 1,
275:               speed: 1,
276:             },
277:           },
278:         ],
279:       },
280:       {
281:         name: 'Stepped',
282:         fidelity: 'exact',
283:         layers: [
284:           {
285:             layerType: 'paper-simplex-noise',
286:             uniformValues: {
287:               color1: hex('#0a0a14').slice(0, 3),
288:               color2: hex('#5060c0').slice(0, 3),
289:               color3: hex('#fff5e0').slice(0, 3),
290:               softness: 0.2,
291:               stepsPerColor: 4,
292:               speed: 0.6,
293:             },
294:           },
295:         ],
296:       },
297:     ],
298:   },
299:   {
300:     slug: 'color-panels',
301:     name: 'Color Panels',
302:     description: '7-color rotating semi-transparent panels',
303:     presets: [
304:       {
305:         name: 'Default',
306:         fidelity: 'exact',
307:         layers: [
308:           {
309:             layerType: 'color-array-radial-panels',
310:             uniformValues: {
311:               colors: palette(
312:                 hex('#ff9d00'),
313:                 hex('#fd4f30'),
314:                 hex('#809bff'),
315:                 hex('#6d2eff'),
316:                 hex('#333aff'),
317:                 hex('#f15cff'),
318:                 hex('#ffd557'),
319:               ),
320:               colorBack: hex('#000000'),
321:               density: 3,
322:               angle1: 0,
323:               angle2: 0,
324:               length: 1.1,
325:               edges: false,
326:               blur: 0,
327:               fadeIn: 1,
328:               fadeOut: 0.3,
329:               gradient: 0,
330:               speed: 0.5,
331:             },
332:           },
333:         ],
334:       },
335:       {
336:         name: 'Glass',
337:         fidelity: 'exact',
338:         layers: [
339:           {
340:             layerType: 'color-array-radial-panels',
341:             uniformValues: {
342:               colors: palette(
343:                 hex('#00cfff'),
344:                 hex('#ff2d55'),
345:                 hex('#34c759'),
346:                 hex('#af52de'),
347:               ),
348:               colorBack: [1, 1, 1, 0],
349:               density: 1.6,
350:               angle1: 0.3,
351:               angle2: 0.3,
352:               length: 1,
353:               edges: true,
354:               blur: 0.25,
355:               fadeIn: 0.85,
356:               fadeOut: 0.3,
357:               gradient: 0,
358:               speed: 1,
359:             },
360:           },
361:         ],
362:       },
363:       {
364:         name: 'Gradient',
365:         fidelity: 'exact',
366:         layers: [
367:           {
368:             layerType: 'color-array-radial-panels',
369:             uniformValues: {
370:               colors: palette(
371:                 hex('#f2ff00'),
372:                 [0, 0, 0, 0],
373:                 [0, 0, 0, 0],
374:                 hex('#5a0283'),
375:                 hex('#005eff'),
376:               ),
377:               colorBack: hex('#100020'),
378:               density: 2.5,
379:               angle1: 0.05,
380:               angle2: -0.05,
381:               length: 1.4,
382:               edges: false,
383:               blur: 0.05,
384:               fadeIn: 1,
385:               fadeOut: 0,
386:               gradient: 1,
387:               speed: 0.5,
388:             },
389:           },
390:         ],
391:       },
392:     ],
393:   },
394:   {
395:     slug: 'voronoi',
396:     name: 'Voronoi',
397:     description: 'Cell pattern',
398:     presets: [
399:       {
400:         name: 'Default',
401:         fidelity: 'approx',
402:         layers: [
403:           {
404:             layerType: 'voronoi',
405:             uniformValues: {
406:               scale: 6,
407:               speed: 0.4,
408:               randomness: 1,
409:               edgeWidth: 0.05,
410:               cellColor: [0.06, 0.07, 0.12],
411:               edgeColor: [0.4, 0.7, 1],
412:             },
413:           },
414:         ],
415:       },
416:     ],
417:   },
418:   {
419:     slug: 'perlin-noise',
420:     name: 'Perlin Noise',
421:     description: 'FBM Perlin between two colors',
422:     presets: [
423:       {
424:         name: 'Default',
425:         fidelity: 'approx',
426:         layers: [
427:           {
428:             layerType: 'perlin-noise',
429:             uniformValues: {
430:               color1: [0.04, 0.05, 0.12],
431:               color2: [0.7, 0.85, 1],
432:               scale: 3,
433:               octaves: 6,
434:               persistence: 0.55,
435:               lacunarity: 2.1,
436:               speed: 0.5,
437:             },
438:           },
439:         ],
440:       },
441:     ],
442:   },
443:   {
444:     slug: 'waves',
445:     name: 'Waves',
446:     description: 'Animated sine bands',
447:     presets: [
448:       {
449:         name: 'Default',
450:         fidelity: 'approx',
451:         layers: [
452:           {
453:             layerType: 'waves',
454:             uniformValues: {
455:               frequency: 10,
456:               amplitude: 0.1,
457:               speed: 2,
458:               direction: 0,
459:               color1: [0, 0.3, 0.5],
460:               color2: [0, 0.6, 0.8],
461:             },
462:           },
463:         ],
464:       },
465:     ],
466:   },
467:   {
468:     slug: 'god-rays',
469:     name: 'God Rays',
470:     description: 'Radial light rays',
471:     presets: [
472:       {
473:         name: 'Default',
474:         fidelity: 'approx',
475:         layers: [
476:           {
477:             layerType: 'god-rays',
478:             uniformValues: {
479:               color: [1, 0.9, 0.6],
480:               centerX: 0.5,
481:               centerY: 0.5,
482:               density: 30,
483:               intensity: 0.6,
484:               falloff: 1.5,
485:               speed: 0.2,
486:             },
487:           },
488:         ],
489:       },
490:     ],
491:   },
492:   {
493:     slug: 'dot-grid',
494:     name: 'Dot Grid',
495:     description: 'Regular lattice',
496:     presets: [
497:       {
498:         name: 'Default',
499:         fidelity: 'approx',
500:         layers: [
501:           {
502:             layerType: 'dot-grid',
503:             uniformValues: {
504:               color1: [0.05, 0.05, 0.08],
505:               color2: [0.95, 0.9, 0.7],
506:               scale: 30,
507:               dotSize: 0.18,
508:             },
509:           },
510:         ],
511:       },
512:     ],
513:   },
514:   {
515:     slug: 'static-radial-gradient',
516:     name: 'Static Radial',
517:     description: 'Three-stop radial',
518:     presets: [
519:       {
520:         name: 'Default',
521:         fidelity: 'approx',
522:         layers: [
523:           {
524:             layerType: 'radial-gradient-v2',
525:             uniformValues: {
526:               color1: [0.95, 0.85, 0.5],
527:               color2: [0.6, 0.3, 0.7],
528:               color3: [0.05, 0.05, 0.15],
529:               midPoint: 0.5,
530:               centerX: 0.5,
531:               centerY: 0.5,
532:               radius: 0.7,
533:               falloff: 1.2,
534:             },
535:           },
536:         ],
537:       },
538:     ],
539:   },
540:   {
541:     slug: 'grain-gradient',
542:     name: 'Grain Gradient',
543:     description: 'Mesh gradient + film grain (composed)',
544:     presets: [
545:       {
546:         name: 'Default',
547:         fidelity: 'exact',
548:         layers: [
549:           {
550:             layerType: 'paper-mesh-gradient',
551:             uniformValues: {
552:               color1: hex('#e0eaff').slice(0, 3),
553:               color2: hex('#241d9a').slice(0, 3),
554:               color3: hex('#f75092').slice(0, 3),
555:               color4: hex('#9f50d3').slice(0, 3),
556:               distortion: 0.6,
557:               swirl: 0.2,
558:               grainMixer: 0,
559:               grainOverlay: 0,
560:               speed: 0.3,
561:             },
562:           },
563:           {
564:             layerType: 'grain',
565:             uniformValues: { intensity: 0.18, speed: 1, colored: 0 },
566:             blendMode: 'overlay',
567:           },
568:         ],
569:       },
570:     ],
571:   },
572:   {
573:     slug: 'dithering',
574:     name: 'Dithering',
575:     description: 'Noise field through stepped ramp + Bayer dither (composed)',
576:     presets: [
577:       {
578:         name: 'Default',
579:         fidelity: 'exact',
580:         layers: [
581:           {
582:             layerType: 'paper-simplex-noise',
583:             uniformValues: {
584:               color1: [0.05, 0.05, 0.1],
585:               color2: [0.5, 0.5, 0.6],
586:               color3: [1, 1, 0.95],
587:               softness: 0.6,
588:               stepsPerColor: 1,
589:               speed: 0.5,
590:             },
591:           },
592:           {
593:             layerType: 'dither',
594:             uniformValues: {
595:               levels: 4,
596:               pixelSize: 2,
597:               colorDark: [0.05, 0.05, 0.1],
598:               colorLight: [1, 1, 0.95],
599:             },
600:           },
601:         ],
602:       },
603:     ],
604:   },
605:   {
606:     slug: 'pulsing-border',
607:     name: 'Pulsing Border',
608:     description: 'Coloured spots travelling around a rounded-rect perimeter',
609:     presets: [
610:       {
611:         name: 'Default',
612:         fidelity: 'exact',
613:         layers: [
614:           {
615:             layerType: 'pulsing-border',
616:             uniformValues: {
617:               colors: palette(hex('#0dc1fd'), hex('#d915ef'), hex('#ff3f2ecc')),
618:               colorBack: hex('#000000'),
619:               roundness: 0.25,
620:               thickness: 0.1,
621:               softness: 0.75,
622:               intensity: 0.2,
623:               bloom: 0.25,
624:               spots: 4,
625:               spotSize: 0.5,
626:               pulse: 0.25,
627:               smoke: 0.3,
628:               smokeSize: 0.6,
629:               marginLeft: 0,
630:               marginRight: 0,
631:               marginTop: 0,
632:               marginBottom: 0,
633:               speed: 1,
634:             },
635:           },
636:         ],
637:       },
638:       {
639:         name: 'Northern Lights',
640:         fidelity: 'exact',
641:         layers: [
642:           {
643:             layerType: 'pulsing-border',
644:             uniformValues: {
645:               colors: palette(
646:                 hex('#4c4794'),
647:                 hex('#774a7d'),
648:                 hex('#12694a'),
649:                 hex('#0aff78'),
650:                 hex('#4733cc'),
651:               ),
652:               colorBack: hex('#0c182c'),
653:               roundness: 0,
654:               thickness: 1,
655:               softness: 1,
656:               intensity: 0.1,
657:               bloom: 0.2,
658:               spots: 4,
659:               spotSize: 0.25,
660:               pulse: 0,
661:               smoke: 0.32,
662:               smokeSize: 0.5,
663:               marginLeft: 0,
664:               marginRight: 0,
665:               marginTop: 0,
666:               marginBottom: 0,
667:               speed: 0.18,
668:             },
669:           },
670:         ],
671:       },
672:       {
673:         name: 'Solid Line',
674:         fidelity: 'exact',
675:         layers: [
676:           {
677:             layerType: 'pulsing-border',
678:             uniformValues: {
679:               colors: palette(hex('#81ADEC')),
680:               colorBack: [0, 0, 0, 0],
681:               roundness: 0,
682:               thickness: 0.05,
683:               softness: 0.4,
684:               intensity: 0.4,
685:               bloom: 0.35,
686:               spots: 1,
687:               spotSize: 1,
688:               pulse: 0,
689:               smoke: 0,
690:               smokeSize: 0,
691:               marginLeft: 0,
692:               marginRight: 0,
693:               marginTop: 0,
694:               marginBottom: 0,
695:               speed: 1,
696:             },
697:           },
698:         ],
699:       },
700:     ],
701:   },
702:   // Image-driven presets (require user-supplied image to render anything) ----
703:   {
704:     slug: 'heatmap',
705:     name: 'Heatmap',
706:     description: 'Image luminance through a color ramp (composed)',
707:     presets: [
708:       {
709:         name: 'Default',
710:         fidelity: 'exact',
711:         layers: [
712:           {
713:             layerType: 'image-source',
714:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
715:           },
716:           {
717:             layerType: 'color-ramp',
718:             uniformValues: {
719:               colors: palette(
720:                 hex('#0a0033'),
721:                 hex('#0066ff'),
722:                 hex('#00ff99'),
723:                 hex('#ffff00'),
724:                 hex('#ff5500'),
725:                 hex('#ff0044'),
726:               ),
727:               channel: 0,
728:               steps: 0,
729:               domainMin: 0,
730:               domainMax: 1,
731:             },
732:           },
733:         ],
734:       },
735:     ],
736:   },
737:   {
738:     slug: 'image-dithering',
739:     name: 'Image Dithering',
740:     description: 'Image + Bayer dither (composed)',
741:     presets: [
742:       {
743:         name: 'Default',
744:         fidelity: 'exact',
745:         layers: [
746:           {
747:             layerType: 'image-source',
748:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
749:           },
750:           {
751:             layerType: 'dither',
752:             uniformValues: {
753:               levels: 4,
754:               pixelSize: 2,
755:               colorDark: [0, 0, 0],
756:               colorLight: [1, 1, 1],
757:             },
758:           },
759:         ],
760:       },
761:     ],
762:   },
763:   {
764:     slug: 'halftone-dots',
765:     name: 'Halftone Dots',
766:     description: 'Image + halftone screen (composed)',
767:     presets: [
768:       {
769:         name: 'Default',
770:         fidelity: 'exact',
771:         layers: [
772:           {
773:             layerType: 'image-source',
774:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
775:           },
776:           {
777:             layerType: 'halftone',
778:             uniformValues: {
779:               cells: 80,
780:               angle: 0.7853,
781:               softness: 0.05,
782:               colorBack: [1, 1, 1],
783:               colorDot: [0, 0, 0],
784:             },
785:           },
786:         ],
787:       },
788:     ],
789:   },
790:   {
791:     slug: 'liquid-metal',
792:     name: 'Liquid Metal',
793:     description: 'Image through chrome ramp + grain (composed; placeholder fidelity)',
794:     presets: [
795:       {
796:         name: 'Default',
797:         fidelity: 'placeholder',
798:         layers: [
799:           {
800:             layerType: 'image-source',
801:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
802:           },
803:           {
804:             layerType: 'color-ramp',
805:             uniformValues: {
806:               colors: palette(
807:                 hex('#0a0a10'),
808:                 hex('#3a3a4a'),
809:                 hex('#9a9aaa'),
810:                 hex('#f5f5ff'),
811:                 hex('#a0a0b0'),
812:                 hex('#1a1a20'),
813:               ),
814:               channel: 0,
815:               steps: 0,
816:               domainMin: 0,
817:               domainMax: 1,
818:             },
819:           },
820:           {
821:             layerType: 'grain',
822:             uniformValues: { intensity: 0.04, speed: 0.5, colored: 0 },
823:             blendMode: 'overlay',
824:           },
825:         ],
826:       },
827:     ],
828:   },
829:   {
830:     slug: 'paper-texture',
831:     name: 'Paper Texture',
832:     description: 'Image multiplied by paper grain (composed)',
833:     presets: [
834:       {
835:         name: 'Default',
836:         fidelity: 'approx',
837:         layers: [
838:           {
839:             layerType: 'image-source',
840:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
841:           },
842:           {
843:             layerType: 'paper',
844:             uniformValues: { amount: 0.5, scale: 200, fiberAngle: 0 },
845:           },
846:         ],
847:       },
848:     ],
849:   },
850:   {
851:     slug: 'water',
852:     name: 'Water',
853:     description: 'Image with water-ripple distortion (composed)',
854:     presets: [
855:       {
856:         name: 'Default',
857:         fidelity: 'exact',
858:         layers: [
859:           {
860:             layerType: 'image-source',
861:             uniformValues: { image: noImage, tint: [1, 1, 1, 1] },
862:           },
863:           {
864:             layerType: 'water-ripple',
865:             uniformValues: {
866:               amplitude: 0.02,
867:               frequency: 14,
868:               speed: 0.8,
869:               focalX: 0.5,
870:               focalY: 0.5,
871:               noiseAmount: 0.4,
872:               noiseScale: 5,
873:             },
874:           },
875:         ],
876:       },
877:     ],
878:   },
879: ]
880:
881: // Flat list for the existing preset picker UI -----------------------------
882:
883: export interface FlatPaperPreset {
884:   name: string
885:   description: string
886:   groupSlug: string
887:   fidelity: PaperFidelity
888:   layers: PaperLayerSpec[]
889: }
890:
891: export const PAPER_FLAT_PRESETS: FlatPaperPreset[] = PAPER_GROUPS.flatMap(
892:   (group) =>
893:     group.presets.map((p) => ({
894:       name: `${group.name}${p.name === 'Default' ? '' : ' · ' + p.name}`,
895:       description: group.description,
896:       groupSlug: group.slug,
897:       fidelity: p.fidelity,
898:       layers: p.layers,
899:     }))
900: )

(End of file - total 900 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts",
  "offset": 1,
  "limit": 220
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts</path>
<type>file</type>
<content>
1: import type { BlendMode, UniformValue } from './types'
2: import { PAPER_FLAT_PRESETS } from './paper-presets'
3:
4: // Built-in preset gallery. Each preset is a layer-stack recipe; the runtime
5: // generates fresh layer IDs on load so multiple instances don't collide.
6: //
7: // Most entries are **compositions of atomic primitives** that approximate
8: // Paper's looks — that's the editor's reason for being. A small number lean
9: // on monolithic Paper ports (paper-mesh-gradient, paper-neuro-noise, etc.)
10: // where the algorithm isn't reducible to simpler atoms today.
11: //
12: // `paper-presets.ts` is the source of truth for Paper-equivalent recipes
13: // and their fidelity tags (`exact` / `approx` / `placeholder`). The legacy
14: // PAPER_PRESETS export below is preserved for any UI still using the old
15: // shape; new code should consume PAPER_GROUPS / PAPER_FLAT_PRESETS instead.
16:
17: export interface PresetLayer {
18:   layerType: string
19:   uniformValues: Record<string, UniformValue>
20:   blendMode?: BlendMode
21:   opacity?: number
22: }
23:
24: export interface Preset {
25:   name: string
26:   description: string
27:   layers: PresetLayer[]
28: }
29:
30: export { PAPER_GROUPS, PAPER_FLAT_PRESETS } from './paper-presets'
31: export type { PaperGroup, PaperPreset, PaperFidelity } from './paper-presets'
32:
33: // New canonical preset list, derived from paper-presets.ts. Mapped to the
34: // legacy `Preset` shape so the existing layer-stack picker UI works unchanged.
35: export const PAPER_PRESETS: Preset[] = PAPER_FLAT_PRESETS.map((p) => ({
36:   name: p.name,
37:   description: `[${p.fidelity}] ${p.description}`,
38:   layers: p.layers,
39: }))
40:
41: // Older hand-curated entries — kept as `LEGACY_PAPER_PRESETS` in case any
42: // downstream still references them. Will be removed once the new gallery
43: // lands in the UI.
44: export const LEGACY_PAPER_PRESETS: Preset[] = [
45:   {
46:     name: 'Mesh Gradient',
47:     description: 'Animated 4-spot mesh gradient (Paper port)',
48:     layers: [
49:       {
50:         layerType: 'paper-mesh-gradient',
51:         uniformValues: {
52:           color1: [0.95, 0.4, 0.6],
53:           color2: [0.4, 0.7, 0.95],
54:           color3: [0.95, 0.85, 0.4],
55:           color4: [0.6, 0.4, 0.9],
56:           distortion: 0.8,
57:           swirl: 0.1,
58:           grainMixer: 0,
59:           grainOverlay: 0,
60:           speed: 0.5,
61:         },
62:       },
63:     ],
64:   },
65:   {
66:     name: 'Static Mesh Gradient',
67:     description: 'Still mesh gradient (Paper port)',
68:     layers: [
69:       {
70:         layerType: 'paper-mesh-gradient',
71:         uniformValues: {
72:           color1: [0.95, 0.4, 0.6],
73:           color2: [0.4, 0.7, 0.95],
74:           color3: [0.95, 0.85, 0.4],
75:           color4: [0.6, 0.4, 0.9],
76:           distortion: 0.6,
77:           swirl: 0.3,
78:           grainMixer: 0,
79:           grainOverlay: 0,
80:           speed: 0,
81:         },
82:       },
83:     ],
84:   },
85:   {
86:     name: 'Neuro Noise',
87:     description: 'Synaptic glow web (Paper port)',
88:     layers: [
89:       {
90:         layerType: 'paper-neuro-noise',
91:         uniformValues: {
92:           colorBack: [0.0, 0.0, 0.0],
93:           colorMid: [0.28, 0.65, 1.0],
94:           colorFront: [1.0, 1.0, 1.0],
95:           brightness: 0.05,
96:           contrast: 0.3,
97:           speed: 1.0,
98:         },
99:       },
100:     ],
101:   },
102:   {
103:     name: 'Swirl',
104:     description: 'Twisting color bands (Paper port)',
105:     layers: [
106:       {
107:         layerType: 'paper-swirl',
108:         uniformValues: {
109:           colorBack: [0.02, 0.02, 0.05],
110:           color1: [1.0, 0.9, 0.4],
111:           color2: [0.95, 0.3, 0.5],
112:           color3: [0.3, 0.5, 1.0],
113:           bandCount: 4,
114:           twist: 0.4,
115:           centerSize: 0.3,
116:           proportion: 0.5,
117:           softness: 0,
118:           noiseAmount: 0,
119:           noiseFrequency: 0.5,
120:           speed: 0.4,
121:         },
122:       },
123:     ],
124:   },
125:   {
126:     name: 'Spiral',
127:     description: 'Animated logarithmic spiral (Paper port)',
128:     layers: [
129:       {
130:         layerType: 'paper-spiral',
131:         uniformValues: {
132:           colorBack: [0.05, 0.05, 0.08],
133:           colorFront: [0.95, 0.85, 0.4],
134:           density: 0.5,
135:           distortion: 0,
136:           strokeWidth: 0.5,
137:           strokeTaper: 0,
138:           strokeCap: 0,
139:           noiseAmount: 0,
140:           noiseFrequency: 0.5,
141:           softness: 0,
142:           speed: 0.5,
143:         },
144:       },
145:     ],
146:   },
147:   {
148:     name: 'Voronoi',
149:     description: 'Cell-edge voronoi pattern (our procedural port)',
150:     layers: [
151:       {
152:         layerType: 'voronoi',
153:         uniformValues: {
154:           scale: 6,
155:           speed: 0.4,
156:           randomness: 1,
157:           edgeWidth: 0.05,
158:           cellColor: [0.06, 0.07, 0.12],
159:           edgeColor: [0.4, 0.7, 1.0],
160:         },
161:       },
162:     ],
163:   },
164:   {
165:     name: 'Simplex Noise',
166:     description: 'Two-sample simplex through 3-color ramp (Paper port)',
167:     layers: [
168:       {
169:         layerType: 'paper-simplex-noise',
170:         uniformValues: {
171:           color1: [0.0, 0.0, 0.05],
172:           color2: [0.4, 0.6, 1.0],
173:           color3: [1.0, 0.95, 0.85],
174:           softness: 1,
175:           stepsPerColor: 1,
176:           speed: 1,
177:         },
178:       },
179:     ],
180:   },
181:   {
182:     name: 'Perlin Noise',
183:     description: 'FBM Perlin between two colors',
184:     layers: [
185:       {
186:         layerType: 'perlin-noise',
187:         uniformValues: {
188:           color1: [0.04, 0.05, 0.12],
189:           color2: [0.7, 0.85, 1.0],
190:           scale: 3,
191:           octaves: 6,
192:           persistence: 0.55,
193:           lacunarity: 2.1,
194:           speed: 0.5,
195:         },
196:       },
197:     ],
198:   },
199:   {
200:     name: 'God Rays',
201:     description: 'Radial light rays from a focal point',
202:     layers: [
203:       {
204:         layerType: 'god-rays',
205:         uniformValues: {
206:           color: [1.0, 0.9, 0.6],
207:           centerX: 0.5,
208:           centerY: 0.5,
209:           density: 30,
210:           intensity: 0.6,
211:           falloff: 1.5,
212:           speed: 0.2,
213:         },
214:       },
215:     ],
216:   },
217:   {
218:     name: 'Dot Grid',
219:     description: 'Regular dot lattice',
220:     layers: [

(Showing lines 1-220 of 320. Use offset=221 to continue.)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts",
  "offset": 1,
  "limit": 260
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts</path>
<type>file</type>
<content>
1: // Faithful ports of paper-design/shaders procedural primitives. Source:
2: //   https://github.com/paper-design/shaders/tree/main/packages/shaders/src/shaders
3: // (PolyForm Shield 1.0). The fragment-shader bodies below mirror Paper's GLSL
4: // algorithm-for-algorithm; only minor adaptations:
5: //   * v_objectUV / v_patternUV → our centered, aspect-corrected `p`
6: //   * vec4 color arrays with maxColorCount=10 → fixed-N vec3 unrolls (our
7: //     uniform system has no array support yet); alpha is folded into the
8: //     RGB premultiply path
9: //   * `texture(u_noiseTexture, x)` lookups → procedural `hash21(x)` (Paper's
10: //     own pre-computed noise texture is itself produced from hash21, so the
11: //     visual difference is negligible at typical scales)
12:
13: import type { LayerDefinition } from '../types'
14: import { gen } from './_helpers'
15:
16: const SCREEN_OBJECT_UV = `vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
17: vec2 p = (uv - 0.5) * _ar;`
18:
19: // ──────────────────────────────────────────────────────────────────────────
20: // Mesh Gradient — IDW of N moving color spots over a swirled, distorted UV,
21: // post-mixed with a B/W grain overlay. Direct port of Paper's mesh-gradient.ts.
22: export const paperMeshGradientLayer = gen({
23:   id: 'paper-mesh-gradient',
24:   name: 'Mesh Gradient',
25:   description: 'Paper Shaders mesh-gradient — 4 color spots, distortion, swirl, grain (faithful port)',
26:   color: '#fb7185',
27:   uniforms: [
28:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.95, 0.4, 0.6], ui: { color: true } },
29:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.4, 0.7, 0.95], ui: { color: true } },
30:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.95, 0.85, 0.4], ui: { color: true } },
31:     { name: 'color4', label: 'Color 4', type: 'vec3', default: [0.6, 0.4, 0.9], ui: { color: true } },
32:     { name: 'distortion', label: 'Distortion', type: 'float', default: 0.8, ui: { min: 0, max: 1, step: 0.01 } },
33:     { name: 'swirl', label: 'Swirl', type: 'float', default: 0.1, ui: { min: 0, max: 1, step: 0.01 } },
34:     { name: 'grainMixer', label: 'Grain Mixer', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
35:     { name: 'grainOverlay', label: 'Grain Overlay', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
36:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
37:   ],
38:   glsl: {
39:     dependencies: ['rotate2D', 'hash21'],
40:     functions: `
41: float valueNoise(vec2 st) {
42:   vec2 i = floor(st);
43:   vec2 f = fract(st);
44:   float a = hash21(i);
45:   float b = hash21(i + vec2(1.0, 0.0));
46:   float c = hash21(i + vec2(0.0, 1.0));
47:   float d = hash21(i + vec2(1.0, 1.0));
48:   vec2 u = f * f * (3.0 - 2.0 * f);
49:   float x1 = mix(a, b, u.x);
50:   float x2 = mix(c, d, u.x);
51:   return mix(x1, x2, u.y);
52: }
53: vec2 mgGetPosition(int i, float t) {
54:   float a = float(i) * 0.37;
55:   float b = 0.6 + fract(float(i) / 3.0) * 0.9;
56:   float c = 0.8 + fract(float(i + 1) / 4.0);
57:   float x = sin(t * b + a);
58:   float y = cos(t * c + a * 1.5);
59:   return 0.5 + 0.5 * vec2(x, y);
60: }`,
61:     main: `
62: ${SCREEN_OBJECT_UV}
63: vec2 muv = p + 0.5;
64: vec2 grainUV = muv * 1000.0;
65: float grain = valueNoise(grainUV);
66: float mixerGrain = 0.4 * {{grainMixer}} * (grain - 0.5);
67: const float firstFrameOffset = 41.5;
68: float t = 0.5 * (u_time * {{speed}} * 2.0 + firstFrameOffset);
69: float radius = smoothstep(0.0, 1.0, length(muv - 0.5));
70: float center = 1.0 - radius;
71: for (float i = 1.0; i <= 2.0; i++) {
72:   muv.x += {{distortion}} * center / i * sin(t + i * 0.4 * smoothstep(0.0, 1.0, muv.y)) * cos(0.2 * t + i * 2.4 * smoothstep(0.0, 1.0, muv.y));
73:   muv.y += {{distortion}} * center / i * cos(t + i * 2.0 * smoothstep(0.0, 1.0, muv.x));
74: }
75: vec2 uvRotated = muv - vec2(0.5);
76: float angle = 3.0 * {{swirl}} * radius;
77: uvRotated = rotate2D(uvRotated, -angle);
78: uvRotated += vec2(0.5);
79: vec3 cols[4];
80: cols[0] = {{color1}};
81: cols[1] = {{color2}};
82: cols[2] = {{color3}};
83: cols[3] = {{color4}};
84: vec3 color = vec3(0.0);
85: float totalWeight = 0.0;
86: for (int i = 0; i < 4; i++) {
87:   vec2 pos = mgGetPosition(i, t) + mixerGrain;
88:   float dist = pow(length(uvRotated - pos), 3.5);
89:   float weight = 1.0 / (dist + 1e-3);
90:   color += cols[i] * weight;
91:   totalWeight += weight;
92: }
93: color /= max(1e-4, totalWeight);
94: float grainOverlay = valueNoise(rotate2D(grainUV, 1.0) + vec2(3.0));
95: grainOverlay = mix(grainOverlay, valueNoise(rotate2D(grainUV, 2.0) + vec2(-1.0)), 0.5);
96: grainOverlay = pow(grainOverlay, 1.3);
97: float grainOverlayV = grainOverlay * 2.0 - 1.0;
98: vec3 grainOverlayColor = vec3(step(0.0, grainOverlayV));
99: float grainOverlayStrength = pow({{grainOverlay}} * abs(grainOverlayV), 0.8);
100: color = mix(color, grainOverlayColor, 0.35 * grainOverlayStrength);
101: return vec4(color, 1.0);`,
102:   },
103: })
104:
105: // ──────────────────────────────────────────────────────────────────────────
106: // Neuro Noise — 15-iter rotate-and-grow trig-fold accumulator.
107: // Direct port of Paper's neuro-noise.ts.
108: export const paperNeuroNoiseLayer = gen({
109:   id: 'paper-neuro-noise',
110:   name: 'Neuro Noise',
111:   description: 'Paper Shaders neuro-noise — synaptic web-like glow (faithful port)',
112:   color: '#22d3ee',
113:   uniforms: [
114:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.02, 0.05], ui: { color: true } },
115:     { name: 'colorMid', label: 'Mid', type: 'vec3', default: [0.1, 0.3, 0.9], ui: { color: true } },
116:     { name: 'colorFront', label: 'Front', type: 'vec3', default: [0.95, 1.0, 0.95], ui: { color: true } },
117:     { name: 'brightness', label: 'Brightness', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
118:     { name: 'contrast', label: 'Contrast', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },
119:     { name: 'speed', label: 'Speed', type: 'float', default: 0.3, ui: { min: 0, max: 4, step: 0.05 } },
120:   ],
121:   glsl: {
122:     dependencies: ['rotate2D'],
123:     functions: `
124: float neuroShape(vec2 nuv, float nt) {
125:   vec2 sine_acc = vec2(0.0);
126:   vec2 res = vec2(0.0);
127:   float scale = 8.0;
128:   for (int j = 0; j < 15; j++) {
129:     nuv = rotate2D(nuv, 1.0);
130:     sine_acc = rotate2D(sine_acc, 1.0);
131:     vec2 layer = nuv * scale + float(j) + sine_acc - nt;
132:     sine_acc += sin(layer);
133:     res += (0.5 + 0.5 * cos(layer)) / scale;
134:     scale *= 1.2;
135:   }
136:   return res.x + res.y;
137: }`,
138:     main: `
139: ${SCREEN_OBJECT_UV}
140: // Paper's v_patternUV is roughly canvas pixels; their shader does
141: // shape_uv *= 0.13 yielding ~13/100px. Our centered p is ~[-0.5, 0.5],
142: // so we scale up 100× to land in the same regime.
143: vec2 shape_uv = p * 13.0;
144: float t = 0.5 * u_time * {{speed}};
145: float n = neuroShape(shape_uv, t);
146: n = (1.0 + {{brightness}}) * n * n;
147: n = pow(n, 0.7 + 6.0 * {{contrast}});
148: n = min(1.4, n);
149: float blend = smoothstep(0.7, 1.4, n);
150: vec3 mid = {{colorMid}};
151: vec3 front = {{colorFront}};
152: vec3 blendFront = mix(mid, front, blend);
153: float safeNoise = max(n, 0.0);
154: vec3 color = blendFront * safeNoise;
155: float opacity = clamp(safeNoise, 0.0, 1.0);
156: color = color + {{colorBack}} * (1.0 - opacity);
157: return vec4(color, 1.0);`,
158:   },
159: })
160:
161: // ──────────────────────────────────────────────────────────────────────────
162: // Swirl — angle×bandCount pattern with vortex twist; direct port of swirl.ts.
163: export const paperSwirlLayer = gen({
164:   id: 'paper-swirl',
165:   name: 'Swirl',
166:   description: 'Paper Shaders swirl — twisting color bands (faithful port)',
167:   color: '#a78bfa',
168:   uniforms: [
169:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.02, 0.05], ui: { color: true } },
170:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [1.0, 0.9, 0.4], ui: { color: true } },
171:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.95, 0.3, 0.5], ui: { color: true } },
172:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.3, 0.5, 1.0], ui: { color: true } },
173:     { name: 'bandCount', label: 'Bands', type: 'float', default: 4, ui: { min: 0, max: 15, step: 1 } },
174:     { name: 'twist', label: 'Twist', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },
175:     { name: 'centerSize', label: 'Center', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
176:     { name: 'proportion', label: 'Proportion', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
177:     { name: 'softness', label: 'Softness', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
178:     { name: 'noiseAmount', label: 'Noise', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
179:     { name: 'noiseFrequency', label: 'Noise Freq', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
180:     { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },
181:   ],
182:   glsl: {
183:     dependencies: ['snoise'],
184:     functions: `
185: #ifndef TWO_PI
186: #define TWO_PI 6.28318530718
187: #endif`,
188:     main: `
189: ${SCREEN_OBJECT_UV}
190: vec2 shape_uv = p;
191: float l = max(1e-4, length(shape_uv));
192: float t = u_time * {{speed}};
193: float angle = ceil({{bandCount}}) * atan(shape_uv.y, shape_uv.x) + t;
194: float angle_norm = angle / TWO_PI;
195: float twist = 3.0 * clamp({{twist}}, 0.0, 1.0);
196: float offset = pow(l, -twist) + angle_norm;
197: float shape = fract(offset);
198: shape = 1.0 - abs(2.0 * shape - 1.0);
199: shape += {{noiseAmount}} * snoise(15.0 * pow({{noiseFrequency}}, 2.0) * shape_uv);
200: float mid = smoothstep(0.2, 0.2 + 0.8 * {{centerSize}}, pow(l, twist));
201: shape = mix(0.0, shape, mid);
202: float proportion = clamp({{proportion}}, 0.0, 1.0);
203: float exponent = mix(0.25, 1.0, proportion * 2.0);
204: exponent = mix(exponent, 10.0, max(0.0, proportion * 2.0 - 1.0));
205: shape = pow(shape, exponent);
206: float mixer = shape * 3.0;
207: vec3 cols[3];
208: cols[0] = {{color1}};
209: cols[1] = {{color2}};
210: cols[2] = {{color3}};
211: vec3 gradient = cols[0];
212: float outerShape = 0.0;
213: for (int i = 1; i < 4; i++) {
214:   if (i > 3) break;
215:   float m = clamp(mixer - float(i - 1), 0.0, 1.0);
216:   float aa = fwidth(m);
217:   m = smoothstep(0.5 - 0.5 * {{softness}} - aa, 0.5 + 0.5 * {{softness}} + aa, m);
218:   if (i == 1) outerShape = m;
219:   vec3 c = i < 3 ? cols[i] : cols[2];
220:   gradient = mix(gradient, c, m);
221: }
222: float midAA = 0.1 * fwidth(pow(l, -twist));
223: float outerMid = smoothstep(0.2, 0.2 + midAA, pow(l, twist));
224: outerShape = mix(0.0, outerShape, outerMid);
225: vec3 color = gradient * outerShape + {{colorBack}} * (1.0 - outerShape);
226: return vec4(color, 1.0);`,
227:   },
228: })
229:
230: // ──────────────────────────────────────────────────────────────────────────
231: // Spiral — animated logarithmic spiral with stroke, distortion, noise.
232: // Direct port of spiral.ts.
233: export const paperSpiralLayer = gen({
234:   id: 'paper-spiral',
235:   name: 'Spiral',
236:   description: 'Paper Shaders spiral — animated logarithmic spiral (faithful port)',
237:   color: '#a855f7',
238:   uniforms: [
239:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.02, 0.05], ui: { color: true } },
240:     { name: 'colorFront', label: 'Foreground', type: 'vec3', default: [0.95, 0.85, 0.4], ui: { color: true } },
241:     { name: 'density', label: 'Density', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
242:     { name: 'distortion', label: 'Distortion', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
243:     { name: 'strokeWidth', label: 'Stroke Width', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
244:     { name: 'strokeTaper', label: 'Stroke Taper', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
245:     { name: 'strokeCap', label: 'Stroke Cap', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
246:     { name: 'noiseAmount', label: 'Noise', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
247:     { name: 'noiseFrequency', label: 'Noise Freq', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
248:     { name: 'softness', label: 'Softness', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
249:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
250:   ],
251:   glsl: {
252:     dependencies: ['snoise'],
253:     functions: `
254: #ifndef TWO_PI
255: #define TWO_PI 6.28318530718
256: #endif
257: #ifndef PI
258: #define PI 3.14159265358979323846
259: #endif`,
260:     main: `

(Showing lines 1-260 of 447. Use offset=261 to continue.)
</content>
```

---

## Assistant (Plan · GPT-5.5 · 4.7s)

The local project already contains a Paper preset source of truth and several direct Paper shader ports, though several entries are still marked `approx` or `placeholder`. I am now comparing that against the upstream package surface so the plan can target exact parity rather than cosmetic resemblance.

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts",
  "offset": 261,
  "limit": 260
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts</path>
<type>file</type>
<content>
261: ${SCREEN_OBJECT_UV}
262: vec2 spUv = 2.0 * p;
263: float t = u_time * {{speed}};
264: float l = length(spUv);
265: float density = clamp({{density}}, 0.0, 1.0);
266: l = pow(max(l, 1e-6), density);
267: float angle = atan(spUv.y, spUv.x) - t;
268: float angleNormalised = angle / TWO_PI;
269: angleNormalised += 0.125 * {{noiseAmount}} * snoise(16.0 * pow({{noiseFrequency}}, 3.0) * spUv);
270: float offset = l + angleNormalised;
271: offset -= {{distortion}} * (sin(4.0 * l - 0.5 * t) * cos(PI + l + 0.5 * t));
272: float stripe = fract(offset);
273: float shape = 2.0 * abs(stripe - 0.5);
274: float width = 1.0 - clamp({{strokeWidth}}, 0.005 * {{strokeTaper}}, 1.0);
275: float wCap = mix(width, (1.0 - stripe) * (1.0 - step(0.5, stripe)), (1.0 - clamp(l, 0.0, 1.0)));
276: width = mix(width, wCap, {{strokeCap}});
277: width *= (1.0 - clamp({{strokeTaper}}, 0.0, 1.0) * l);
278: float fw = fwidth(offset);
279: float fwMult = 4.0 - 3.0 * (smoothstep(0.05, 0.4, 2.0 * {{strokeWidth}}) * smoothstep(0.05, 0.4, 2.0 * (1.0 - {{strokeWidth}})));
280: float pixelSize = mix(fwMult * fw, fwidth(shape), clamp(fw, 0.0, 1.0));
281: pixelSize = mix(pixelSize, 0.002, {{strokeCap}} * (1.0 - clamp(l, 0.0, 1.0)));
282: float res = smoothstep(width - pixelSize - {{softness}}, width + pixelSize + {{softness}}, shape);
283: vec3 color = mix({{colorBack}}, {{colorFront}}, res);
284: return vec4(color, 1.0);`,
285:   },
286: })
287:
288: // ──────────────────────────────────────────────────────────────────────────
289: // Voronoi (Paper) — IQ two-pass voronoi with cell colors, gap, glow.
290: // Direct port of voronoi.ts. Uses hash21 in place of u_noiseTexture lookup.
291: export const paperVoronoiLayer = gen({
292:   id: 'paper-voronoi',
293:   name: 'Voronoi',
294:   description: 'Paper Shaders voronoi — IQ two-pass with cell colors, gap, glow (faithful port)',
295:   color: '#06b6d4',
296:   uniforms: [
297:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.4, 0.7, 1.0], ui: { color: true } },
298:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.95, 0.5, 0.7], ui: { color: true } },
299:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.3, 0.95, 0.7], ui: { color: true } },
300:     { name: 'colorGap', label: 'Gap', type: 'vec3', default: [0.05, 0.05, 0.08], ui: { color: true } },
301:     { name: 'colorGlow', label: 'Glow', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
302:     { name: 'scale', label: 'Scale', type: 'float', default: 5, ui: { min: 0.5, max: 20, step: 0.1 } },
303:     { name: 'distortion', label: 'Distortion', type: 'float', default: 0.25, ui: { min: 0, max: 0.5, step: 0.005 } },
304:     { name: 'gap', label: 'Gap', type: 'float', default: 0.01, ui: { min: 0, max: 0.1, step: 0.001 } },
305:     { name: 'glow', label: 'Glow Amount', type: 'float', default: 0.2, ui: { min: 0, max: 1, step: 0.01 } },
306:     { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },
307:   ],
308:   glsl: {
309:     dependencies: ['hash22'],
310:     functions: `
311: #ifndef TWO_PI
312: #define TWO_PI 6.28318530718
313: #endif
314: vec2 randomGB(vec2 p) {
315:   return hash22(floor(p));
316: }
317: vec4 paperVoronoi(vec2 x, float t, float distortion) {
318:   vec2 ip = floor(x);
319:   vec2 fp = fract(x);
320:   vec2 mg, mr;
321:   float md = 8.0;
322:   float rand = 0.0;
323:   for (int j = -1; j <= 1; j++) {
324:     for (int i = -1; i <= 1; i++) {
325:       vec2 g = vec2(float(i), float(j));
326:       vec2 oRaw = randomGB(ip + g);
327:       vec2 o = 0.5 + distortion * sin(t + TWO_PI * oRaw);
328:       vec2 r = g + o - fp;
329:       float d = dot(r, r);
330:       if (d < md) { md = d; mr = r; mg = g; rand = oRaw.x; }
331:     }
332:   }
333:   md = 8.0;
334:   for (int j = -2; j <= 2; j++) {
335:     for (int i = -2; i <= 2; i++) {
336:       vec2 g = mg + vec2(float(i), float(j));
337:       vec2 oRaw = randomGB(ip + g);
338:       vec2 o = 0.5 + distortion * sin(t + TWO_PI * oRaw);
339:       vec2 r = g + o - fp;
340:       if (dot(mr - r, mr - r) > 1e-5) {
341:         md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
342:       }
343:     }
344:   }
345:   return vec4(md, mr, rand);
346: }`,
347:     main: `
348: ${SCREEN_OBJECT_UV}
349: vec2 shape_uv = p * {{scale}};
350: float t = u_time * {{speed}};
351: vec4 vRes = paperVoronoi(shape_uv, t, {{distortion}});
352: float shape = clamp(vRes.w, 0.0, 1.0);
353: float mixer = (shape - 0.5 / 3.0) * 3.0;
354: vec3 cols[3];
355: cols[0] = {{color1}};
356: cols[1] = {{color2}};
357: cols[2] = {{color3}};
358: vec3 cellColor = cols[0];
359: for (int i = 1; i < 3; i++) {
360:   float lt = clamp(mixer - float(i - 1), 0.0, 1.0);
361:   cellColor = mix(cellColor, cols[i], lt);
362: }
363: if (mixer < 0.0 || mixer > 2.0) {
364:   float lt = mixer + 1.0;
365:   if (mixer > 2.0) lt = mixer - 2.0;
366:   cellColor = mix(cols[2], cols[0], lt);
367: }
368: float glows = pow(length(vRes.yz * {{glow}}), 1.5);
369: vec3 color = mix(cellColor, {{colorGlow}}, glows);
370: float edge = vRes.x;
371: float smoothEdge = 0.02 * (1.0 + 0.5 * {{gap}});
372: edge = smoothstep({{gap}} - smoothEdge, {{gap}} + smoothEdge, edge);
373: color = mix({{colorGap}}, color, edge);
374: return vec4(color, 1.0);`,
375:   },
376: })
377:
378: // ──────────────────────────────────────────────────────────────────────────
379: // Simplex Noise (Paper) — two-sample sum mapped through a stepped color ramp.
380: // Distinct from our existing FBM-based `simplex-noise` primitive: this is
381: // Paper's exact algorithm.
382: export const paperSimplexNoiseLayer = gen({
383:   id: 'paper-simplex-noise',
384:   name: 'Simplex Noise',
385:   description: 'Paper Shaders simplex-noise — two-sample sum to ramp (faithful port)',
386:   color: '#8b5cf6',
387:   uniforms: [
388:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.0, 0.0, 0.05], ui: { color: true } },
389:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.4, 0.6, 1.0], ui: { color: true } },
390:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [1.0, 0.95, 0.85], ui: { color: true } },
391:     { name: 'softness', label: 'Softness', type: 'float', default: 1.0, ui: { min: 0, max: 1, step: 0.01 } },
392:     { name: 'stepsPerColor', label: 'Steps', type: 'float', default: 1, ui: { min: 1, max: 10, step: 1 } },
393:     { name: 'speed', label: 'Speed', type: 'float', default: 1, ui: { min: 0, max: 4, step: 0.05 } },
394:   ],
395:   glsl: {
396:     dependencies: ['snoise'],
397:     functions: `
398: float steppedSmooth(float m, float steps, float softness) {
399:   float stepT = floor(m * steps) / steps;
400:   float f = m * steps - floor(m * steps);
401:   float fw = steps * fwidth(m);
402:   float smoothed = smoothstep(0.5 - softness, min(1.0, 0.5 + softness + fw), f);
403:   return stepT + smoothed / steps;
404: }`,
405:     main: `
406: ${SCREEN_OBJECT_UV}
407: vec2 shape_uv = p * 0.1 * 10.0;
408: float t = 0.2 * u_time * {{speed}};
409: float n = 0.5 * snoise(shape_uv - vec2(0.0, 0.3 * t));
410: n += 0.5 * snoise(2.0 * shape_uv + vec2(0.0, 0.32 * t));
411: float shape = 0.5 + 0.5 * n;
412: float mixer = (shape - 0.5 / 3.0) * 3.0;
413: float steps = max(1.0, {{stepsPerColor}});
414: vec3 cols[3];
415: cols[0] = {{color1}};
416: cols[1] = {{color2}};
417: cols[2] = {{color3}};
418: vec3 gradient = cols[0];
419: for (int i = 1; i < 3; i++) {
420:   float localM = clamp(mixer - float(i - 1), 0.0, 1.0);
421:   localM = steppedSmooth(localM, steps, 0.5 * {{softness}});
422:   gradient = mix(gradient, cols[i], localM);
423: }
424: if (mixer < 0.0 || mixer > 2.0) {
425:   float localM = mixer + 1.0;
426:   if (mixer > 2.0) localM = mixer - 2.0;
427:   localM = steppedSmooth(localM, steps, 0.5 * {{softness}});
428:   gradient = mix(cols[2], cols[0], localM);
429: }
430: return vec4(gradient, 1.0);`,
431:   },
432: })
433:
434: // paper-voronoi is intentionally NOT exported. The IQ two-pass voronoi
435: // algorithm depends on a well-distributed pre-baked noise texture (Paper
436: // uses a 100×100 RGB lookup); our procedural hash22 substitute clusters
437: // cell centers tightly enough that the perpendicular-bisector distance
438: // (md) collapses to ~0 across the canvas, producing only a sparse-glow
439: // artifact. Re-enable once a noise-texture binding lands.
440:
441: export const PAPER_SHADER_LAYERS: Record<string, LayerDefinition> = {
442:   'paper-mesh-gradient': paperMeshGradientLayer,
443:   'paper-neuro-noise': paperNeuroNoiseLayer,
444:   'paper-swirl': paperSwirlLayer,
445:   'paper-spiral': paperSpiralLayer,
446:   'paper-simplex-noise': paperSimplexNoiseLayer,
447: }

(End of file - total 447 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/types.ts",
  "offset": 1,
  "limit": 260
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/types.ts</path>
<type>file</type>
<content>
1: // Core types for the shader composition system
2:
3: export type UniformType =
4:   | 'float'
5:   | 'vec2'
6:   | 'vec3'
7:   | 'vec4'
8:   | 'int'
9:   | 'bool'
10:   // Texture sampler. Backed at runtime by an HTMLImageElement uploaded to a
11:   // WebGLTexture. Generator emits three companion uniforms per sampler:
12:   //   uniform sampler2D NAME;
13:   //   uniform vec4      NAME_meta;    // (imgAspect, fitMode, scale, rotation)
14:   //   uniform vec2      NAME_offset;  // UV-space offset
15:   | 'sampler2D'
16:   // Variable-length vec4 array (e.g. color palettes). Generator emits:
17:   //   uniform vec4 NAME[arrayLength];
18:   //   uniform int  NAME_count;        // active entries; rest are zero-padded
19:   | 'vec4Array'
20:
21: export type ImageFit = 'cover' | 'contain' | 'fill'
22:
23: export interface ImageUniformValue {
24:   // null = bind a 1×1 transparent placeholder texture; layers should treat
25:   // this as "no image".
26:   url: string | null
27:   // 'asset' is reserved for bundled sample images shipped with the editor.
28:   sourceKind: 'url' | 'dataUrl' | 'asset'
29:   // Optional aspect ratio of the underlying image. Populated by the loader
30:   // once the image dimensions are known; consumers should not rely on it
31:   // being set before first paint.
32:   aspect?: number
33:   fit?: ImageFit
34:   offsetX?: number
35:   offsetY?: number
36:   scale?: number
37:   rotation?: number
38: }
39:
40: export interface Vec4ArrayValue {
41:   // Each entry is [r, g, b, a] in 0..1. `length` may be < values.length;
42:   // entries past `length` are ignored at the shader level via the _count
43:   // companion uniform.
44:   values: number[][]
45:   length: number
46: }
47:
48: export type UniformValue =
49:   | number
50:   | number[]
51:   | boolean
52:   | ImageUniformValue
53:   | Vec4ArrayValue
54:
55: export interface UniformDefinition {
56:   name: string
57:   label: string
58:   type: UniformType
59:   default: UniformValue
60:   // Required for type === 'vec4Array'. Sets the static GLSL upper bound;
61:   // values past this are silently truncated.
62:   arrayLength?: number
63:   ui?: {
64:     min?: number
65:     max?: number
66:     step?: number
67:     color?: boolean // for vec3/vec4 color pickers
68:     image?: { defaultUrl?: string; allowUpload?: boolean }
69:     array?: { minLength?: number; maxLength?: number }
70:   }
71: }
72:
73: export interface LayerDefinition {
74:   id: string
75:   name: string
76:   description: string
77:   color: string
78:   category: 'generator' | 'modifier' | 'blend' | 'effect' | 'distorter'
79:   defaultBlendMode: BlendMode
80:   uniforms: UniformDefinition[]
81:   // When true, this layer reads the previously-rendered pass via the
82:   // implicit `sampler2D u_prevPass` uniform. Triggers a render-target
83:   // split: layers above this one render into an FBO, then this layer
84:   // (and any layers after it, until the next consumer) read from it.
85:   consumesPrevPass?: boolean
86:   // Advisory only — UI uses this to render scalar previews monochrome
87:   // and to hint that a downstream `color-ramp`-style consumer is expected.
88:   outputKind?: 'color' | 'scalar'
89:   glsl: {
90:     // Shared utility functions (will be deduped across layers)
91:     dependencies?: string[]
92:     // Layer-specific functions
93:     functions?: string
94:     // Main contribution - receives `vec2 uv` and returns `vec4 color`
95:     // Can reference previous layer as `vec4 base`.
96:     // When `consumesPrevPass` is true, may also call `texture(u_prevPass, uv)`.
97:     main: string
98:   }
99: }
100:
101: export interface LayerInstance {
102:   id: string
103:   layerType: string
104:   enabled: boolean
105:   uniformValues: Record<string, UniformValue>
106:   blendMode: BlendMode
107:   opacity: number
108: }
109:
110: export type BlendMode =
111:   | 'normal'
112:   | 'add'
113:   | 'multiply'
114:   | 'screen'
115:   | 'overlay'
116:   | 'softLight'
117:   | 'hardLight'
118:
119: export interface ShaderComposition {
120:   name: string
121:   layers: LayerInstance[]
122:   resolution?: [number, number]
123: }
124:
125: export interface GeneratedPass {
126:   // Complete fragment shader source for this pass
127:   fragmentShader: string
128:   // Whether this pass reads `u_prevPass` (sampler2D bound to the prior pass output)
129:   readsPrevPass: boolean
130:   // IDs of the layer instances that contribute to this pass (in order)
131:   layerIds: string[]
132: }
133:
134: export interface GeneratedShader {
135:   // Multi-pass output. Single-pass compositions yield exactly one element.
136:   // Last pass renders to the canvas; intermediate passes render to an FBO
137:   // that is sampled by the next pass via u_prevPass.
138:   passes: GeneratedPass[]
139:   vertexShader: string
140:   uniforms: {
141:     name: string
142:     type: UniformType
143:     default: UniformValue
144:     layerName: string
145:     originalName: string
146:     // Carried for vec4Array so the runtime can size the flat Float32Array
147:     // and the React export can declare the same fixed length.
148:     arrayLength?: number
149:   }[]
150:   typescript: string
151:   reactComponent: string
152:   vanillaJs: string
153:   // Concatenated fragment-shader source for display purposes only.
154:   // Runtime should iterate `passes` instead.
155:   fragmentShader: string
156: }

(End of file - total 156 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts",
  "offset": 1,
  "limit": 360
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts</path>
<type>file</type>
<content>
1: import type {
2:   LayerInstance,
3:   GeneratedShader,
4:   GeneratedPass,
5:   BlendMode,
6:   UniformType,
7:   LayerDefinition,
8: } from './types'
9: import { LAYER_LIBRARY } from './layers'
10: import { GLSL_UTILS, BLEND_MODE_FUNCTIONS } from './glsl-utils'
11: import runtimeShellSource from './runtime-shell.ts?raw'
12:
13: const INLINED_RUNTIME = runtimeShellSource.replace(/^export /gm, '')
14:
15: // Default fixed length for vec4Array uniforms when LayerDefinition does not
16: // override `arrayLength`. Mirrors RAMP_MAX in glsl-utils.colorRampLookup.
17: export const DEFAULT_VEC4_ARRAY_LENGTH = 10
18:
19: interface PassPlan {
20:   layers: LayerInstance[]
21:   readsPrevPass: boolean
22: }
23:
24: /**
25:  * Generates optimized GLSL shader code from a layer composition.
26:  * Splits the layer chain into render passes at every `consumesPrevPass`
27:  * boundary so distorters/effects can sample the prior output.
28:  */
29: export function generateShader(
30:   layers: LayerInstance[],
31:   shaderName: string = 'CustomShader'
32: ): GeneratedShader {
33:   const enabledLayers = layers.filter((l) => l.enabled)
34:
35:   // Walk the layer list and split into passes at every consumer boundary.
36:   const passPlans = splitIntoPasses(enabledLayers)
37:
38:   // Build the global uniform list (used by runtime + exported code).
39:   const uniforms: GeneratedShader['uniforms'] = []
40:   for (const layer of enabledLayers) {
41:     const def = LAYER_LIBRARY[layer.layerType]
42:     if (!def) continue
43:     const prefix = sanitizeName(layer.id)
44:
45:     uniforms.push({
46:       name: `u_${prefix}_opacity`,
47:       type: 'float',
48:       default: layer.opacity,
49:       layerName: def.name,
50:       originalName: 'opacity',
51:     })
52:     for (const uniform of def.uniforms) {
53:       uniforms.push({
54:         name: `u_${prefix}_${uniform.name}`,
55:         type: uniform.type,
56:         default: layer.uniformValues[uniform.name] ?? uniform.default,
57:         layerName: def.name,
58:         originalName: uniform.name,
59:         arrayLength:
60:           uniform.type === 'vec4Array'
61:             ? uniform.arrayLength ?? DEFAULT_VEC4_ARRAY_LENGTH
62:             : undefined,
63:       })
64:     }
65:   }
66:
67:   // Generate one fragment shader per pass.
68:   const passes: GeneratedPass[] = passPlans.map((plan) =>
69:     buildPass(plan)
70:   )
71:
72:   const vertexShader = `#version 300 es
73: precision highp float;
74:
75: in vec2 a_position;
76: out vec2 v_uv;
77:
78: void main() {
79:   v_uv = a_position * 0.5 + 0.5;
80:   gl_Position = vec4(a_position, 0.0, 1.0);
81: }
82: `
83:
84:   // For display purposes, concatenate all passes into one document.
85:   const fragmentShader = passes
86:     .map(
87:       (p, i) =>
88:         `// === Pass ${i + 1}/${passes.length}` +
89:         (p.readsPrevPass ? ' (reads u_prevPass)' : '') +
90:         ` ===\n${p.fragmentShader}`
91:     )
92:     .join('\n\n')
93:
94:   const typescript = generateTypeScript(uniforms, shaderName)
95:   const reactComponent = generateReactComponent(
96:     uniforms,
97:     shaderName,
98:     passes,
99:     vertexShader
100:   )
101:   const vanillaJs = generateVanillaJs(
102:     uniforms,
103:     shaderName,
104:     passes,
105:     vertexShader
106:   )
107:
108:   return {
109:     passes,
110:     vertexShader,
111:     uniforms,
112:     typescript,
113:     reactComponent,
114:     vanillaJs,
115:     fragmentShader,
116:   }
117: }
118:
119: function splitIntoPasses(layers: LayerInstance[]): PassPlan[] {
120:   const plans: PassPlan[] = []
121:   let current: LayerInstance[] = []
122:   let isReader = false
123:
124:   for (const layer of layers) {
125:     const def = LAYER_LIBRARY[layer.layerType]
126:     if (!def) continue
127:
128:     if (def.consumesPrevPass) {
129:       // Close the current pass first.
130:       plans.push({ layers: current, readsPrevPass: isReader })
131:       current = [layer]
132:       isReader = true
133:     } else {
134:       current.push(layer)
135:     }
136:   }
137:   plans.push({ layers: current, readsPrevPass: isReader })
138:
139:   // Drop a leading empty pass (happens if the very first layer is a consumer
140:   // and there is nothing below). The runtime will just bind a black texture.
141:   if (plans.length > 1 && plans[0].layers.length === 0) {
142:     plans.shift()
143:     // The new first pass keeps readsPrevPass=true; the runtime supplies black.
144:   }
145:   return plans
146: }
147:
148: function buildPass(plan: PassPlan): GeneratedPass {
149:   const { layers, readsPrevPass } = plan
150:
151:   const dependencies = new Set<string>()
152:   const blendModes = new Set<BlendMode>()
153:
154:   for (const layer of layers) {
155:     const def = LAYER_LIBRARY[layer.layerType]
156:     if (!def) continue
157:     def.glsl.dependencies?.forEach((d) => dependencies.add(d))
158:     if (layer.blendMode !== 'normal') blendModes.add(layer.blendMode)
159:   }
160:   blendModes.add('normal')
161:   blendModes.forEach((mode) => {
162:     const funcName = BLEND_MODE_FUNCTIONS[mode]
163:     if (funcName) dependencies.add(funcName)
164:   })
165:
166:   // Implicit dependency expansion.
167:   if (dependencies.has('fbm') && !dependencies.has('simplex2D')) {
168:     dependencies.add('simplex2D')
169:   }
170:   if (dependencies.has('voronoi') && !dependencies.has('hash2')) {
171:     dependencies.add('hash2')
172:   }
173:   if (dependencies.has('snoise') && !dependencies.has('simplex2D')) {
174:     dependencies.add('simplex2D')
175:   }
176:
177:   const uniformDeclarations: string[] = [
178:     'uniform float u_time;',
179:     'uniform vec2 u_resolution;',
180:   ]
181:   if (readsPrevPass) {
182:     uniformDeclarations.push('uniform sampler2D u_prevPass;')
183:   }
184:
185:   for (const layer of layers) {
186:     const def = LAYER_LIBRARY[layer.layerType]
187:     if (!def) continue
188:     const prefix = sanitizeName(layer.id)
189:     uniformDeclarations.push(`uniform float u_${prefix}_opacity;`)
190:     for (const uniform of def.uniforms) {
191:       const baseName = `u_${prefix}_${uniform.name}`
192:       switch (uniform.type) {
193:         case 'sampler2D':
194:           uniformDeclarations.push(`uniform sampler2D ${baseName};`)
195:           uniformDeclarations.push(`uniform vec4 ${baseName}_meta;`)
196:           uniformDeclarations.push(`uniform vec2 ${baseName}_offset;`)
197:           break
198:         case 'vec4Array': {
199:           const len = uniform.arrayLength ?? DEFAULT_VEC4_ARRAY_LENGTH
200:           uniformDeclarations.push(`uniform vec4 ${baseName}[${len}];`)
201:           uniformDeclarations.push(`uniform int ${baseName}_count;`)
202:           break
203:         }
204:         default: {
205:           const glslType = uniform.type === 'int' ? 'int' : uniform.type
206:           uniformDeclarations.push(`uniform ${glslType} ${baseName};`)
207:         }
208:       }
209:     }
210:   }
211:
212:   const utilFunctions: string[] = []
213:   const sortedDeps = sortDependencies(Array.from(dependencies))
214:   for (const dep of sortedDeps) {
215:     if (GLSL_UTILS[dep]) utilFunctions.push(GLSL_UTILS[dep])
216:   }
217:
218:   const layerFunctions: string[] = []
219:   const mainCalls: string[] = []
220:   const layerHelpers = new Set<string>()
221:
222:   for (let i = 0; i < layers.length; i++) {
223:     const layer = layers[i]
224:     const def = LAYER_LIBRARY[layer.layerType]
225:     if (!def) continue
226:
227:     const prefix = sanitizeName(layer.id)
228:     const funcName = `layer_${prefix}`
229:
230:     let mainCode = def.glsl.main
231:     for (const uniform of def.uniforms) {
232:       const placeholder = new RegExp(`\\{\\{${uniform.name}\\}\\}`, 'g')
233:       mainCode = mainCode.replace(placeholder, `u_${prefix}_${uniform.name}`)
234:     }
235:
236:     if (def.glsl.functions) layerHelpers.add(def.glsl.functions.trim())
237:
238:     layerFunctions.push(`
239: vec4 ${funcName}(vec2 uv, vec4 base) {
240: ${indent(mainCode.trim(), 2)}
241: }`)
242:
243:     const blendFunc = BLEND_MODE_FUNCTIONS[layer.blendMode] || 'blendNormal'
244:     if (i === 0) {
245:       // The first layer of the pass is either a generator (ignores base)
246:       // or a consumer (samples u_prevPass internally).
247:       mainCalls.push(`  vec4 color = ${funcName}(uv, vec4(0.0));`)
248:     } else {
249:       mainCalls.push(
250:         `  color = ${blendFunc}(color, ${funcName}(uv, color), u_${prefix}_opacity);`
251:       )
252:     }
253:   }
254:
255:   const fragmentShader = `#version 300 es
256: precision highp float;
257:
258: in vec2 v_uv;
259: out vec4 fragColor;
260:
261: // Uniforms
262: ${uniformDeclarations.join('\n')}
263:
264: // Utility Functions
265: ${utilFunctions.join('\n')}
266:
267: // Layer Helpers
268: ${Array.from(layerHelpers).join('\n')}
269:
270: // Layer Functions
271: ${layerFunctions.join('\n')}
272:
273: void main() {
274:   vec2 uv = v_uv;
275:
276: ${mainCalls.length > 0 ? mainCalls.join('\n') : '  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);'}
277:
278:   fragColor = color;
279: }
280: `
281:
282:   return {
283:     fragmentShader,
284:     readsPrevPass,
285:     layerIds: layers.map((l) => l.id),
286:   }
287: }
288:
289: export function sanitizeName(name: string): string {
290:   let sanitized = name.replace(/[^a-zA-Z0-9]/g, '')
291:   if (/^[0-9]/.test(sanitized)) sanitized = 'l' + sanitized
292:   if (!sanitized) sanitized = 'layer'
293:   return sanitized
294: }
295:
296: function indent(code: string, spaces: number): string {
297:   const pad = ' '.repeat(spaces)
298:   return code
299:     .split('\n')
300:     .map((line) => pad + line)
301:     .join('\n')
302: }
303:
304: function sortDependencies(deps: string[]): string[] {
305:   const order: Record<string, number> = {
306:     hash: 0,
307:     hash2: 0,
308:     hash3: 0,
309:     remap: 0,
310:     rotate2D: 0,
311:     rgb2hsv: 0,
312:     hsv2rgb: 0,
313:     hash21: 0,
314:     hash22: 0,
315:     simplex2D: 1,
316:     fbm: 2,
317:     voronoi: 2,
318:     snoise: 2,
319:     luma: 0,
320:     gaussian9: 4,
321:     blendNormal: 3,
322:     blendAdd: 3,
323:     blendMultiply: 3,
324:     blendScreen: 3,
325:     blendOverlay: 3,
326:     blendSoftLight: 3,
327:     blendHardLight: 3,
328:   }
329:   return deps.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99))
330: }
331:
332: // sampler2D and vec4Array uniforms aren't exposed as plain JS prop values
333: // in the exported React/vanilla code yet — image binding and palette
334: // authoring stay editor-only until a follow-up wires marshalling.
335: function isExportableUniform(u: GeneratedShader['uniforms'][number]): boolean {
336:   return (
337:     !['u_time', 'u_resolution'].includes(u.name) &&
338:     u.type !== 'sampler2D' &&
339:     u.type !== 'vec4Array'
340:   )
341: }
342:
343: function generateTypeScript(
344:   uniforms: GeneratedShader['uniforms'],
345:   shaderName: string
346: ): string {
347:   const exportable = uniforms.filter(isExportableUniform)
348:   const propsInterface = exportable
349:     .map((u) => {
350:       const tsType = uniformTypeToTS(u.type)
351:       const defaultVal = formatDefault(u.default, u.type)
352:       return `  /** ${u.layerName} - ${u.originalName} */\n  ${camelCase(
353:         u.name
354:       )}?: ${tsType} // default: ${defaultVal}`
355:     })
356:     .join('\n')
357:
358:   return `export interface ${shaderName}Props {
359: ${propsInterface}
360: }

(Showing lines 1-360 of 626. Use offset=361 to continue.)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/property-panel.tsx",
  "offset": 180,
  "limit": 120
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/property-panel.tsx</path>
<type>file</type>
<content>
180: }
181:
182: function ImageInput({
183:   value,
184:   onChange,
185: }: {
186:   value: ImageUniformValue;
187:   onChange: (value: ImageUniformValue) => void;
188: }) {
189:   const fileRef = useRef<HTMLInputElement>(null);
190:
191:   const handleFile = (file: File) => {
192:     const reader = new FileReader();
193:     reader.onload = () => {
194:       if (typeof reader.result === "string") {
195:         onChange({ ...value, url: reader.result, sourceKind: "dataUrl" });
196:       }
197:     };
198:     reader.readAsDataURL(file);
199:   };
200:
201:   const handlePaste = (url: string) => {
202:     if (!url) return;
203:     onChange({ ...value, url, sourceKind: "url" });
204:   };
205:
206:   return (
207:     <div className="space-y-2">
208:       <div
209:         className="flex items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50"
210:         onClick={() => fileRef.current?.click()}
211:         onDragOver={(e) => e.preventDefault()}
212:         onDrop={(e) => {
213:           e.preventDefault();
214:           const f = e.dataTransfer.files[0];
215:           if (f) handleFile(f);
216:         }}
217:       >
218:         {value.url ? (
219:           // eslint-disable-next-line @next/next/no-img-element
220:           <img
221:             src={value.url}
222:             alt="Preview"
223:             className="w-12 h-12 object-cover rounded"
224:           />
225:         ) : (
226:           <div className="w-12 h-12 rounded bg-muted/60 flex items-center justify-center text-muted-foreground">
227:             <Upload className="h-4 w-4" />
228:           </div>
229:         )}
230:         <div className="flex-1 min-w-0">
231:           <div className="text-[11px] text-muted-foreground truncate">
232:             {value.url
233:               ? value.sourceKind === "dataUrl"
234:                 ? "Uploaded file"
235:                 : value.url
236:               : "Drop or paste an image"}
237:           </div>
238:         </div>
239:         {value.url && (
240:           <button
241:             onClick={(e) => {
242:               e.stopPropagation();
243:               onChange({ ...value, url: null, sourceKind: "url" });
244:             }}
245:             className="text-muted-foreground hover:text-destructive p-1"
246:             aria-label="Clear image"
247:           >
248:             <X className="h-3 w-3" />
249:           </button>
250:         )}
251:       </div>
252:       <input
253:         ref={fileRef}
254:         type="file"
255:         accept="image/*"
256:         className="hidden"
257:         onChange={(e) => {
258:           const f = e.target.files?.[0];
259:           if (f) handleFile(f);
260:           e.target.value = "";
261:         }}
262:       />
263:       <input
264:         type="text"
265:         placeholder="…or paste a URL"
266:         className="w-full h-7 text-[11px] px-2 rounded border border-border bg-background"
267:         onKeyDown={(e) => {
268:           if (e.key === "Enter") {
269:             handlePaste((e.target as HTMLInputElement).value);
270:             (e.target as HTMLInputElement).value = "";
271:           }
272:         }}
273:       />
274:       <div className="grid grid-cols-2 gap-2">
275:         <label className="text-[10px] text-muted-foreground">
276:           Fit
277:           <select
278:             className="w-full h-6 mt-0.5 text-[11px] bg-background border border-border rounded px-1"
279:             value={value.fit ?? "cover"}
280:             onChange={(e) =>
281:               onChange({
282:                 ...value,
283:                 fit: e.target.value as ImageUniformValue["fit"],
284:               })
285:             }
286:           >
287:             <option value="cover">Cover</option>
288:             <option value="contain">Contain</option>
289:             <option value="fill">Fill</option>
290:           </select>
291:         </label>
292:         <label className="text-[10px] text-muted-foreground">
293:           Scale
294:           <Slider
295:             value={[value.scale ?? 1]}
296:             onValueChange={([s]) => onChange({ ...value, scale: s })}
297:             min={0.1}
298:             max={4}
299:             step={0.01}

(Showing lines 180-299 of 588. Use offset=300 to continue.)
</content>
```

---

## Assistant (Plan · GPT-5.5 · 3.5s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/property-panel.tsx",
  "offset": 300,
  "limit": 180
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/property-panel.tsx</path>
<type>file</type>
<content>
300:             className="mt-2"
301:           />
302:         </label>
303:       </div>
304:     </div>
305:   );
306: }
307:
308: function UniformControl({
309:   uniform,
310:   value,
311:   onChange,
312: }: {
313:   uniform: UniformDefinition;
314:   value: unknown;
315:   onChange: (value: unknown) => void;
316: }) {
317:   const { ui } = uniform;
318:
319:   switch (uniform.type) {
320:     case "float": {
321:       const numValue = value as number;
322:       return (
323:         <div className="space-y-2">
324:           <div className="flex items-center justify-between">
325:             <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
326:             <span className="text-xs text-muted-foreground font-mono w-12 text-right">
327:               {numValue.toFixed(2)}
328:             </span>
329:           </div>
330:           <Slider
331:             value={[numValue]}
332:             onValueChange={([v]) => onChange(v)}
333:             min={ui?.min ?? 0}
334:             max={ui?.max ?? 1}
335:             step={ui?.step ?? 0.01}
336:             className="w-full"
337:           />
338:         </div>
339:       );
340:     }
341:
342:     case "int": {
343:       const intValue = value as number;
344:       return (
345:         <div className="space-y-2">
346:           <div className="flex items-center justify-between">
347:             <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
348:             <span className="text-xs text-muted-foreground font-mono w-12 text-right">
349:               {intValue}
350:             </span>
351:           </div>
352:           <Slider
353:             value={[intValue]}
354:             onValueChange={([v]) => onChange(Math.round(v))}
355:             min={ui?.min ?? 0}
356:             max={ui?.max ?? 10}
357:             step={1}
358:             className="w-full"
359:           />
360:         </div>
361:       );
362:     }
363:
364:     case "vec2": {
365:       const vec2Value = value as number[];
366:       return (
367:         <div className="space-y-3">
368:           <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
369:           <div className="space-y-2">
370:             <div className="flex items-center gap-2">
371:               <span className="text-xs text-muted-foreground w-4">X</span>
372:               <Slider
373:                 value={[vec2Value[0]]}
374:                 onValueChange={([v]) => onChange([v, vec2Value[1]])}
375:                 min={ui?.min ?? 0}
376:                 max={ui?.max ?? 1}
377:                 step={ui?.step ?? 0.01}
378:                 className="flex-1"
379:               />
380:               <span className="text-xs text-muted-foreground font-mono w-10 text-right">
381:                 {vec2Value[0].toFixed(2)}
382:               </span>
383:             </div>
384:             <div className="flex items-center gap-2">
385:               <span className="text-xs text-muted-foreground w-4">Y</span>
386:               <Slider
387:                 value={[vec2Value[1]]}
388:                 onValueChange={([v]) => onChange([vec2Value[0], v])}
389:                 min={ui?.min ?? 0}
390:                 max={ui?.max ?? 1}
391:                 step={ui?.step ?? 0.01}
392:                 className="flex-1"
393:               />
394:               <span className="text-xs text-muted-foreground font-mono w-10 text-right">
395:                 {vec2Value[1].toFixed(2)}
396:               </span>
397:             </div>
398:           </div>
399:         </div>
400:       );
401:     }
402:
403:     case "vec3":
404:     case "vec4": {
405:       const vecValue = value as number[];
406:       // Check if this looks like a color (values between 0-1)
407:       const isColor = ui?.color || vecValue.every((v) => v >= 0 && v <= 1);
408:
409:       if (isColor) {
410:         return (
411:           <div className="space-y-2">
412:             <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
413:             <ColorInput
414:               value={vecValue}
415:               onChange={(next) => onChange(next as unknown)}
416:             />
417:           </div>
418:         );
419:       }
420:
421:       // Fallback to sliders for non-color vectors
422:       return (
423:         <div className="space-y-2">
424:           <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
425:           {vecValue.map((v, i) => (
426:             <div key={i} className="flex items-center gap-2">
427:               <span className="text-xs text-muted-foreground w-4">
428:                 {["X", "Y", "Z", "W"][i]}
429:               </span>
430:               <Slider
431:                 value={[v]}
432:                 onValueChange={([newV]) => {
433:                   const newVec = [...vecValue];
434:                   newVec[i] = newV;
435:                   onChange(newVec);
436:                 }}
437:                 min={ui?.min ?? 0}
438:                 max={ui?.max ?? 1}
439:                 step={ui?.step ?? 0.01}
440:                 className="flex-1"
441:               />
442:             </div>
443:           ))}
444:         </div>
445:       );
446:     }
447:
448:     case "sampler2D": {
449:       const imgValue = value as ImageUniformValue;
450:       return (
451:         <div className="space-y-2">
452:           <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
453:           <ImageInput
454:             value={imgValue ?? { url: null, sourceKind: "url", fit: "cover" }}
455:             onChange={(next) => onChange(next as unknown)}
456:           />
457:         </div>
458:       );
459:     }
460:
461:     case "vec4Array": {
462:       const arr = value as Vec4ArrayValue;
463:       const max = ui?.array?.maxLength ?? uniform.arrayLength ?? 10;
464:       const min = ui?.array?.minLength ?? 1;
465:       return (
466:         <div className="space-y-2">
467:           <Label className="text-xs text-muted-foreground">{uniform.label}</Label>
468:           <ColorArrayInput
469:             value={arr ?? { values: [[1, 1, 1, 1]], length: 1 }}
470:             maxLength={max}
471:             minLength={min}
472:             onChange={(next) => onChange(next as unknown)}
473:           />
474:         </div>
475:       );
476:     }
477:
478:     default:
479:       return null;

(Showing lines 300-479 of 588. Use offset=480 to continue.)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts",
  "offset": 361,
  "limit": 300
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts</path>
<type>file</type>
<content>
361:
362: export const ${shaderName.toLowerCase()}Defaults: Required<${shaderName}Props> = {
363: ${exportable
364:   .map((u) => `  ${camelCase(u.name)}: ${formatDefault(u.default, u.type)},`)
365:   .join('\n')}
366: }
367: `
368: }
369:
370: function generateReactComponent(
371:   uniforms: GeneratedShader['uniforms'],
372:   shaderName: string,
373:   passes: GeneratedPass[],
374:   vertexShader: string
375: ): string {
376:   const propUniforms = uniforms.filter(isExportableUniform)
377:   const propsList = propUniforms.map((u) => camelCase(u.name))
378:   const propsWithDefaults = propUniforms
379:     .map((u) => `    ${camelCase(u.name)} = ${formatDefault(u.default, u.type)},`)
380:     .join('\n')
381:   const uniformSetterEntries = propUniforms
382:     .map((u) => {
383:       const setter = getUniformSetter(u.type)
384:       const value = formatUniformValue(u.type, camelCase(u.name))
385:       return `      { name: '${u.name}', set: (gl: WebGL2RenderingContext, loc: WebGLUniformLocation | null) => { if (loc !== null) gl.${setter}(loc, ${value}) } },`
386:     })
387:     .join('\n')
388:
389:   const escapedVertex = escape(vertexShader)
390:   const passSources = passes
391:     .map(
392:       (p) =>
393:         `  { fragment: \`${escape(p.fragmentShader)}\`, readsPrevPass: ${p.readsPrevPass} },`
394:     )
395:     .join('\n')
396:
397:   return `'use client'
398:
399: import { useEffect, useRef } from 'react'
400:
401: ${INLINED_RUNTIME}
402:
403: interface ${shaderName}Props {
404: ${propUniforms
405:   .map((u) => `  ${camelCase(u.name)}?: ${uniformTypeToTS(u.type)}`)
406:   .join('\n')}
407:   className?: string
408:   style?: React.CSSProperties
409: }
410:
411: const VERTEX_SHADER = \`${escapedVertex}\`
412:
413: const PASSES: PipelinePass[] = [
414: ${passSources}
415: ]
416:
417: export function ${shaderName}({
418: ${propsWithDefaults}
419:     className,
420:     style,
421:   }: ${shaderName}Props) {
422:   const canvasRef = useRef<HTMLCanvasElement>(null)
423:
424:   useEffect(() => {
425:     const canvas = canvasRef.current
426:     if (!canvas) return
427:     const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: false })
428:     if (!gl) { console.error('WebGL2 not supported'); return }
429:
430:     const pipeline = createShaderPipeline(gl, VERTEX_SHADER, PASSES)
431:
432:     const setUniforms = [
433: ${uniformSetterEntries}
434:     ]
435:
436:     const startTime = performance.now()
437:     let raf = 0
438:
439:     function frame() {
440:       const dpr = window.devicePixelRatio || 1
441:       const w = canvas!.clientWidth * dpr
442:       const h = canvas!.clientHeight * dpr
443:       if (canvas!.width !== w || canvas!.height !== h) {
444:         canvas!.width = w; canvas!.height = h
445:       }
446:       const time = (performance.now() - startTime) / 1000
447:
448:       pipeline.render(time, w, h, (_i, prog) => {
449:         for (const u of setUniforms) {
450:           u.set(gl!, gl!.getUniformLocation(prog, u.name))
451:         }
452:       })
453:
454:       raf = requestAnimationFrame(frame)
455:     }
456:     frame()
457:
458:     return () => {
459:       cancelAnimationFrame(raf)
460:       pipeline.destroy()
461:     }
462:   }, [${propsList.join(', ')}])
463:
464:   return (
465:     <canvas
466:       ref={canvasRef}
467:       className={className}
468:       style={{ width: '100%', height: '100%', ...style }}
469:     />
470:   )
471: }
472: `
473: }
474:
475: function generateVanillaJs(
476:   uniforms: GeneratedShader['uniforms'],
477:   shaderName: string,
478:   passes: GeneratedPass[],
479:   vertexShader: string
480: ): string {
481:   const propUniforms = uniforms.filter(isExportableUniform)
482:   const escapedVertex = escape(vertexShader)
483:   const passSources = passes
484:     .map(
485:       (p) =>
486:         `  { fragment: \`${escape(p.fragmentShader)}\`, readsPrevPass: ${p.readsPrevPass} },`
487:     )
488:     .join('\n')
489:
490:   const optionsType = propUniforms
491:     .map((u) => `  ${camelCase(u.name)}?: ${uniformTypeToTS(u.type)}`)
492:     .join('\n')
493:
494:   const setUniformEntries = propUniforms
495:     .map((u) => {
496:       const setter = getUniformSetter(u.type)
497:       const def = formatDefault(u.default, u.type)
498:       const access = `(options.${camelCase(u.name)} ?? ${def})`
499:       const value =
500:         u.type === 'bool' ? `${access} ? 1 : 0` : access
501:       return `      { name: '${u.name}', set: (loc: WebGLUniformLocation | null) => { if (loc !== null) gl.${setter}(loc, ${value}) } },`
502:     })
503:     .join('\n')
504:
505:   return `/**
506:  * ${shaderName} - Multi-pass WebGL2 shader
507:  * Generated by Shader Composer
508:  */
509:
510: ${INLINED_RUNTIME}
511:
512: const VERTEX_SHADER = \`${escapedVertex}\`
513:
514: const PASSES: PipelinePass[] = [
515: ${passSources}
516: ]
517:
518: export interface ${shaderName}Options {
519: ${optionsType}
520: }
521:
522: export function create${shaderName}(canvas: HTMLCanvasElement, options: ${shaderName}Options = {}) {
523:   const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: false })
524:   if (!gl) throw new Error('WebGL2 not supported')
525:
526:   const pipeline = createShaderPipeline(gl, VERTEX_SHADER, PASSES)
527:
528:   function setOptionUniforms(prog: WebGLProgram) {
529:     const setters: { name: string; set: (loc: WebGLUniformLocation | null) => void }[] = [
530: ${setUniformEntries}
531:     ]
532:     for (const s of setters) s.set(gl!.getUniformLocation(prog, s.name))
533:   }
534:
535:   const startTime = performance.now()
536:   let animationId = 0
537:
538:   function frame() {
539:     const dpr = window.devicePixelRatio || 1
540:     const w = canvas.clientWidth * dpr
541:     const h = canvas.clientHeight * dpr
542:     if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
543:     const time = (performance.now() - startTime) / 1000
544:     pipeline.render(time, w, h, (_i, prog) => setOptionUniforms(prog))
545:     animationId = requestAnimationFrame(frame)
546:   }
547:   frame()
548:
549:   return {
550:     update(newOptions: Partial<${shaderName}Options>) { Object.assign(options, newOptions) },
551:     destroy() {
552:       cancelAnimationFrame(animationId)
553:       pipeline.destroy()
554:     },
555:   }
556: }
557: `
558: }
559:
560: function uniformTypeToTS(type: UniformType): string {
561:   switch (type) {
562:     case 'float':
563:     case 'int':
564:       return 'number'
565:     case 'bool':
566:       return 'boolean'
567:     case 'vec2':
568:       return '[number, number]'
569:     case 'vec3':
570:       return '[number, number, number]'
571:     case 'vec4':
572:       return '[number, number, number, number]'
573:     default:
574:       return 'number'
575:   }
576: }
577:
578: function formatDefault(value: unknown, _type: UniformType): string {
579:   if (Array.isArray(value)) return `[${value.join(', ')}]`
580:   if (typeof value === 'object' && value !== null) {
581:     // sampler2D / vec4Array defaults — these aren't exposed as flat props,
582:     // so the export path stubs them out as `undefined`.
583:     return 'undefined'
584:   }
585:   return String(value)
586: }
587:
588: function getUniformSetter(type: UniformType): string {
589:   switch (type) {
590:     case 'float':
591:       return 'uniform1f'
592:     case 'int':
593:       return 'uniform1i'
594:     case 'bool':
595:       return 'uniform1i'
596:     case 'vec2':
597:       return 'uniform2fv'
598:     case 'vec3':
599:       return 'uniform3fv'
600:     case 'vec4':
601:       return 'uniform4fv'
602:     default:
603:       return 'uniform1f'
604:   }
605: }
606:
607: function formatUniformValue(type: UniformType, name: string): string {
608:   switch (type) {
609:     case 'bool':
610:       return `${name} ? 1 : 0`
611:     case 'vec2':
612:     case 'vec3':
613:     case 'vec4':
614:       return name
615:     default:
616:       return name
617:   }
618: }
619:
620: function camelCase(str: string): string {
621:   return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
622: }
623:
624: function escape(s: string): string {
625:   return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
626: }

(End of file - total 626 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-preview.tsx",
  "offset": 1,
  "limit": 360
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-preview.tsx</path>
<type>file</type>
<content>
1: "use client";
2:
3: import { useRef, useEffect } from "react";
4: import { useComposer } from "@/lib/shader-composer/context";
5: import {
6:   generateShader,
7:   sanitizeName,
8:   DEFAULT_VEC4_ARRAY_LENGTH,
9: } from "@/lib/shader-composer/generator";
10: import { LAYER_LIBRARY } from "@/lib/shader-composer/layers";
11: import {
12:   createShaderPipeline,
13:   type PipelineHandle,
14: } from "@/lib/shader-composer/runtime-shell";
15: import { TextureCache } from "@/lib/shader-composer/texture-cache";
16: import type {
17:   GeneratedPass,
18:   ImageUniformValue,
19:   Vec4ArrayValue,
20: } from "@/lib/shader-composer/types";
21:
22: const FIT_MODE: Record<string, number> = {
23:   cover: 0,
24:   contain: 1,
25:   fill: 2,
26: };
27:
28: function isImageValue(v: unknown): v is ImageUniformValue {
29:   return (
30:     typeof v === "object" &&
31:     v !== null &&
32:     "sourceKind" in (v as Record<string, unknown>)
33:   );
34: }
35:
36: function isVec4ArrayValue(v: unknown): v is Vec4ArrayValue {
37:   return (
38:     typeof v === "object" &&
39:     v !== null &&
40:     Array.isArray((v as Vec4ArrayValue).values)
41:   );
42: }
43:
44: export function ShaderPreview() {
45:   const canvasRef = useRef<HTMLCanvasElement>(null);
46:   const glRef = useRef<WebGL2RenderingContext | null>(null);
47:   const pipelineRef = useRef<PipelineHandle | null>(null);
48:   const passesRef = useRef<GeneratedPass[]>([]);
49:   const animationRef = useRef<number>(0);
50:   const startTimeRef = useRef<number>(Date.now());
51:   const textureCacheRef = useRef<TextureCache | null>(null);
52:
53:   const { state } = useComposer();
54:
55:   useEffect(() => {
56:     const canvas = canvasRef.current;
57:     if (!canvas) return;
58:
59:     const gl = canvas.getContext("webgl2", {
60:       alpha: false,
61:       antialias: true,
62:       premultipliedAlpha: false,
63:     });
64:
65:     if (!gl) {
66:       console.error("WebGL2 not supported");
67:       return;
68:     }
69:     glRef.current = gl;
70:     textureCacheRef.current = new TextureCache(gl);
71:
72:     return () => {
73:       cancelAnimationFrame(animationRef.current);
74:       pipelineRef.current?.destroy();
75:       pipelineRef.current = null;
76:       textureCacheRef.current?.destroy();
77:       textureCacheRef.current = null;
78:     };
79:   }, []);
80:
81:   useEffect(() => {
82:     const gl = glRef.current;
83:     if (!gl) return;
84:
85:     pipelineRef.current?.destroy();
86:     pipelineRef.current = null;
87:     passesRef.current = [];
88:
89:     const enabledLayers = state.layers.filter((l) => l.enabled);
90:     if (enabledLayers.length === 0) {
91:       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
92:       gl.clearColor(0, 0, 0, 1);
93:       gl.clear(gl.COLOR_BUFFER_BIT);
94:       return;
95:     }
96:
97:     const { passes, vertexShader } = generateShader(enabledLayers);
98:     passesRef.current = passes;
99:     pipelineRef.current = createShaderPipeline(
100:       gl,
101:       vertexShader,
102:       passes.map((p) => ({ fragment: p.fragmentShader, readsPrevPass: p.readsPrevPass }))
103:     );
104:   }, [state.layers]);
105:
106:   useEffect(() => {
107:     const gl = glRef.current;
108:     const canvas = canvasRef.current;
109:     if (!gl || !canvas) return;
110:
111:     const render = () => {
112:       const pipeline = pipelineRef.current;
113:       const passes = passesRef.current;
114:       if (!pipeline || passes.length === 0) {
115:         animationRef.current = requestAnimationFrame(render);
116:         return;
117:       }
118:
119:       const dpr = window.devicePixelRatio || 1;
120:       const w = Math.max(1, canvas.clientWidth * dpr);
121:       const h = Math.max(1, canvas.clientHeight * dpr);
122:       if (canvas.width !== w || canvas.height !== h) {
123:         canvas.width = w;
124:         canvas.height = h;
125:       }
126:
127:       const time = (Date.now() - startTimeRef.current) / 1000;
128:
129:       pipeline.render(time, w, h, (ctx, program) => {
130:         const pass = passes[ctx.passIndex];
131:         let textureUnit = ctx.nextTextureUnit;
132:         for (const layerId of pass.layerIds) {
133:           const layer = state.layers.find((l) => l.id === layerId);
134:           if (!layer) continue;
135:           const definition = LAYER_LIBRARY[layer.layerType];
136:           if (!definition) continue;
137:           const prefix = sanitizeName(layer.id);
138:
139:           const opacityLocation = gl.getUniformLocation(
140:             program,
141:             `u_${prefix}_opacity`
142:           );
143:           if (opacityLocation) gl.uniform1f(opacityLocation, layer.opacity);
144:
145:           for (const uniform of definition.uniforms) {
146:             const baseName = `u_${prefix}_${uniform.name}`;
147:             const value = layer.uniformValues[uniform.name];
148:             if (value === undefined) continue;
149:
150:             switch (uniform.type) {
151:               case "float":
152:                 gl.uniform1f(
153:                   gl.getUniformLocation(program, baseName),
154:                   value as number
155:                 );
156:                 break;
157:               case "vec2":
158:                 gl.uniform2fv(
159:                   gl.getUniformLocation(program, baseName),
160:                   value as number[]
161:                 );
162:                 break;
163:               case "vec3":
164:                 gl.uniform3fv(
165:                   gl.getUniformLocation(program, baseName),
166:                   value as number[]
167:                 );
168:                 break;
169:               case "vec4":
170:                 gl.uniform4fv(
171:                   gl.getUniformLocation(program, baseName),
172:                   value as number[]
173:                 );
174:                 break;
175:               case "int":
176:                 gl.uniform1i(
177:                   gl.getUniformLocation(program, baseName),
178:                   value as number
179:                 );
180:                 break;
181:               case "bool":
182:                 gl.uniform1i(
183:                   gl.getUniformLocation(program, baseName),
184:                   value ? 1 : 0
185:                 );
186:                 break;
187:               case "sampler2D": {
188:                 const cache = textureCacheRef.current;
189:                 if (!cache) break;
190:                 const img = isImageValue(value) ? value : null;
191:                 let entry = img?.url ? cache.peek(img.url) : null;
192:                 if (img?.url && !entry) {
193:                   // Schedule load; this frame uses placeholder.
194:                   cache.prefetch(img.url);
195:                 }
196:                 const tex = entry?.texture ?? cache.getPlaceholder();
197:                 gl.activeTexture(gl.TEXTURE0 + textureUnit);
198:                 gl.bindTexture(gl.TEXTURE_2D, tex);
199:                 gl.uniform1i(
200:                   gl.getUniformLocation(program, baseName),
201:                   textureUnit
202:                 );
203:                 gl.uniform4fv(
204:                   gl.getUniformLocation(program, `${baseName}_meta`),
205:                   [
206:                     entry?.aspect ?? 1,
207:                     FIT_MODE[img?.fit ?? "cover"] ?? 0,
208:                     img?.scale ?? 1,
209:                     img?.rotation ?? 0,
210:                   ]
211:                 );
212:                 gl.uniform2fv(
213:                   gl.getUniformLocation(program, `${baseName}_offset`),
214:                   [img?.offsetX ?? 0, img?.offsetY ?? 0]
215:                 );
216:                 textureUnit += 1;
217:                 break;
218:               }
219:               case "vec4Array": {
220:                 if (!isVec4ArrayValue(value)) break;
221:                 const len =
222:                   uniform.arrayLength ?? DEFAULT_VEC4_ARRAY_LENGTH;
223:                 const flat = new Float32Array(len * 4);
224:                 const count = Math.min(value.length, value.values.length, len);
225:                 for (let i = 0; i < count; i++) {
226:                   const c = value.values[i];
227:                   flat[i * 4 + 0] = c[0] ?? 0;
228:                   flat[i * 4 + 1] = c[1] ?? 0;
229:                   flat[i * 4 + 2] = c[2] ?? 0;
230:                   flat[i * 4 + 3] = c[3] ?? 1;
231:                 }
232:                 gl.uniform4fv(
233:                   gl.getUniformLocation(program, baseName),
234:                   flat
235:                 );
236:                 gl.uniform1i(
237:                   gl.getUniformLocation(program, `${baseName}_count`),
238:                   count
239:                 );
240:                 break;
241:               }
242:             }
243:           }
244:         }
245:       });
246:
247:       animationRef.current = requestAnimationFrame(render);
248:     };
249:
250:     animationRef.current = requestAnimationFrame(render);
251:     return () => cancelAnimationFrame(animationRef.current);
252:   }, [state.layers]);
253:
254:   return (
255:     <canvas
256:       ref={canvasRef}
257:       className="w-full h-full bg-black"
258:       style={{ imageRendering: "pixelated" }}
259:     />
260:   );
261: }

(End of file - total 261 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/index.ts",
  "offset": 1,
  "limit": 220
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/index.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { SHAPE_LAYERS } from './shapes'
3: import { PATTERN_LAYERS } from './patterns'
4: import { GRADIENT_LAYERS } from './gradients'
5: import { NOISE_LAYERS } from './noise'
6: import { ATMOSPHERIC_LAYERS } from './atmospherics'
7: import { SOURCE_LAYERS } from './sources'
8: import { DISTORTER_LAYERS } from './distorters'
9: import { BLUR_LAYERS } from './blurs'
10: import { LIGHTING_LAYERS } from './lighting'
11: import { COLOR_LAYERS } from './color'
12: import { STYLIZE_LAYERS } from './stylize'
13: import { SPECIALIZED_LAYERS } from './specialized'
14: import { PAPER_SHADER_LAYERS } from './paper-shaders'
15:
16: export const simplexNoiseLayer: LayerDefinition = {
17:   id: 'simplex-noise',
18:   name: 'Simplex Noise',
19:   description: 'Smooth, organic noise pattern',
20:   color: '#8b5cf6',
21:   category: 'generator',
22:   defaultBlendMode: 'normal',
23:   uniforms: [
24:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.1, max: 20, step: 0.1 } },
25:     { name: 'speed', label: 'Speed', type: 'float', default: 1.0, ui: { min: 0, max: 5, step: 0.1 } },
26:     { name: 'octaves', label: 'Octaves', type: 'float', default: 4.0, ui: { min: 1, max: 8, step: 1 } },
27:     { name: 'lacunarity', label: 'Lacunarity', type: 'float', default: 2.0, ui: { min: 1, max: 4, step: 0.1 } },
28:     { name: 'gain', label: 'Gain', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
29:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
30:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [1.0, 1.0, 1.0], ui: { color: true } },
31:   ],
32:   glsl: {
33:     dependencies: ['simplex2D', 'fbm'],
34:     main: `
35: vec2 noiseUv = uv * {{scale}} + u_time * {{speed}} * 0.1;
36: float n = fbm(noiseUv, {{octaves}}, {{lacunarity}}, {{gain}});
37: n = n * 0.5 + 0.5; // remap to 0-1
38: vec3 col = mix({{color1}}, {{color2}}, n);
39: return vec4(col, 1.0);`,
40:   },
41: }
42:
43: export const voronoiLayer: LayerDefinition = {
44:   id: 'voronoi',
45:   name: 'Voronoi',
46:   description: 'Cell-based pattern with organic shapes',
47:   color: '#06b6d4',
48:   category: 'generator',
49:   defaultBlendMode: 'normal',
50:   uniforms: [
51:     { name: 'scale', label: 'Scale', type: 'float', default: 5.0, ui: { min: 1, max: 20, step: 0.5 } },
52:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 3, step: 0.1 } },
53:     { name: 'randomness', label: 'Randomness', type: 'float', default: 1.0, ui: { min: 0, max: 1, step: 0.01 } },
54:     { name: 'edgeWidth', label: 'Edge Width', type: 'float', default: 0.05, ui: { min: 0, max: 0.3, step: 0.01 } },
55:     { name: 'cellColor', label: 'Cell Color', type: 'vec3', default: [0.1, 0.1, 0.15], ui: { color: true } },
56:     { name: 'edgeColor', label: 'Edge Color', type: 'vec3', default: [0.4, 0.6, 1.0], ui: { color: true } },
57:   ],
58:   glsl: {
59:     dependencies: ['hash2', 'voronoi'],
60:     main: `
61: vec2 voronoiUv = uv * {{scale}} + vec2(u_time * {{speed}} * 0.1, 0.0);
62: vec3 v = voronoi(voronoiUv, {{randomness}});
63: float edge = smoothstep(0.0, {{edgeWidth}}, v.x);
64: vec3 col = mix({{edgeColor}}, {{cellColor}}, edge);
65: return vec4(col, 1.0);`,
66:   },
67: }
68:
69: export const linearGradientLayer: LayerDefinition = {
70:   id: 'linear-gradient',
71:   name: 'Linear Gradient',
72:   description: 'Smooth linear color transition',
73:   color: '#f97316',
74:   category: 'generator',
75:   defaultBlendMode: 'normal',
76:   uniforms: [
77:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.05, 0.05, 0.1], ui: { color: true } },
78:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.2, 0.4, 0.8], ui: { color: true } },
79:     { name: 'angle', label: 'Angle', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
80:     { name: 'offset', label: 'Offset', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
81:     { name: 'smoothness', label: 'Smoothness', type: 'float', default: 1.0, ui: { min: 0.01, max: 2, step: 0.01 } },
82:   ],
83:   glsl: {
84:     dependencies: ['rotate2D'],
85:     main: `
86: vec2 gradUv = uv - 0.5;
87: float angleRad = {{angle}} * 3.14159 / 180.0;
88: gradUv = rotate2D(gradUv, angleRad);
89: float t = gradUv.y + 0.5;
90: t = (t - (1.0 - {{offset}})) / {{smoothness}};
91: t = clamp(t, 0.0, 1.0);
92: vec3 col = mix({{color1}}, {{color2}}, t);
93: return vec4(col, 1.0);`,
94:   },
95: }
96:
97: export const radialGradientLayer: LayerDefinition = {
98:   id: 'radial-gradient',
99:   name: 'Radial Gradient',
100:   description: 'Circular color transition from center',
101:   color: '#ec4899',
102:   category: 'generator',
103:   defaultBlendMode: 'normal',
104:   uniforms: [
105:     { name: 'color1', label: 'Inner Color', type: 'vec3', default: [1.0, 0.8, 0.4], ui: { color: true } },
106:     { name: 'color2', label: 'Outer Color', type: 'vec3', default: [0.1, 0.05, 0.2], ui: { color: true } },
107:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
108:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
109:     { name: 'radius', label: 'Radius', type: 'float', default: 0.8, ui: { min: 0.1, max: 2, step: 0.01 } },
110:     { name: 'smoothness', label: 'Smoothness', type: 'float', default: 0.5, ui: { min: 0.01, max: 2, step: 0.01 } },
111:   ],
112:   glsl: {
113:     main: `
114: vec2 center = vec2({{centerX}}, {{centerY}});
115: float dist = distance(uv, center);
116: float t = dist / {{radius}};
117: t = pow(t, {{smoothness}});
118: t = clamp(t, 0.0, 1.0);
119: vec3 col = mix({{color1}}, {{color2}}, t);
120: return vec4(col, 1.0);`,
121:   },
122: }
123:
124: export const wavesLayer: LayerDefinition = {
125:   id: 'waves',
126:   name: 'Waves',
127:   description: 'Animated wave distortion pattern',
128:   color: '#14b8a6',
129:   category: 'generator',
130:   defaultBlendMode: 'normal',
131:   uniforms: [
132:     { name: 'frequency', label: 'Frequency', type: 'float', default: 10.0, ui: { min: 1, max: 30, step: 0.5 } },
133:     { name: 'amplitude', label: 'Amplitude', type: 'float', default: 0.1, ui: { min: 0, max: 0.5, step: 0.01 } },
134:     { name: 'speed', label: 'Speed', type: 'float', default: 2.0, ui: { min: 0, max: 10, step: 0.1 } },
135:     { name: 'direction', label: 'Direction', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
136:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.0, 0.3, 0.5], ui: { color: true } },
137:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.0, 0.6, 0.8], ui: { color: true } },
138:   ],
139:   glsl: {
140:     dependencies: ['rotate2D'],
141:     main: `
142: float dirRad = {{direction}} * 3.14159 / 180.0;
143: vec2 waveUv = rotate2D(uv - 0.5, dirRad) + 0.5;
144: float wave = sin(waveUv.x * {{frequency}} + u_time * {{speed}}) * {{amplitude}};
145: float t = waveUv.y + wave;
146: t = fract(t * 2.0);
147: vec3 col = mix({{color1}}, {{color2}}, t);
148: return vec4(col, 1.0);`,
149:   },
150: }
151:
152: export const vignetteLayer: LayerDefinition = {
153:   id: 'vignette',
154:   name: 'Vignette',
155:   description: 'Darkened edges effect',
156:   color: '#64748b',
157:   category: 'effect',
158:   defaultBlendMode: 'multiply',
159:   uniforms: [
160:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.5, ui: { min: 0, max: 2, step: 0.01 } },
161:     { name: 'smoothness', label: 'Smoothness', type: 'float', default: 0.5, ui: { min: 0.01, max: 2, step: 0.01 } },
162:     { name: 'roundness', label: 'Roundness', type: 'float', default: 1.0, ui: { min: 0.1, max: 2, step: 0.01 } },
163:     { name: 'color', label: 'Color', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
164:   ],
165:   glsl: {
166:     main: `
167: vec2 vignetteUv = uv * (1.0 - uv.yx);
168: float vig = vignetteUv.x * vignetteUv.y * 15.0;
169: vig = pow(vig, {{smoothness}} * {{intensity}});
170: vig = clamp(vig, 0.0, 1.0);
171: vec3 vigColor = mix({{color}}, base.rgb, vig);
172: return vec4(vigColor, base.a);`,
173:   },
174: }
175:
176: export const grainLayer: LayerDefinition = {
177:   id: 'grain',
178:   name: 'Film Grain',
179:   description: 'Adds film-like grain texture',
180:   color: '#a3a3a3',
181:   category: 'effect',
182:   defaultBlendMode: 'overlay',
183:   uniforms: [
184:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.1, ui: { min: 0, max: 0.5, step: 0.01 } },
185:     { name: 'speed', label: 'Animation Speed', type: 'float', default: 1.0, ui: { min: 0, max: 5, step: 0.1 } },
186:     { name: 'colored', label: 'Colored', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 1 } },
187:   ],
188:   glsl: {
189:     dependencies: ['hash', 'hash3'],
190:     main: `
191: vec2 grainUv = uv * u_resolution;
192: float t = fract(u_time * {{speed}});
193: vec3 grain;
194: if ({{colored}} > 0.5) {
195:   grain = hash3(grainUv + t) * 2.0 - 1.0;
196: } else {
197:   float g = hash(grainUv + t) * 2.0 - 1.0;
198:   grain = vec3(g);
199: }
200: vec3 col = base.rgb + grain * {{intensity}};
201: return vec4(col, base.a);`,
202:   },
203: }
204:
205: export const chromaticAberrationLayer: LayerDefinition = {
206:   id: 'chromatic-aberration',
207:   name: 'Chromatic Aberration',
208:   description: 'RGB color channel separation',
209:   color: '#ef4444',
210:   category: 'effect',
211:   defaultBlendMode: 'normal',
212:   uniforms: [
213:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.01, ui: { min: 0, max: 0.1, step: 0.001 } },
214:     { name: 'angle', label: 'Angle', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
215:     { name: 'radial', label: 'Radial', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },
216:   ],
217:   glsl: {
218:     dependencies: ['rotate2D'],
219:     main: `
220: vec2 center = uv - 0.5;

(Showing lines 1-220 of 341. Use offset=221 to continue.)
</content>
```

---

## Assistant (Plan · GPT-5.5 · 4.4s)

**Tool: webfetch**

**Input:**

```json
{
  "url": "https://api.github.com/repos/paper-design/shaders/git/trees/main?recursive=1",
  "format": "text",
  "timeout": 30
}
```

**Output:**

```
{
  "sha": "17da1346832cba44365ba12d76c0ad6b2a9dd39d",
  "url": "https://api.github.com/repos/paper-design/shaders/git/trees/17da1346832cba44365ba12d76c0ad6b2a9dd39d",
  "tree": [
    {
      "path": ".bun-version",
      "mode": "100644",
      "type": "blob",
      "sha": "f0bb29e76388856b273698ae6064b0380ce5e5d2",
      "size": 6,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f0bb29e76388856b273698ae6064b0380ce5e5d2"
    },
    {
      "path": ".github",
      "mode": "040000",
      "type": "tree",
      "sha": "e01dd9719be45262c8915b9a5eea4b55868fe26d",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/e01dd9719be45262c8915b9a5eea4b55868fe26d"
    },
    {
      "path": ".github/workflows",
      "mode": "040000",
      "type": "tree",
      "sha": "a91fb7e648e074163a16dc422f8700221394afb0",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/a91fb7e648e074163a16dc422f8700221394afb0"
    },
    {
      "path": ".github/workflows/unit-test-packages.yml",
      "mode": "100644",
      "type": "blob",
      "sha": "7147ceccde0d413ba270b6f90751e543d787b945",
      "size": 727,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7147ceccde0d413ba270b6f90751e543d787b945"
    },
    {
      "path": ".gitignore",
      "mode": "100644",
      "type": "blob",
      "sha": "c4686499c91b0485a6dc30bcf37dec6575a048ba",
      "size": 411,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c4686499c91b0485a6dc30bcf37dec6575a048ba"
    },
    {
      "path": ".prettierrc",
      "mode": "100644",
      "type": "blob",
      "sha": "3708ec6b22e7d59bee62b39514adc07558d0aaad",
      "size": 234,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/3708ec6b22e7d59bee62b39514adc07558d0aaad"
    },
    {
      "path": "CHANGELOG.md",
      "mode": "100644",
      "type": "blob",
      "sha": "145765d8d157074f7c20d8d42179413ccc4619fb",
      "size": 13797,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/145765d8d157074f7c20d8d42179413ccc4619fb"
    },
    {
      "path": "LICENSE",
      "mode": "100644",
      "type": "blob",
      "sha": "3f09b052c0f43515fb760d742a901fe715ce235e",
      "size": 5748,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/3f09b052c0f43515fb760d742a901fe715ce235e"
    },
    {
      "path": "README.md",
      "mode": "100644",
      "type": "blob",
      "sha": "bb3b2c1ad6017616670a63de68ed731b58a5264b",
      "size": 2696,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/bb3b2c1ad6017616670a63de68ed731b58a5264b"
    },
    {
      "path": "build.js",
      "mode": "100644",
      "type": "blob",
      "sha": "fbff353d6802b9a0cf4059f85646f35378408e93",
      "size": 1474,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/fbff353d6802b9a0cf4059f85646f35378408e93"
    },
    {
      "path": "bun.lock",
      "mode": "100644",
      "type": "blob",
      "sha": "cfd0bf0b0e9a12469614bb459907276d670d77bb",
      "size": 184252,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cfd0bf0b0e9a12469614bb459907276d670d77bb"
    },
    {
      "path": "docs",
      "mode": "040000",
      "type": "tree",
      "sha": "0de77f6cc13d7931fdb065fe2d036b075a6bde9c",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/0de77f6cc13d7931fdb065fe2d036b075a6bde9c"
    },
    {
      "path": "docs/.gitignore",
      "mode": "100644",
      "type": "blob",
      "sha": "afc889aa07b60f06ed062c8a469d5823ee8ae36e",
      "size": 529,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/afc889aa07b60f06ed062c8a469d5823ee8ae36e"
    },
    {
      "path": "docs/eslint.config.js",
      "mode": "100644",
      "type": "blob",
      "sha": "ef145628102bfc4875105f369c0ca120625dc773",
      "size": 515,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ef145628102bfc4875105f369c0ca120625dc773"
    },
    {
      "path": "docs/next.config.js",
      "mode": "100644",
      "type": "blob",
      "sha": "81409fbebc5b627d21579bdc3a66b69dc3ea0db8",
      "size": 289,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/81409fbebc5b627d21579bdc3a66b69dc3ea0db8"
    },
    {
      "path": "docs/package.json",
      "mode": "100644",
      "type": "blob",
      "sha": "cf93718c6b61dda4f56fe33f1246a3c0c4b06a2f",
      "size": 1011,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cf93718c6b61dda4f56fe33f1246a3c0c4b06a2f"
    },
    {
      "path": "docs/postcss.config.js",
      "mode": "100644",
      "type": "blob",
      "sha": "297374d80baa3b6081a566876859cf746a8b3669",
      "size": 94,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/297374d80baa3b6081a566876859cf746a8b3669"
    },
    {
      "path": "docs/public",
      "mode": "040000",
      "type": "tree",
      "sha": "f421b1b7a28a69012bbb2dde6f4235f16380e213",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/f421b1b7a28a69012bbb2dde6f4235f16380e213"
    },
    {
      "path": "docs/public/apple-touch-icon.png",
      "mode": "100644",
      "type": "blob",
      "sha": "0ffa0fe3f47804a2ddbe0bd32b3dedb5cb9ddb8a",
      "size": 707,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/0ffa0fe3f47804a2ddbe0bd32b3dedb5cb9ddb8a"
    },
    {
      "path": "docs/public/flowers.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "428a9fb905e10e70db6302a441aaf79d6d14850a",
      "size": 56434,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/428a9fb905e10e70db6302a441aaf79d6d14850a"
    },
    {
      "path": "docs/public/images",
      "mode": "040000",
      "type": "tree",
      "sha": "9ac392819f05e0b6c728ad3cb9f34a77b32d903b",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/9ac392819f05e0b6c728ad3cb9f34a77b32d903b"
    },
    {
      "path": "docs/public/images/git-readme-picture.jpg",
      "mode": "100644",
      "type": "blob",
      "sha": "4ae9ba8163ede5535169f1425af02f59d9fc36f5",
      "size": 209816,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4ae9ba8163ede5535169f1425af02f59d9fc36f5"
    },
    {
      "path": "docs/public/images/git-readme-picture.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "3a40056087746d28d068b381dc3b42b42efa8896",
      "size": 66096,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/3a40056087746d28d068b381dc3b42b42efa8896"
    },
    {
      "path": "docs/public/images/image-filters",
      "mode": "040000",
      "type": "tree",
      "sha": "f9e6192bb56fd8fd0b298c866a8251b628b70322",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/f9e6192bb56fd8fd0b298c866a8251b628b70322"
    },
    {
      "path": "docs/public/images/image-filters/001.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "ae54d3424fade9f8c900fbc2d6c76b42d42b0f81",
      "size": 270190,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ae54d3424fade9f8c900fbc2d6c76b42d42b0f81"
    },
    {
      "path": "docs/public/images/image-filters/0010.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "10cd0cea9b0f342dcf514ee6f02c001953c324ed",
      "size": 28102,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/10cd0cea9b0f342dcf514ee6f02c001953c324ed"
    },
    {
      "path": "docs/public/images/image-filters/0011.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "e395bb5d827df54ede40e4e1a6f24d064faab5c8",
      "size": 23754,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e395bb5d827df54ede40e4e1a6f24d064faab5c8"
    },
    {
      "path": "docs/public/images/image-filters/0012.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "484a8a29a721a2ca597d6836307c619d89e9fe92",
      "size": 49366,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/484a8a29a721a2ca597d6836307c619d89e9fe92"
    },
    {
      "path": "docs/public/images/image-filters/0013.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "08699ee1298ca61a5c2c90b3d8a08d3dc47e467b",
      "size": 168440,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/08699ee1298ca61a5c2c90b3d8a08d3dc47e467b"
    },
    {
      "path": "docs/public/images/image-filters/0014.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "10a45595f8545d41f1a0532b012955968ca0e7ab",
      "size": 67138,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/10a45595f8545d41f1a0532b012955968ca0e7ab"
    },
    {
      "path": "docs/public/images/image-filters/0015.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "7969924c3e74f8e12fbea365e61df6dba0f528df",
      "size": 208316,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7969924c3e74f8e12fbea365e61df6dba0f528df"
    },
    {
      "path": "docs/public/images/image-filters/0016.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "b0caced711c715323bf18905017148325225d811",
      "size": 58810,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b0caced711c715323bf18905017148325225d811"
    },
    {
      "path": "docs/public/images/image-filters/0017.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "a54fcb4b76f0128ada1e23ee42d726873efa5d0d",
      "size": 61052,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/a54fcb4b76f0128ada1e23ee42d726873efa5d0d"
    },
    {
      "path": "docs/public/images/image-filters/0018.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "428a9fb905e10e70db6302a441aaf79d6d14850a",
      "size": 56434,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/428a9fb905e10e70db6302a441aaf79d6d14850a"
    },
    {
      "path": "docs/public/images/image-filters/0019.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "27083b83c662da72ca0395b92d9c3017f6c85a2f",
      "size": 4932,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/27083b83c662da72ca0395b92d9c3017f6c85a2f"
    },
    {
      "path": "docs/public/images/image-filters/002.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "60868ef7a3f82e7e9f9af518a9ae885181202fd8",
      "size": 40728,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/60868ef7a3f82e7e9f9af518a9ae885181202fd8"
    },
    {
      "path": "docs/public/images/image-filters/003.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "8277a280d2934ccb602b0d45d2d21e1ac013a5b4",
      "size": 68996,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8277a280d2934ccb602b0d45d2d21e1ac013a5b4"
    },
    {
      "path": "docs/public/images/image-filters/004.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "dc75fcbfd6d9f77749b39b4c96f228a601c7f032",
      "size": 162140,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/dc75fcbfd6d9f77749b39b4c96f228a601c7f032"
    },
    {
      "path": "docs/public/images/image-filters/005.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "dcedd18d4605b9071153e36d853416cafab02973",
      "size": 121220,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/dcedd18d4605b9071153e36d853416cafab02973"
    },
    {
      "path": "docs/public/images/image-filters/006.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "f26789d095502d376190a59af9853b2a4e6d2a55",
      "size": 235920,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f26789d095502d376190a59af9853b2a4e6d2a55"
    },
    {
      "path": "docs/public/images/image-filters/007.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "47aeee8b9b644418eeb4d54eec2565dcf4a1da55",
      "size": 196514,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/47aeee8b9b644418eeb4d54eec2565dcf4a1da55"
    },
    {
      "path": "docs/public/images/image-filters/008.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "4da4e657d2f1add078d62f8b88296fceca1b69ea",
      "size": 103476,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4da4e657d2f1add078d62f8b88296fceca1b69ea"
    },
    {
      "path": "docs/public/images/image-filters/009.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "02fc6f012cdbeb6a152dd72e43313357f5916571",
      "size": 174282,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/02fc6f012cdbeb6a152dd72e43313357f5916571"
    },
    {
      "path": "docs/public/images/logos",
      "mode": "040000",
      "type": "tree",
      "sha": "60234e6e41e611f3d56c0037b7ba8b90325177ad",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/60234e6e41e611f3d56c0037b7ba8b90325177ad"
    },
    {
      "path": "docs/public/images/logos/apple.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "ea852732e5a7c7a203b42b376e8a4924ce3d47be",
      "size": 697,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ea852732e5a7c7a203b42b376e8a4924ce3d47be"
    },
    {
      "path": "docs/public/images/logos/brave.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "6b8e23a12b2977242501c6f417d330fe33802a9b",
      "size": 3444,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6b8e23a12b2977242501c6f417d330fe33802a9b"
    },
    {
      "path": "docs/public/images/logos/capy.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "1b50b075a712b431a720a93d6a2b0fd53ecc219b",
      "size": 1699,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1b50b075a712b431a720a93d6a2b0fd53ecc219b"
    },
    {
      "path": "docs/public/images/logos/chanel.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "c85fe265088229ce8fb6972995bfd53867c41381",
      "size": 1961,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c85fe265088229ce8fb6972995bfd53867c41381"
    },
    {
      "path": "docs/public/images/logos/cibc.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "fd2ffe9610b75078de29a008790984b5be5a3957",
      "size": 2030,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/fd2ffe9610b75078de29a008790984b5be5a3957"
    },
    {
      "path": "docs/public/images/logos/cloudflare.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "1dbaf089610c61f7d711374c25489696d58293bb",
      "size": 1379,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1dbaf089610c61f7d711374c25489696d58293bb"
    },
    {
      "path": "docs/public/images/logos/contra.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "818a4d6d508fde49dc99f65dc71ebeb7d688a017",
      "size": 1765,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/818a4d6d508fde49dc99f65dc71ebeb7d688a017"
    },
    {
      "path": "docs/public/images/logos/diamond.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "cace8a9794e1ced344ee6c0b60892f0f939989bc",
      "size": 167,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cace8a9794e1ced344ee6c0b60892f0f939989bc"
    },
    {
      "path": "docs/public/images/logos/discord.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "7f2233edd4182add39e5e26ec84aae13a8037c22",
      "size": 3018,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7f2233edd4182add39e5e26ec84aae13a8037c22"
    },
    {
      "path": "docs/public/images/logos/enterprise-rent.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "a8626286940a96b85dc83cb8dc0e27e5d60d927b",
      "size": 4531,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/a8626286940a96b85dc83cb8dc0e27e5d60d927b"
    },
    {
      "path": "docs/public/images/logos/inbound.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "6b195c0e8fd2a8f3e5b43eeb88fe6a6e86f665b7",
      "size": 915,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6b195c0e8fd2a8f3e5b43eeb88fe6a6e86f665b7"
    },
    {
      "path": "docs/public/images/logos/infinite.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "654e86432772dcd229964e8e84c8d5b9cae84790",
      "size": 1884,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/654e86432772dcd229964e8e84c8d5b9cae84790"
    },
    {
      "path": "docs/public/images/logos/linear.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "f828c08d46a1509068b010f48dccb7c091a8c631",
      "size": 1054,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f828c08d46a1509068b010f48dccb7c091a8c631"
    },
    {
      "path": "docs/public/images/logos/mercury.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "5639357ce8a71f2cfa887f26c7feb7766b5164b6",
      "size": 11470,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/5639357ce8a71f2cfa887f26c7feb7766b5164b6"
    },
    {
      "path": "docs/public/images/logos/microsoft.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "7a3eaf1d32685396038abeba2c65cdcd47510f92",
      "size": 4717,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7a3eaf1d32685396038abeba2c65cdcd47510f92"
    },
    {
      "path": "docs/public/images/logos/mymind.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "a102c9decf1e034a2495d3225203b1d28e67d6ef",
      "size": 1683,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/a102c9decf1e034a2495d3225203b1d28e67d6ef"
    },
    {
      "path": "docs/public/images/logos/nasa.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "e9d47171ca3d5c19880ee638e72f028a402382dc",
      "size": 2426,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e9d47171ca3d5c19880ee638e72f028a402382dc"
    },
    {
      "path": "docs/public/images/logos/netflix.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "e2736b8383b9e11f94b76d44f80d16c58222c625",
      "size": 1054,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e2736b8383b9e11f94b76d44f80d16c58222c625"
    },
    {
      "path": "docs/public/images/logos/nike.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "7021e581a9fd2eb4a2550aee74cefbccf116d717",
      "size": 609,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7021e581a9fd2eb4a2550aee74cefbccf116d717"
    },
    {
      "path": "docs/public/images/logos/paper-logo-only.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "cf4e31380f39617f44a4db8248d310caefd93262",
      "size": 397,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cf4e31380f39617f44a4db8248d310caefd93262"
    },
    {
      "path": "docs/public/images/logos/paper.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "892f3994b7feef947f3800ca906765001392cab8",
      "size": 2251,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/892f3994b7feef947f3800ca906765001392cab8"
    },
    {
      "path": "docs/public/images/logos/paradigm.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "9191b0bb6965ae3b9edb992e5304609530d00956",
      "size": 756,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9191b0bb6965ae3b9edb992e5304609530d00956"
    },
    {
      "path": "docs/public/images/logos/resend.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "ed9960bf503413edd2c9c0e3e856ceafbd33cd2f",
      "size": 548,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ed9960bf503413edd2c9c0e3e856ceafbd33cd2f"
    },
    {
      "path": "docs/public/images/logos/shopify.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "443af96d15c1645d280096c693b2e0370a6e332a",
      "size": 1479,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/443af96d15c1645d280096c693b2e0370a6e332a"
    },
    {
      "path": "docs/public/images/logos/vercel.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "6d5e695e417495d9ada9d39fd0cadfe2f5856690",
      "size": 159,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6d5e695e417495d9ada9d39fd0cadfe2f5856690"
    },
    {
      "path": "docs/public/images/logos/volkswagen.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "4ff393b3c118b7b566b86b5725af21309f3f02bc",
      "size": 1736,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4ff393b3c118b7b566b86b5725af21309f3f02bc"
    },
    {
      "path": "docs/public/images/logos/wealth-simple.svg",
      "mode": "100644",
      "type": "blob",
      "sha": "1108cc22ab0bb576aa5a4a1bbdbb5ef22003f73e",
      "size": 1499,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1108cc22ab0bb576aa5a4a1bbdbb5ef22003f73e"
    },
    {
      "path": "docs/public/images/opengraph-image.jpg",
      "mode": "100644",
      "type": "blob",
      "sha": "225bea3288e539e3b96a3e819e987380bf779a85",
      "size": 230673,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/225bea3288e539e3b96a3e819e987380bf779a85"
    },
    {
      "path": "docs/public/logo-placeholder.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "4557670da9edb806b707285d918b281b6d029649",
      "size": 66,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4557670da9edb806b707285d918b281b6d029649"
    },
    {
      "path": "docs/public/robots.txt",
      "mode": "100644",
      "type": "blob",
      "sha": "e9bf57af6ad2b87e74102f02a4a38b447d45e7ed",
      "size": 47,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e9bf57af6ad2b87e74102f02a4a38b447d45e7ed"
    },
    {
      "path": "docs/public/shaders",
      "mode": "040000",
      "type": "tree",
      "sha": "79137b77877a284dea4807409b6d188339e0a240",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/79137b77877a284dea4807409b6d188339e0a240"
    },
    {
      "path": "docs/public/shaders/color-panels.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "589179a9787dbd55b76311d18cd4cf4cd6770556",
      "size": 15180,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/589179a9787dbd55b76311d18cd4cf4cd6770556"
    },
    {
      "path": "docs/public/shaders/dithering.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "2029832c865c54ae94f8b19c7305102d6139fa55",
      "size": 2852,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/2029832c865c54ae94f8b19c7305102d6139fa55"
    },
    {
      "path": "docs/public/shaders/dot-grid.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "d7662117cee154d96cf538e88f83512f92c88209",
      "size": 2256,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/d7662117cee154d96cf538e88f83512f92c88209"
    },
    {
      "path": "docs/public/shaders/dot-orbit.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "c518413d3229fb783d86219d24b7f959a73deab8",
      "size": 82886,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c518413d3229fb783d86219d24b7f959a73deab8"
    },
    {
      "path": "docs/public/shaders/fluted-glass.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "6b4d74135061683af81a6fc4c1b65bbcd089ad92",
      "size": 50266,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6b4d74135061683af81a6fc4c1b65bbcd089ad92"
    },
    {
      "path": "docs/public/shaders/gem-smoke.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "9b39b4a38c2c44feceac2a447902c630e3096dfb",
      "size": 14854,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9b39b4a38c2c44feceac2a447902c630e3096dfb"
    },
    {
      "path": "docs/public/shaders/god-rays.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "f371e0832a19545955fa19bedcd67b096052b7fe",
      "size": 48534,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f371e0832a19545955fa19bedcd67b096052b7fe"
    },
    {
      "path": "docs/public/shaders/grain-gradient.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "ddd6927539f4b82e16e534676fe3b13390aaa997",
      "size": 163002,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ddd6927539f4b82e16e534676fe3b13390aaa997"
    },
    {
      "path": "docs/public/shaders/halftone-cmyk.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "9df3f9be6edbcf800fb5f441c1e7c0b73665310f",
      "size": 159496,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9df3f9be6edbcf800fb5f441c1e7c0b73665310f"
    },
    {
      "path": "docs/public/shaders/halftone-dots.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "e1c278d1673da14b81e46b19b2d0c3928f73df7a",
      "size": 95090,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e1c278d1673da14b81e46b19b2d0c3928f73df7a"
    },
    {
      "path": "docs/public/shaders/heatmap.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "7cb005ac865579ae2bc6cbc4563c5fad0cd3831f",
      "size": 80042,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7cb005ac865579ae2bc6cbc4563c5fad0cd3831f"
    },
    {
      "path": "docs/public/shaders/image-dithering.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "dbf1c98b1d2c6ecfdd1c86c672d1110fda851bba",
      "size": 3234,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/dbf1c98b1d2c6ecfdd1c86c672d1110fda851bba"
    },
    {
      "path": "docs/public/shaders/liquid-metal.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "2e40689acb2f78ec78154f640e0b1082590b43fd",
      "size": 14264,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/2e40689acb2f78ec78154f640e0b1082590b43fd"
    },
    {
      "path": "docs/public/shaders/mesh-gradient.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "66bc6ba6b2b457f702f6a7a8a366f4d2c954472e",
      "size": 17056,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/66bc6ba6b2b457f702f6a7a8a366f4d2c954472e"
    },
    {
      "path": "docs/public/shaders/metaballs.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "059488b0a6b1479f0c11abcda5c84f9aab27831d",
      "size": 12012,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/059488b0a6b1479f0c11abcda5c84f9aab27831d"
    },
    {
      "path": "docs/public/shaders/neuro-noise.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "cd5dad3df5d0766213935934269f460a96df1937",
      "size": 31348,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cd5dad3df5d0766213935934269f460a96df1937"
    },
    {
      "path": "docs/public/shaders/paper-texture.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "4efbda265562fe6c7f0f23590b4dab49291d4113",
      "size": 87918,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4efbda265562fe6c7f0f23590b4dab49291d4113"
    },
    {
      "path": "docs/public/shaders/perlin-noise.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "bda100bb9c175e567e22705d1de27abc512fdc2b",
      "size": 43910,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/bda100bb9c175e567e22705d1de27abc512fdc2b"
    },
    {
      "path": "docs/public/shaders/pulsing-border.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "fca74b73c3b5fb615e4731af95aceaa64959d2c8",
      "size": 8842,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/fca74b73c3b5fb615e4731af95aceaa64959d2c8"
    },
    {
      "path": "docs/public/shaders/simplex-noise.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "5b5cff51e48d5fa8de12d260b34cc0472c79f297",
      "size": 33092,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/5b5cff51e48d5fa8de12d260b34cc0472c79f297"
    },
    {
      "path": "docs/public/shaders/smoke-ring.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "8af7f7d0776a4e1432d950263672bdd1a1d03545",
      "size": 52256,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8af7f7d0776a4e1432d950263672bdd1a1d03545"
    },
    {
      "path": "docs/public/shaders/spiral.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "723053a6ef16d85335e9d07ed23360323692d06b",
      "size": 45104,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/723053a6ef16d85335e9d07ed23360323692d06b"
    },
    {
      "path": "docs/public/shaders/static-mesh-gradient.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "b1bf02b7334616e5bc3911d96b76eab0e144afe7",
      "size": 19436,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b1bf02b7334616e5bc3911d96b76eab0e144afe7"
    },
    {
      "path": "docs/public/shaders/static-radial-gradient.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "0c15a08d528371321e8d1a9fc39a7270a0ee1c7c",
      "size": 9894,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/0c15a08d528371321e8d1a9fc39a7270a0ee1c7c"
    },
    {
      "path": "docs/public/shaders/swirl.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "9028548160420cd511a88b310481ad7acfc4dbcb",
      "size": 35092,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9028548160420cd511a88b310481ad7acfc4dbcb"
    },
    {
      "path": "docs/public/shaders/voronoi.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "c6adb20787b8563c0b0b3e12e86b2e24b2a1666a",
      "size": 93310,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c6adb20787b8563c0b0b3e12e86b2e24b2a1666a"
    },
    {
      "path": "docs/public/shaders/warp.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "4ac3edef44a15222d27527c41dd25d78f1a58aee",
      "size": 45854,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4ac3edef44a15222d27527c41dd25d78f1a58aee"
    },
    {
      "path": "docs/public/shaders/water.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "4411b1e6d9d01305ed0c589e156d15a1c4daf541",
      "size": 64448,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4411b1e6d9d01305ed0c589e156d15a1c4daf541"
    },
    {
      "path": "docs/public/shaders/waves.webp",
      "mode": "100644",
      "type": "blob",
      "sha": "e9c55bdc2702ec924cfac9e667c5ecdde2f8abae",
      "size": 7002,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e9c55bdc2702ec924cfac9e667c5ecdde2f8abae"
    },
    {
      "path": "docs/registry.json",
      "mode": "100644",
      "type": "blob",
      "sha": "27a75da8910a36b7c58d8ac3778d0a3065f15347",
      "size": 9142,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/27a75da8910a36b7c58d8ac3778d0a3065f15347"
    },
    {
      "path": "docs/registry",
      "mode": "040000",
      "type": "tree",
      "sha": "ac458b01fd4f9957acefd9a30f990ae200e23bde",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/ac458b01fd4f9957acefd9a30f990ae200e23bde"
    },
    {
      "path": "docs/registry/color-panels-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "264a52b6612262b3f964c1148166c7625e1a958e",
      "size": 262,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/264a52b6612262b3f964c1148166c7625e1a958e"
    },
    {
      "path": "docs/registry/dithering-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "6c77cc38b5f7ee360e41a6eb3bde92b5d3e8fc6f",
      "size": 245,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6c77cc38b5f7ee360e41a6eb3bde92b5d3e8fc6f"
    },
    {
      "path": "docs/registry/dot-grid-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "1d9256e91872828e0765e8db4457d66091c4c95d",
      "size": 225,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1d9256e91872828e0765e8db4457d66091c4c95d"
    },
    {
      "path": "docs/registry/dot-orbit-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "e1414d62781a6a54ec1bc5c149e6410c498368b7",
      "size": 230,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e1414d62781a6a54ec1bc5c149e6410c498368b7"
    },
    {
      "path": "docs/registry/fluted-glass-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "2f1138ec5f5d681b5e5b1d3b9bb953ef4b4cad5a",
      "size": 240,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/2f1138ec5f5d681b5e5b1d3b9bb953ef4b4cad5a"
    },
    {
      "path": "docs/registry/gem-smoke-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "9fb5130a51641467c7a4a967803e5b99a79695d1",
      "size": 230,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9fb5130a51641467c7a4a967803e5b99a79695d1"
    },
    {
      "path": "docs/registry/god-rays-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "c8f0ade35655c3d56f3b7272e6555cf2d48345a0",
      "size": 220,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c8f0ade35655c3d56f3b7272e6555cf2d48345a0"
    },
    {
      "path": "docs/registry/grain-gradient-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "324e98b811f81c17c74830c313fa825ecf03e321",
      "size": 265,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/324e98b811f81c17c74830c313fa825ecf03e321"
    },
    {
      "path": "docs/registry/halftone-cmyk-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "ed5f1b52f54b37a8e7a2a8ffef35c4df914ec2f2",
      "size": 262,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ed5f1b52f54b37a8e7a2a8ffef35c4df914ec2f2"
    },
    {
      "path": "docs/registry/halftone-dots-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "f518a2227942c0b42ea9d686fe20c8426c021f2a",
      "size": 260,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f518a2227942c0b42ea9d686fe20c8426c021f2a"
    },
    {
      "path": "docs/registry/heatmap-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "cf0de3c182b00d01195115d06b7236b6ae162d0a",
      "size": 235,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cf0de3c182b00d01195115d06b7236b6ae162d0a"
    },
    {
      "path": "docs/registry/image-dithering-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "e03bc79b5ed2d26e5b904694d7c2a1e3731b83cb",
      "size": 255,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e03bc79b5ed2d26e5b904694d7c2a1e3731b83cb"
    },
    {
      "path": "docs/registry/liquid-metal-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "1a9496c38a860cea8b0a821ca524aea65aef22e5",
      "size": 240,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1a9496c38a860cea8b0a821ca524aea65aef22e5"
    },
    {
      "path": "docs/registry/mesh-gradient-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "4aa99b915dea748d5394c7d49805cc18955c85c0",
      "size": 245,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4aa99b915dea748d5394c7d49805cc18955c85c0"
    },
    {
      "path": "docs/registry/metaballs-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "0989d6cdc872539d4b22a6acd1242dd129d3ed95",
      "size": 230,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/0989d6cdc872539d4b22a6acd1242dd129d3ed95"
    },
    {
      "path": "docs/registry/neuro-noise-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "b1a0b8cd1469e1126ee235a1be1e309faf433b42",
      "size": 240,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b1a0b8cd1469e1126ee235a1be1e309faf433b42"
    },
    {
      "path": "docs/registry/paper-texture-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "4f8005c8de19d7ec90f820f702e73a693b793a68",
      "size": 250,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4f8005c8de19d7ec90f820f702e73a693b793a68"
    },
    {
      "path": "docs/registry/perlin-noise-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "b78d0ecce3fae9412a6b2f992bb7c46aca4767ec",
      "size": 240,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b78d0ecce3fae9412a6b2f992bb7c46aca4767ec"
    },
    {
      "path": "docs/registry/pulsing-border-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "a0c129f9dd641b5e9aed7c6582fcce86721b6159",
      "size": 250,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/a0c129f9dd641b5e9aed7c6582fcce86721b6159"
    },
    {
      "path": "docs/registry/simplex-noise-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "95cab637244ce965934b147eb2ba3a0acdaaf53d",
      "size": 245,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/95cab637244ce965934b147eb2ba3a0acdaaf53d"
    },
    {
      "path": "docs/registry/smoke-ring-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "9a936ec74d474e8001afd3782880c73fcacd059d",
      "size": 230,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9a936ec74d474e8001afd3782880c73fcacd059d"
    },
    {
      "path": "docs/registry/spiral-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "ff8f07cc066a3a8a9a8985c5e8b1ae43f018596c",
      "size": 215,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ff8f07cc066a3a8a9a8985c5e8b1ae43f018596c"
    },
    {
      "path": "docs/registry/static-mesh-gradient-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "097e40aa1ae6a72ab053c245675bbe3d4e29090a",
      "size": 275,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/097e40aa1ae6a72ab053c245675bbe3d4e29090a"
    },
    {
      "path": "docs/registry/static-radial-gradient-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "d1e47f91ceeab2467942fafd54eeb84b5aba593a",
      "size": 285,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/d1e47f91ceeab2467942fafd54eeb84b5aba593a"
    },
    {
      "path": "docs/registry/swirl-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "814303f905b899d54f99d3d5c60155689f4dbb14",
      "size": 210,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/814303f905b899d54f99d3d5c60155689f4dbb14"
    },
    {
      "path": "docs/registry/voronoi-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "ba67f78b515abaa7510f2a44c06a043e3d218d25",
      "size": 220,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ba67f78b515abaa7510f2a44c06a043e3d218d25"
    },
    {
      "path": "docs/registry/warp-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "4db6ccfc231353e1f32007f417254eb976a86f92",
      "size": 205,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/4db6ccfc231353e1f32007f417254eb976a86f92"
    },
    {
      "path": "docs/registry/water-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "8bb75f82bf71a0a158ff269dfef08587743c8a5b",
      "size": 210,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8bb75f82bf71a0a158ff269dfef08587743c8a5b"
    },
    {
      "path": "docs/registry/waves-example.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "c9e8833b180ebbfc869d054afc304e77037db321",
      "size": 210,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c9e8833b180ebbfc869d054afc304e77037db321"
    },
    {
      "path": "docs/src",
      "mode": "040000",
      "type": "tree",
      "sha": "bb0a6d4fb5c6175ae767b9a047d00e64950a7ad4",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/bb0a6d4fb5c6175ae767b9a047d00e64950a7ad4"
    },
    {
      "path": "docs/src/app",
      "mode": "040000",
      "type": "tree",
      "sha": "fd6b3da77e64ed88892508e9e2069496929d3795",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/fd6b3da77e64ed88892508e9e2069496929d3795"
    },
    {
      "path": "docs/src/app/(shaders)",
      "mode": "040000",
      "type": "tree",
      "sha": "92d83f92a93cfbfbf802a7c45412101ff06f0ea9",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/92d83f92a93cfbfbf802a7c45412101ff06f0ea9"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-colorspace",
      "mode": "040000",
      "type": "tree",
      "sha": "8fff52870ca9f3cae66748218538e60e38146ad0",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/8fff52870ca9f3cae66748218538e60e38146ad0"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-colorspace/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "f4d2436307e81595eb60f119697768777e2f40f7",
      "size": 198,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f4d2436307e81595eb60f119697768777e2f40f7"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-colorspace/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "b48438c7f036438ee19f3bb248e5d96b128efe24",
      "size": 7728,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b48438c7f036438ee19f3bb248e5d96b128efe24"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-softness",
      "mode": "040000",
      "type": "tree",
      "sha": "827f491616f807902d5b5fe21d4d0d9f2079edff",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/827f491616f807902d5b5fe21d4d0d9f2079edff"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-softness/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "f4d2436307e81595eb60f119697768777e2f40f7",
      "size": 198,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f4d2436307e81595eb60f119697768777e2f40f7"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-softness/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "bced51de3898271ad05485af48a009bcce7d7edb",
      "size": 6611,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/bced51de3898271ad05485af48a009bcce7d7edb"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-steps",
      "mode": "040000",
      "type": "tree",
      "sha": "c504f6b11a9361552d065d9c7dbea7f21c0e7016",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/c504f6b11a9361552d065d9c7dbea7f21c0e7016"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-steps/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "f4d2436307e81595eb60f119697768777e2f40f7",
      "size": 198,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f4d2436307e81595eb60f119697768777e2f40f7"
    },
    {
      "path": "docs/src/app/(shaders)/color-demo-steps/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "f0aff7f7f4591bc138c785bff7df809c71b6126b",
      "size": 5948,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f0aff7f7f4591bc138c785bff7df809c71b6126b"
    },
    {
      "path": "docs/src/app/(shaders)/color-panels",
      "mode": "040000",
      "type": "tree",
      "sha": "a61a3f327af1ac14a75624cb3ed278cb21c6ae24",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/a61a3f327af1ac14a75624cb3ed278cb21c6ae24"
    },
    {
      "path": "docs/src/app/(shaders)/color-panels/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "64cfc5f8fb1cdc640df12f08da76678a00e91d5f",
      "size": 222,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/64cfc5f8fb1cdc640df12f08da76678a00e91d5f"
    },
    {
      "path": "docs/src/app/(shaders)/color-panels/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "2ff4e5513fdd2dfedbb0657f33f49fcfb5d7df32",
      "size": 3289,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/2ff4e5513fdd2dfedbb0657f33f49fcfb5d7df32"
    },
    {
      "path": "docs/src/app/(shaders)/dithering",
      "mode": "040000",
      "type": "tree",
      "sha": "37ac0367b48e08350de69b8869054f7d832cbd3a",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/37ac0367b48e08350de69b8869054f7d832cbd3a"
    },
    {
      "path": "docs/src/app/(shaders)/dithering/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "7fc5cc8ae9c94c2a820cd9bc6218db548b752fd0",
      "size": 219,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7fc5cc8ae9c94c2a820cd9bc6218db548b752fd0"
    },
    {
      "path": "docs/src/app/(shaders)/dithering/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "e53b236f639187713beabaff4bd4b42805dc4684",
      "size": 2622,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e53b236f639187713beabaff4bd4b42805dc4684"
    },
    {
      "path": "docs/src/app/(shaders)/dot-grid",
      "mode": "040000",
      "type": "tree",
      "sha": "7e1aa8b1b3598add4ec4fc6013cb4864cdd62984",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/7e1aa8b1b3598add4ec4fc6013cb4864cdd62984"
    },
    {
      "path": "docs/src/app/(shaders)/dot-grid/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "d6a461d42903d7b46c3ab1ed4439bd7c75a6933b",
      "size": 218,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/d6a461d42903d7b46c3ab1ed4439bd7c75a6933b"
    },
    {
      "path": "docs/src/app/(shaders)/dot-grid/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "23a0f01f8fb224cbc42ccb9a5aec824573ac0857",
      "size": 2688,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/23a0f01f8fb224cbc42ccb9a5aec824573ac0857"
    },
    {
      "path": "docs/src/app/(shaders)/dot-orbit",
      "mode": "040000",
      "type": "tree",
      "sha": "e2a4c71d6749fed9dc09feac6b11da197129614e",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/e2a4c71d6749fed9dc09feac6b11da197129614e"
    },
    {
      "path": "docs/src/app/(shaders)/dot-orbit/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "b6cfa5ffd0ebf9eda3ecc1ce36974866a74900cc",
      "size": 219,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b6cfa5ffd0ebf9eda3ecc1ce36974866a74900cc"
    },
    {
      "path": "docs/src/app/(shaders)/dot-orbit/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "d0a2855d85995bd56c29c68fd23b7c9eeb4f7925",
      "size": 2934,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/d0a2855d85995bd56c29c68fd23b7c9eeb4f7925"
    },
    {
      "path": "docs/src/app/(shaders)/fluted-glass",
      "mode": "040000",
      "type": "tree",
      "sha": "20e7276291206352af7adf5687d74ec91a3516de",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/20e7276291206352af7adf5687d74ec91a3516de"
    },
    {
      "path": "docs/src/app/(shaders)/fluted-glass/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "328dd24180e7881c8be1b8d3424c5ce377c84247",
      "size": 222,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/328dd24180e7881c8be1b8d3424c5ce377c84247"
    },
    {
      "path": "docs/src/app/(shaders)/fluted-glass/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "1852fa7b8cfe6c39737ee0be90251f83bc7665f7",
      "size": 5449,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/1852fa7b8cfe6c39737ee0be90251f83bc7665f7"
    },
    {
      "path": "docs/src/app/(shaders)/gem-smoke",
      "mode": "040000",
      "type": "tree",
      "sha": "018c8ed4ad28f5ac652461b2d4dd57fc69e9422f",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/018c8ed4ad28f5ac652461b2d4dd57fc69e9422f"
    },
    {
      "path": "docs/src/app/(shaders)/gem-smoke/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "c66437c464822dc31505a2f3476b0d7e6815c36a",
      "size": 224,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c66437c464822dc31505a2f3476b0d7e6815c36a"
    },
    {
      "path": "docs/src/app/(shaders)/gem-smoke/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "7312f38e6c05df0a07508ab703e852e257655f3d",
      "size": 5072,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7312f38e6c05df0a07508ab703e852e257655f3d"
    },
    {
      "path": "docs/src/app/(shaders)/god-rays",
      "mode": "040000",
      "type": "tree",
      "sha": "87bfef1ec9c4d4a1f986301d566e0c09f2b76f36",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/87bfef1ec9c4d4a1f986301d566e0c09f2b76f36"
    },
    {
      "path": "docs/src/app/(shaders)/god-rays/layout.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "54ddd673adba5b4c3972fa07a29f9922b69963b5",
      "size": 217,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/54ddd673adba5b4c3972fa07a29f9922b69963b5"
    },
    {
      "path": "docs/src/app/(shaders)/god-rays/page.tsx",
      "mode": "100644",
      "type": "blob",
      "sha": "219ed2f66a0d7ed556f16ffea5623a3035fc5e9b",
      "size": 3115,
      "url": "https://api.github.com/repos/paper-design/shaders/git/blobs/219ed2f66a0d7ed556f16ffea5623a3035fc5e9b"
    },
    {
      "path": "docs/src/app/(shaders)/grain-gradient",
      "mode": "040000",
      "type": "tree",
      "sha": "f877ed2af29259ba3b059c2b481cb1d241238a74",
      "url": "https://api.github.com/repos/paper-design/shaders/git/trees/f877ed2af29259ba3b059c2b481cb1d241238a74"
    },
    {

...71205 bytes truncated...

The tool call succeeded but the output was truncated. Full output saved to: /Users/tjnickerson/.local/share/opencode/tool-output/tool_debc2f932001zZM1DDe7t2dq55
Use the Task tool to have explore agent process this file with Grep and Read (with offset/limit). Do NOT read the full file yourself - delegate to save context.
```

---

## Assistant (Plan · GPT-5.5 · 3.8s)

**Tool: webfetch**

**Input:**

```json
{
  "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src?ref=main",
  "format": "text",
  "timeout": 30
}
```

**Output:**

```
[
  {
    "name": "empty-pixel.ts",
    "path": "packages/shaders/src/empty-pixel.ts",
    "sha": "8c59e742e6a34045601174faa590b24e52054bd5",
    "size": 104,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/empty-pixel.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/empty-pixel.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8c59e742e6a34045601174faa590b24e52054bd5",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/empty-pixel.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/empty-pixel.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/8c59e742e6a34045601174faa590b24e52054bd5",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/empty-pixel.ts"
    }
  },
  {
    "name": "get-shader-color-from-string.test.ts",
    "path": "packages/shaders/src/get-shader-color-from-string.test.ts",
    "sha": "2443816b3cb3ac6d907b33098f30d6d482b548ae",
    "size": 2297,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-color-from-string.test.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-color-from-string.test.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/2443816b3cb3ac6d907b33098f30d6d482b548ae",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/get-shader-color-from-string.test.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-color-from-string.test.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/2443816b3cb3ac6d907b33098f30d6d482b548ae",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-color-from-string.test.ts"
    }
  },
  {
    "name": "get-shader-color-from-string.ts",
    "path": "packages/shaders/src/get-shader-color-from-string.ts",
    "sha": "aa9d3fe8b87725802d803dc9f80dfbf08c757607",
    "size": 3837,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-color-from-string.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-color-from-string.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/aa9d3fe8b87725802d803dc9f80dfbf08c757607",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/get-shader-color-from-string.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-color-from-string.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/aa9d3fe8b87725802d803dc9f80dfbf08c757607",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-color-from-string.ts"
    }
  },
  {
    "name": "get-shader-noise-texture.ts",
    "path": "packages/shaders/src/get-shader-noise-texture.ts",
    "sha": "cd849379e974b11868ce1e61d4c707d27c799ece",
    "size": 23473,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-noise-texture.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-noise-texture.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/cd849379e974b11868ce1e61d4c707d27c799ece",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/get-shader-noise-texture.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/get-shader-noise-texture.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/cd849379e974b11868ce1e61d4c707d27c799ece",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/get-shader-noise-texture.ts"
    }
  },
  {
    "name": "index.ts",
    "path": "packages/shaders/src/index.ts",
    "sha": "438e1e5b178909ac231ce9eb51d7199a799e468e",
    "size": 8884,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/index.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/index.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/438e1e5b178909ac231ce9eb51d7199a799e468e",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/index.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/index.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/438e1e5b178909ac231ce9eb51d7199a799e468e",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/index.ts"
    }
  },
  {
    "name": "shader-color-spaces.ts",
    "path": "packages/shaders/src/shader-color-spaces.ts",
    "sha": "557a37523034a8bad6b5c74d535062960302af0a",
    "size": 2443,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-color-spaces.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-color-spaces.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/557a37523034a8bad6b5c74d535062960302af0a",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-color-spaces.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-color-spaces.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/557a37523034a8bad6b5c74d535062960302af0a",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-color-spaces.ts"
    }
  },
  {
    "name": "shader-mount.ts",
    "path": "packages/shaders/src/shader-mount.ts",
    "sha": "b7c1183dfda8515d19f59e086ec2dd6d6379420a",
    "size": 30765,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-mount.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-mount.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b7c1183dfda8515d19f59e086ec2dd6d6379420a",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-mount.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-mount.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/b7c1183dfda8515d19f59e086ec2dd6d6379420a",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-mount.ts"
    }
  },
  {
    "name": "shader-sizing.ts",
    "path": "packages/shaders/src/shader-sizing.ts",
    "sha": "776809357dc34af3523c7daf9bc1c8ac4cc5b9ba",
    "size": 1068,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-sizing.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-sizing.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/776809357dc34af3523c7daf9bc1c8ac4cc5b9ba",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-sizing.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-sizing.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/776809357dc34af3523c7daf9bc1c8ac4cc5b9ba",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-sizing.ts"
    }
  },
  {
    "name": "shader-utils.ts",
    "path": "packages/shaders/src/shader-utils.ts",
    "sha": "c816fc716a181e681a84d7aa90c1c1f04be11812",
    "size": 3456,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-utils.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-utils.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/c816fc716a181e681a84d7aa90c1c1f04be11812",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-utils.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shader-utils.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/c816fc716a181e681a84d7aa90c1c1f04be11812",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shader-utils.ts"
    }
  },
  {
    "name": "shaders",
    "path": "packages/shaders/src/shaders",
    "sha": "8564d226909263dc531a63e588a0042e6577e29b",
    "size": 0,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders?ref=main",
    "html_url": "https://github.com/paper-design/shaders/tree/main/packages/shaders/src/shaders",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/trees/8564d226909263dc531a63e588a0042e6577e29b",
    "download_url": null,
    "type": "dir",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/trees/8564d226909263dc531a63e588a0042e6577e29b",
      "html": "https://github.com/paper-design/shaders/tree/main/packages/shaders/src/shaders"
    }
  },
  {
    "name": "types.ts",
    "path": "packages/shaders/src/types.ts",
    "sha": "d675c51038a95e8273cc4ba0c1a977cb9e187f64",
    "size": 135,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/types.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/types.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/d675c51038a95e8273cc4ba0c1a977cb9e187f64",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/types.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/types.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/d675c51038a95e8273cc4ba0c1a977cb9e187f64",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/types.ts"
    }
  },
  {
    "name": "vertex-shader.ts",
    "path": "packages/shaders/src/vertex-shader.ts",
    "sha": "584a919af80a7bee835d034425e0fa09d246fc68",
    "size": 5131,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/vertex-shader.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/vertex-shader.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/584a919af80a7bee835d034425e0fa09d246fc68",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/vertex-shader.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/vertex-shader.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/584a919af80a7bee835d034425e0fa09d246fc68",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/vertex-shader.ts"
    }
  }
]

```

---

## Assistant (Plan · GPT-5.5 · 2.1s)

**Tool: webfetch**

**Input:**

```json
{
  "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders?ref=main",
  "format": "text",
  "timeout": 30
}
```

**Output:**

```
[
  {
    "name": "color-panels.ts",
    "path": "packages/shaders/src/shaders/color-panels.ts",
    "sha": "db765cfba085ca3297bdffb402c450494260215e",
    "size": 9231,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/color-panels.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/color-panels.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/db765cfba085ca3297bdffb402c450494260215e",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/color-panels.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/color-panels.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/db765cfba085ca3297bdffb402c450494260215e",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/color-panels.ts"
    }
  },
  {
    "name": "dithering.ts",
    "path": "packages/shaders/src/shaders/dithering.ts",
    "sha": "9c9707ab4fedcb960667ef85a295f9ce49c5a873",
    "size": 9668,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dithering.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dithering.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9c9707ab4fedcb960667ef85a295f9ce49c5a873",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/dithering.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dithering.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/9c9707ab4fedcb960667ef85a295f9ce49c5a873",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dithering.ts"
    }
  },
  {
    "name": "dot-grid.ts",
    "path": "packages/shaders/src/shaders/dot-grid.ts",
    "sha": "8a53183e7d2b93f713fbba6fb86c9f6e30689985",
    "size": 5468,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dot-grid.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dot-grid.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8a53183e7d2b93f713fbba6fb86c9f6e30689985",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/dot-grid.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dot-grid.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/8a53183e7d2b93f713fbba6fb86c9f6e30689985",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dot-grid.ts"
    }
  },
  {
    "name": "dot-orbit.ts",
    "path": "packages/shaders/src/shaders/dot-orbit.ts",
    "sha": "3b4053b7074552fe2356f2ab4460ec0a0bf278b9",
    "size": 5692,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dot-orbit.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dot-orbit.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/3b4053b7074552fe2356f2ab4460ec0a0bf278b9",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/dot-orbit.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/dot-orbit.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/3b4053b7074552fe2356f2ab4460ec0a0bf278b9",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/dot-orbit.ts"
    }
  },
  {
    "name": "fluted-glass.ts",
    "path": "packages/shaders/src/shaders/fluted-glass.ts",
    "sha": "695da1150ee867f6a4e33354c2794df9388dfd6a",
    "size": 15084,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/fluted-glass.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/fluted-glass.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/695da1150ee867f6a4e33354c2794df9388dfd6a",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/fluted-glass.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/fluted-glass.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/695da1150ee867f6a4e33354c2794df9388dfd6a",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/fluted-glass.ts"
    }
  },
  {
    "name": "gem-smoke.ts",
    "path": "packages/shaders/src/shaders/gem-smoke.ts",
    "sha": "56b5608a1e5097824226000834d3103dc8c63d02",
    "size": 27799,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/gem-smoke.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/gem-smoke.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/56b5608a1e5097824226000834d3103dc8c63d02",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/gem-smoke.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/gem-smoke.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/56b5608a1e5097824226000834d3103dc8c63d02",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/gem-smoke.ts"
    }
  },
  {
    "name": "god-rays.ts",
    "path": "packages/shaders/src/shaders/god-rays.ts",
    "sha": "828cc38c392e237b13fc5261e9c2fcd018c865ee",
    "size": 6617,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/god-rays.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/god-rays.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/828cc38c392e237b13fc5261e9c2fcd018c865ee",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/god-rays.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/god-rays.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/828cc38c392e237b13fc5261e9c2fcd018c865ee",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/god-rays.ts"
    }
  },
  {
    "name": "grain-gradient.ts",
    "path": "packages/shaders/src/shaders/grain-gradient.ts",
    "sha": "8d7ec57d639475d9e45ac0580a6e2670af95b469",
    "size": 12031,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/grain-gradient.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/grain-gradient.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8d7ec57d639475d9e45ac0580a6e2670af95b469",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/grain-gradient.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/grain-gradient.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/8d7ec57d639475d9e45ac0580a6e2670af95b469",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/grain-gradient.ts"
    }
  },
  {
    "name": "halftone-cmyk.ts",
    "path": "packages/shaders/src/shaders/halftone-cmyk.ts",
    "sha": "8d1bc4a0b67ebf267e49debd8e8e5cafb587b12e",
    "size": 14090,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/halftone-cmyk.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/halftone-cmyk.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/8d1bc4a0b67ebf267e49debd8e8e5cafb587b12e",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/halftone-cmyk.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/halftone-cmyk.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/8d1bc4a0b67ebf267e49debd8e8e5cafb587b12e",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/halftone-cmyk.ts"
    }
  },
  {
    "name": "halftone-dots.ts",
    "path": "packages/shaders/src/shaders/halftone-dots.ts",
    "sha": "b7c734565002606efa357252c63059f63f33e41e",
    "size": 11587,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/halftone-dots.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/halftone-dots.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b7c734565002606efa357252c63059f63f33e41e",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/halftone-dots.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/halftone-dots.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/b7c734565002606efa357252c63059f63f33e41e",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/halftone-dots.ts"
    }
  },
  {
    "name": "heatmap.ts",
    "path": "packages/shaders/src/shaders/heatmap.ts",
    "sha": "f2d2b955c2a8ffddd0f3eb9123952b8ae79e90db",
    "size": 15535,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/heatmap.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/heatmap.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/f2d2b955c2a8ffddd0f3eb9123952b8ae79e90db",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/heatmap.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/heatmap.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/f2d2b955c2a8ffddd0f3eb9123952b8ae79e90db",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/heatmap.ts"
    }
  },
  {
    "name": "image-dithering.ts",
    "path": "packages/shaders/src/shaders/image-dithering.ts",
    "sha": "3f789fe705f471334c4cc8cbf559eff010122290",
    "size": 8477,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/image-dithering.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/image-dithering.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/3f789fe705f471334c4cc8cbf559eff010122290",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/image-dithering.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/image-dithering.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/3f789fe705f471334c4cc8cbf559eff010122290",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/image-dithering.ts"
    }
  },
  {
    "name": "liquid-metal.ts",
    "path": "packages/shaders/src/shaders/liquid-metal.ts",
    "sha": "e392bcd4ae436ddd82e9a5bece197f882c159480",
    "size": 29940,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/liquid-metal.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/liquid-metal.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e392bcd4ae436ddd82e9a5bece197f882c159480",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/liquid-metal.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/liquid-metal.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/e392bcd4ae436ddd82e9a5bece197f882c159480",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/liquid-metal.ts"
    }
  },
  {
    "name": "mesh-gradient.ts",
    "path": "packages/shaders/src/shaders/mesh-gradient.ts",
    "sha": "5f2f3c259acaea3cc7af57a93865967c613ed4d5",
    "size": 5512,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/mesh-gradient.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/mesh-gradient.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/5f2f3c259acaea3cc7af57a93865967c613ed4d5",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/mesh-gradient.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/mesh-gradient.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/5f2f3c259acaea3cc7af57a93865967c613ed4d5",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/mesh-gradient.ts"
    }
  },
  {
    "name": "metaballs.ts",
    "path": "packages/shaders/src/shaders/metaballs.ts",
    "sha": "9bc328172a3c627be03adf2a0b6b0cd59503808c",
    "size": 4789,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/metaballs.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/metaballs.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/9bc328172a3c627be03adf2a0b6b0cd59503808c",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/metaballs.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/metaballs.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/9bc328172a3c627be03adf2a0b6b0cd59503808c",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/metaballs.ts"
    }
  },
  {
    "name": "neuro-noise.ts",
    "path": "packages/shaders/src/shaders/neuro-noise.ts",
    "sha": "030234f06b98e100bad8b37ea0e98c0c9300244a",
    "size": 4017,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/neuro-noise.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/neuro-noise.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/030234f06b98e100bad8b37ea0e98c0c9300244a",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/neuro-noise.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/neuro-noise.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/030234f06b98e100bad8b37ea0e98c0c9300244a",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/neuro-noise.ts"
    }
  },
  {
    "name": "paper-texture.ts",
    "path": "packages/shaders/src/shaders/paper-texture.ts",
    "sha": "83a6b252ae97d4cb0bbe94d8ef74ec20b5b3a79d",
    "size": 9961,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/paper-texture.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/paper-texture.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/83a6b252ae97d4cb0bbe94d8ef74ec20b5b3a79d",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/paper-texture.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/paper-texture.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/83a6b252ae97d4cb0bbe94d8ef74ec20b5b3a79d",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/paper-texture.ts"
    }
  },
  {
    "name": "perlin-noise.ts",
    "path": "packages/shaders/src/shaders/perlin-noise.ts",
    "sha": "56b8ab9c9bbcb1f644028e3a7f12cc554a659009",
    "size": 7261,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/perlin-noise.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/perlin-noise.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/56b8ab9c9bbcb1f644028e3a7f12cc554a659009",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/perlin-noise.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/perlin-noise.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/56b8ab9c9bbcb1f644028e3a7f12cc554a659009",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/perlin-noise.ts"
    }
  },
  {
    "name": "pulsing-border.ts",
    "path": "packages/shaders/src/shaders/pulsing-border.ts",
    "sha": "6367dffbb09b46afbc1a08fc9256537fa950dc8d",
    "size": 11516,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/pulsing-border.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/pulsing-border.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/6367dffbb09b46afbc1a08fc9256537fa950dc8d",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/pulsing-border.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/pulsing-border.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/6367dffbb09b46afbc1a08fc9256537fa950dc8d",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/pulsing-border.ts"
    }
  },
  {
    "name": "simplex-noise.ts",
    "path": "packages/shaders/src/shaders/simplex-noise.ts",
    "sha": "ebd593c1f32e60132b3467bb0f476bc008dd08d5",
    "size": 4454,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/simplex-noise.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/simplex-noise.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/ebd593c1f32e60132b3467bb0f476bc008dd08d5",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/simplex-noise.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/simplex-noise.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/ebd593c1f32e60132b3467bb0f476bc008dd08d5",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/simplex-noise.ts"
    }
  },
  {
    "name": "smoke-ring.ts",
    "path": "packages/shaders/src/shaders/smoke-ring.ts",
    "sha": "aa032b058eb27e8d8cfd9ed4f12ed9a72345454b",
    "size": 6119,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/smoke-ring.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/smoke-ring.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/aa032b058eb27e8d8cfd9ed4f12ed9a72345454b",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/smoke-ring.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/smoke-ring.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/aa032b058eb27e8d8cfd9ed4f12ed9a72345454b",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/smoke-ring.ts"
    }
  },
  {
    "name": "spiral.ts",
    "path": "packages/shaders/src/shaders/spiral.ts",
    "sha": "e212210da9319d13115597379563b366ac3bbedd",
    "size": 5092,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/spiral.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/spiral.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/e212210da9319d13115597379563b366ac3bbedd",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/spiral.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/spiral.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/e212210da9319d13115597379563b366ac3bbedd",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/spiral.ts"
    }
  },
  {
    "name": "static-mesh-gradient.ts",
    "path": "packages/shaders/src/shaders/static-mesh-gradient.ts",
    "sha": "adec223e7b3ab221df3b369357739102379cc51e",
    "size": 6159,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/static-mesh-gradient.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/static-mesh-gradient.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/adec223e7b3ab221df3b369357739102379cc51e",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/static-mesh-gradient.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/static-mesh-gradient.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/adec223e7b3ab221df3b369357739102379cc51e",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/static-mesh-gradient.ts"
    }
  },
  {
    "name": "static-radial-gradient.ts",
    "path": "packages/shaders/src/shaders/static-radial-gradient.ts",
    "sha": "434d6562bb74ec71bf2fa788b36b783dddde8802",
    "size": 8557,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/static-radial-gradient.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/static-radial-gradient.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/434d6562bb74ec71bf2fa788b36b783dddde8802",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/static-radial-gradient.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/static-radial-gradient.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/434d6562bb74ec71bf2fa788b36b783dddde8802",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/static-radial-gradient.ts"
    }
  },
  {
    "name": "swirl.ts",
    "path": "packages/shaders/src/shaders/swirl.ts",
    "sha": "a3d31f91f0e6d0b83dc8591b00bd74457b022d1a",
    "size": 5200,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/swirl.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/swirl.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/a3d31f91f0e6d0b83dc8591b00bd74457b022d1a",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/swirl.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/swirl.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/a3d31f91f0e6d0b83dc8591b00bd74457b022d1a",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/swirl.ts"
    }
  },
  {
    "name": "voronoi.ts",
    "path": "packages/shaders/src/shaders/voronoi.ts",
    "sha": "b159c53abc2ac0fef6846ef47b18e78f840e2812",
    "size": 6197,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/voronoi.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/voronoi.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/b159c53abc2ac0fef6846ef47b18e78f840e2812",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/voronoi.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/voronoi.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/b159c53abc2ac0fef6846ef47b18e78f840e2812",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/voronoi.ts"
    }
  },
  {
    "name": "warp.ts",
    "path": "packages/shaders/src/shaders/warp.ts",
    "sha": "95a0bfc9419d065849645993c9051c63268ebbc6",
    "size": 6528,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/warp.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/warp.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/95a0bfc9419d065849645993c9051c63268ebbc6",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/warp.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/warp.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/95a0bfc9419d065849645993c9051c63268ebbc6",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/warp.ts"
    }
  },
  {
    "name": "water.ts",
    "path": "packages/shaders/src/shaders/water.ts",
    "sha": "822075db8a7398476773131700e487d3109444af",
    "size": 5942,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/water.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/water.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/822075db8a7398476773131700e487d3109444af",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/water.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/water.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/822075db8a7398476773131700e487d3109444af",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/water.ts"
    }
  },
  {
    "name": "waves.ts",
    "path": "packages/shaders/src/shaders/waves.ts",
    "sha": "7ab1e48081764d6a64c01fa3fb015a508f7eb4d8",
    "size": 4208,
    "url": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/waves.ts?ref=main",
    "html_url": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/waves.ts",
    "git_url": "https://api.github.com/repos/paper-design/shaders/git/blobs/7ab1e48081764d6a64c01fa3fb015a508f7eb4d8",
    "download_url": "https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shaders/waves.ts",
    "type": "file",
    "_links": {
      "self": "https://api.github.com/repos/paper-design/shaders/contents/packages/shaders/src/shaders/waves.ts?ref=main",
      "git": "https://api.github.com/repos/paper-design/shaders/git/blobs/7ab1e48081764d6a64c01fa3fb015a508f7eb4d8",
      "html": "https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/waves.ts"
    }
  }
]

```

---

## Assistant (Plan · GPT-5.5 · 163.4s)

**Tool: task**

**Input:**

```json
{
  "description": "Audit upstream shaders",
  "prompt": "Read-only research task. Analyze https://github.com/paper-design/shaders, specifically packages/shaders/src/shaders and relevant docs/registry examples. Return a concise table of all shader modules, their exported component/name, public props/uniforms/defaults/presets visible in docs examples, and whether they require an input image/noise texture. Do not modify any local files.",
  "subagent_type": "general",
  "task_id": "",
  "command": ""
}
```

**Output:**

```
task_id: ses_2143cd22dffeAFBscmd6hSudeb (for resuming to continue this task if needed)

<task_result>
Certainly, Mr. Nickerson. No local files were modified.

Common inherited props/uniforms are omitted from each row for brevity: sizing `fit`, `scale`, `rotation`, `originX/Y`, `offsetX/Y`, `worldWidth/Height` map to `u_fit`, `u_scale`, `u_rotation`, `u_originX/Y`, `u_offsetX/Y`, `u_worldWidth/Height`; animated shaders also use `speed`, `frame`, and automatic `u_time`.

| Module | Exported component / core shader | Shader-specific public props and defaults | Shader-specific uniforms | Presets | Input image / noise texture |
|---|---|---|---|---|---|
| `color-panels` | `ColorPanels` / `colorPanelsFragmentShader` | `speed=.5`, `frame=0`, `colors=[7]`, `colorBack=#000`, `angle1=0`, `angle2=0`, `length=1.1`, `edges=false`, `blur=0`, `fadeIn=1`, `fadeOut=.3`, `gradient=0`, `density=3` | `u_colors`, `u_colorsCount`, `u_colorBack`, `u_angle1`, `u_angle2`, `u_length`, `u_edges`, `u_blur`, `u_fadeIn`, `u_fadeOut`, `u_density`, `u_gradient` | Default, Glass, Gradient, Opening | No image; no noise texture |
| `dithering` | `Dithering` / `ditheringFragmentShader` | `speed=1`, `frame=0`, `colorBack=#000`, `colorFront=#00b2ff`, `shape=sphere`, `type=4x4`, `size=2`, alias `pxSize` | `u_colorBack`, `u_colorFront`, `u_shape`, `u_type`, `u_pxSize` | Default, Sine Wave, Bugs, Ripple, Swirl, Warp | No image; no noise texture |
| `dot-grid` | `DotGrid` / `dotGridFragmentShader` | `colorBack=#000`, `colorFill=#fff`, `colorStroke=#ffaa00`, `size=2`, `gapX=32`, `gapY=32`, `strokeWidth=0`, `sizeRange=0`, `opacityRange=0`, `shape=circle` | `u_colorBack`, `u_colorFill`, `u_colorStroke`, `u_dotSize`, `u_gapX`, `u_gapY`, `u_strokeWidth`, `u_sizeRange`, `u_opacityRange`, `u_shape` | Default | No image; no noise texture |
| `dot-orbit` | `DotOrbit` / `dotOrbitFragmentShader` | `speed=1.5`, `frame=0`, `colorBack=#000`, `colors=[5]`, `size=1`, `sizeRange=0`, `spreading=1`, `stepsPerColor=4` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_size`, `u_sizeRange`, `u_spreading`, `u_stepsPerColor`, `u_noiseTexture` | Default, Shine, Bubbles, Hallucinatory | No image; internal noise texture |
| `fluted-glass` | `FlutedGlass` / `flutedGlassFragmentShader` | `speed=0`, `frame=0`, `image=''`, `colorBack=#00000000`, `colorShadow=#000`, `colorHighlight=#fff`, `shadows=.25`, `size=.5`, `angle=0`, `distortionShape=prism`, `highlights=.1`, `shape=lines`, `distortion=.5`, `shift=0`, `blur=0`, `edges=.25`, `stretch=0`, `margin*=0`, `grainMixer=0`, `grainOverlay=0`, deprecated `count` | `u_image`, `u_colorBack`, `u_colorShadow`, `u_colorHighlight`, `u_shadows`, `u_size`, `u_angle`, `u_distortion`, `u_shift`, `u_blur`, `u_edges`, `u_stretch`, `u_distortionShape`, `u_highlights`, `u_shape`, margins, grain uniforms | Default, Waves, Abstract, Folds | Image filter; no noise texture |
| `gem-smoke` | `GemSmoke` / `gemSmokeFragmentShader` | `speed=1`, `frame=0`, `image=''`, `colorBack=#f0efea`, `colorInner=#fafaf5`, `colors=[2]`, `outerGlow=.55`, `innerGlow=1`, `innerDistortion=.8`, `outerDistortion=.6`, `offset=0`, `angle=0`, `size=.8`, `shape=diamond` | `u_colors`, `u_colorsCount`, `u_colorBack`, `u_image`, `u_innerDistortion`, `u_outerDistortion`, `u_outerGlow`, `u_innerGlow`, `u_colorInner`, `u_offset`, `u_angle`, `u_size`, `u_isImage`, `u_shape` | Default, Fluorescent, Fire, Infrared | Optional image or built-in shape; no noise texture |
| `god-rays` | `GodRays` / `godRaysFragmentShader` | `speed=.75`, `frame=0`, `colorBack=#000`, `colorBloom=#0000ff`, `colors=[4]`, `density=.3`, `spotty=.3`, `midIntensity=.4`, `midSize=.2`, `intensity=.8`, `bloom=.4` | `u_colorBloom`, `u_colorBack`, `u_colors`, `u_colorsCount`, `u_density`, `u_spotty`, `u_midIntensity`, `u_midSize`, `u_intensity`, `u_bloom`, `u_noiseTexture` | Default, Warp, Linear, Ether | No image; internal noise texture |
| `grain-gradient` | `GrainGradient` / `grainGradientFragmentShader` | `speed=1`, `frame=0`, `colorBack=#000`, `colors=[4]`, `softness=.5`, `intensity=.5`, `noise=.25`, `shape=corners` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_softness`, `u_intensity`, `u_noise`, `u_shape`, `u_noiseTexture` | Default, Wave, Dots, Truchet, Ripple, Blob | No image; internal noise texture |
| `halftone-cmyk` | `HalftoneCmyk` / `halftoneCmykFragmentShader` | `speed=0`, `frame=0`, `image=''`, `colorBack=#fbfaf5`, `colorC/M/Y/K`, `size=.2`, `contrast=1`, `softness=1`, grain/grid/flood/gain controls, `type` | `u_image`, `u_noiseTexture`, `u_colorBack`, `u_colorC/M/Y/K`, `u_size`, `u_contrast`, `u_softness`, grain/grid/flood/gain uniforms, `u_type` | Default, Drops, Vintage | Image filter; internal noise texture |
| `halftone-dots` | `HalftoneDots` / `halftoneDotsFragmentShader` | `speed=0`, `frame=0`, `image=''`, `colorBack=#f2f1e8`, `colorFront=#2b2b2b`, `size=.5`, `radius=1.25`, `contrast=.4`, `originalColors=false`, `inverted=false`, `grainMixer=.2`, `grainOverlay=.2`, `grainSize=.5`, `grid=hex`, `type=gooey` | `u_image`, `u_colorFront`, `u_colorBack`, `u_size`, `u_radius`, `u_contrast`, `u_originalColors`, `u_inverted`, grain uniforms, `u_grid`, `u_type` | Default, LED screen, Mosaic, Round and square | Image filter; no noise texture |
| `heatmap` | `Heatmap` / `heatmapFragmentShader` | `speed=1`, `frame=0`, `image=''`, `contour=.5`, `angle=0`, `noise=0`, `innerGlow=.5`, `outerGlow=.5`, `colorBack=#000`, `colors=[7]` | `u_image`, `u_contour`, `u_angle`, `u_noise`, `u_innerGlow`, `u_outerGlow`, `u_colorBack`, `u_colors`, `u_colorsCount` | Default, Sepia | Image filter; no noise texture |
| `image-dithering` | `ImageDithering` / `imageDitheringFragmentShader` | `speed=0`, `frame=0`, `image=''`, `colorFront=#94ffaf`, `colorBack=#000c38`, `colorHighlight=#eaff94`, `type=8x8`, `size=2`, alias `pxSize`, `colorSteps=2`, `originalColors=false`, `inverted=false` | `u_image`, `u_colorFront`, `u_colorBack`, `u_colorHighlight`, `u_type`, `u_pxSize`, `u_colorSteps`, `u_originalColors`, `u_inverted` | Default, Retro, Noise, Natural | Image filter; no noise texture |
| `liquid-metal` | `LiquidMetal` / `liquidMetalFragmentShader` | `speed=1`, `frame=0`, `image=''`, `colorBack=#AAAAAC`, `colorTint=#fff`, `distortion=.07`, `repetition=2`, `shiftRed=.3`, `shiftBlue=.3`, `contour=.4`, `softness=.1`, `angle=70`, `shape=diamond` | `u_colorBack`, `u_colorTint`, `u_image`, `u_contour`, `u_distortion`, `u_softness`, `u_repetition`, `u_shiftRed`, `u_shiftBlue`, `u_angle`, `u_isImage`, `u_shape` | Default, Noir, Backdrop, Stripes | Optional image or built-in shape; no noise texture |
| `mesh-gradient` | `MeshGradient` / `meshGradientFragmentShader` | `speed=1`, `frame=0`, `colors=[4]`, `distortion=.8`, `swirl=.1`, `grainMixer=0`, `grainOverlay=0` | `u_colors`, `u_colorsCount`, `u_distortion`, `u_swirl`, `u_grainMixer`, `u_grainOverlay` | Default, Purple, Beach, Ink | No image; no noise texture |
| `metaballs` | `Metaballs` / `metaballsFragmentShader` | `speed=1`, `frame=0`, `colorBack=#000`, `colors=[5]`, `count=10`, `size=.83` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_size`, `u_count`, `u_noiseTexture` | Default, Ink Drops, Background, Solar | No image; internal noise texture |
| `neuro-noise` | `NeuroNoise` / `neuroNoiseFragmentShader` | `speed=1`, `frame=0`, `colorFront=#fff`, `colorMid=#47a6ff`, `colorBack=#000`, `brightness=.05`, `contrast=.3` | `u_colorFront`, `u_colorMid`, `u_colorBack`, `u_brightness`, `u_contrast` | Default, Sensation, Bloodstream, Ghost | No image; no noise texture |
| `paper-texture` | `PaperTexture` / `paperTextureFragmentShader` | `speed=0`, `frame=0`, `image=''`, `colorFront=#9fadbc`, `colorBack=#fff`, `contrast=.3`, `roughness=.4`, `fiber=.3`, `fiberSize=.2`, `crumples=.3`, `crumpleSize=.35`, `folds=.65`, `foldCount=5`, `fade=0`, `drops=.2`, `seed=5.8`; aliases `fiberScale`, `crumplesScale`, `blur`, `foldsNumber` | `u_image`, `u_colorFront`, `u_colorBack`, `u_contrast`, `u_roughness`, `u_fiber`, `u_fiberSize`, `u_crumples`, `u_crumpleSize`, `u_foldCount`, `u_folds`, `u_fade`, `u_drops`, `u_seed` | Default, Abstract, Cardboard, Details | Optional image; no noise texture |
| `perlin-noise` | `PerlinNoise` / `perlinNoiseFragmentShader` | `speed=.5`, `frame=0`, `colorBack=#632ad5`, `colorFront=#fccff7`, `proportion=.35`, `softness=.1`, `octaveCount=1`, `persistence=1`, `lacunarity=1.5` | `u_colorBack`, `u_colorFront`, `u_proportion`, `u_softness`, `u_octaveCount`, `u_persistence`, `u_lacunarity` | Default, Nintendo Water, Moss, Worms | No image; no noise texture |
| `pulsing-border` | `PulsingBorder` / `pulsingBorderFragmentShader` | `speed=1`, `frame=0`, `colorBack=#000`, `colors=[3]`, `roundness=.25`, `thickness=.1`, `margin*=0`, `aspectRatio=auto`, `softness=.75`, `intensity=.2`, `bloom=.25`, plus `spots`, `spotSize`, `pulse`, `smoke`, `smokeSize` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_roundness`, `u_thickness`, margins, `u_aspectRatio`, `u_softness`, `u_intensity`, `u_bloom`, `u_spots`, `u_spotSize`, `u_pulse`, `u_smoke`, `u_smokeSize`, `u_noiseTexture` | Default, Circle, Northern lights, Solid line | No image; internal noise texture |
| `simplex-noise` | `SimplexNoise` / `simplexNoiseFragmentShader` | `speed=.5`, `frame=0`, `colors=[5]`, `stepsPerColor=2`, `softness=0` | `u_colors`, `u_colorsCount`, `u_stepsPerColor`, `u_softness` | Default, Bubblegum, Spots, First contact | No image; no noise texture |
| `smoke-ring` | `SmokeRing` / `smokeRingFragmentShader` | `speed=.5`, `frame=0`, `colorBack=#000`, `colors=[#fff]`, `noiseScale=3`, `noiseIterations=8`, `radius=.25`, `thickness=.65`, `innerShape=.7` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_noiseScale`, `u_thickness`, `u_radius`, `u_innerShape`, `u_noiseIterations`, `u_noiseTexture` | Default, Solar, Line, Cloud | No image; internal noise texture |
| `spiral` | `Spiral` / `spiralFragmentShader` | `speed=1`, `frame=0`, `colorBack=#001429`, `colorFront=#79D1FF`, `density=1`, `distortion=0`, `strokeWidth=.5`, `strokeTaper=0`, `strokeCap=0`, `noise=0`, `noiseFrequency=0`, `softness=0` | `u_colorBack`, `u_colorFront`, `u_density`, `u_distortion`, `u_strokeWidth`, `u_strokeTaper`, `u_strokeCap`, `u_noiseFrequency`, `u_noise`, `u_softness` | Default, Droplet, Jungle, Swirl | No image; no noise texture |
| `static-mesh-gradient` | `StaticMeshGradient` / `staticMeshGradientFragmentShader` | `speed=0`, `frame=0`, `colors=[4]`, `positions=2`, `waveX=1`, `waveXShift=.6`, `waveY=1`, `waveYShift=.21`, `mixing=.93`, `grainMixer=0`, `grainOverlay=0` | `u_colors`, `u_colorsCount`, `u_positions`, `u_waveX`, `u_waveXShift`, `u_waveY`, `u_waveYShift`, `u_mixing`, `u_grainMixer`, `u_grainOverlay` | Default, Sea, 1960s, Sunset | No image; no noise texture |
| `static-radial-gradient` | `StaticRadialGradient` / `staticRadialGradientFragmentShader` | `speed=0`, `frame=0`, `colorBack=#000`, `colors=[3]`, `radius=.8`, `focalDistance=.99`, `focalAngle=0`, `falloff=.24`, `mixing=.5`, `distortion=0`, `distortionShift=0`, `distortionFreq=12`, `grainMixer=0`, `grainOverlay=0` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_radius`, `u_focalDistance`, `u_focalAngle`, `u_falloff`, `u_mixing`, `u_distortion`, `u_distortionShift`, `u_distortionFreq`, `u_grainMixer`, `u_grainOverlay` | Default, Cross Section, Radial, Lo-Fi | No image; no noise texture |
| `swirl` | `Swirl` / `swirlFragmentShader` | `speed=.32`, `frame=0`, `colorBack=#330000`, `colors=[3]`, `bandCount=4`, `twist=.1`, `center=.2`, `proportion=.5`, `softness=0`, `noiseFrequency=.4`, `noise=.2` | `u_colorBack`, `u_colors`, `u_colorsCount`, `u_bandCount`, `u_twist`, `u_center`, `u_proportion`, `u_softness`, `u_noiseFrequency`, `u_noise` | Default, Opening, 007, Candy | No image; no noise texture |
| `voronoi` | `Voronoi` / `voronoiFragmentShader` | `speed=.5`, `frame=0`, `colors=[2]`, `stepsPerColor=3`, `colorGlow=#fff`, `colorGap=#2e0000`, `distortion=.4`, `gap=.04`, `glow=0` | `u_colors`, `u_colorsCount`, `u_stepsPerColor`, `u_colorGlow`, `u_colorGap`, `u_distortion`, `u_gap`, `u_glow`, `u_noiseTexture` | Default, Cells, Bubbles, Lights | No image; internal noise texture |
| `warp` | `Warp` / `warpFragmentShader` | `speed=1`, `frame=0`, `colors=[4]`, `proportion=.45`, `softness=1`, `distortion=.25`, `swirl=.8`, `swirlIterations=10`, `shapeScale=.1`, `shape=checks` | `u_colors`, `u_colorsCount`, `u_proportion`, `u_softness`, `u_distortion`, `u_swirl`, `u_swirlIterations`, `u_shapeScale`, `u_shape`, `u_noiseTexture` | Default | No image; internal noise texture |
| `water` | `Water` / `waterFragmentShader` | `speed=1`, `frame=0`, `image=''`, `colorBack=#909090`, `colorHighlight=#fff`, `highlights=.07`, `layering=.5`, `edges=.8`, `waves=.3`, `caustic=.1`, `size=1`, alias `effectScale` | `u_image`, `u_colorBack`, `u_colorHighlight`, `u_highlights`, `u_layering`, `u_waves`, `u_edges`, `u_caustic`, `u_size` | Default, Abstract, Streaming, Slow-mo | Optional image; no noise texture |
| `waves` | `Waves` / `wavesFragmentShader` | `colorFront=#ffbb00`, `colorBack=#000`, `shape=0`, `frequency=.5`, `amplitude=.5`, `spacing=1.2`, `proportion=.1`, `softness=0` | `u_colorFront`, `u_colorBack`, `u_shape`, `u_frequency`, `u_amplitude`, `u_spacing`, `u_proportion`, `u_softness` | Default, Groovy, Tangled up, Ride the wave | No image; no noise texture |

Registry note: all `docs/registry/*-example.tsx` examples pass the fixed full-screen style and forward props; only `color-panels-example.tsx` additionally sets `scale={1}` and `speed={0.5}`. How else may I serve?
</task_result>
```

**Tool: task**

**Input:**

```json
{
  "description": "Audit local composer",
  "prompt": "Read-only research task in /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor. Inspect src/lib/shader-composer layers, presets, generator, runtime, texture handling. Return a concise mapping of local primitives/presets to Paper shaders, identify exact/approx/missing coverage, and note technical gaps for image/noise texture parity. Do not modify files or run write commands.",
  "subagent_type": "explore",
  "task_id": "",
  "command": ""
}
```

**Output:**

```
task_id: ses_2143cd223ffeAipTCH4LJo9hpY (for resuming to continue this task if needed)

<task_result>
Of course, Mr. Nickerson. Read-only inspection completed.

## Paper coverage map

| Paper shader / preset | Local layer stack | Coverage |
|---|---|---|
| `mesh-gradient` | `paper-mesh-gradient` | Exact |
| `static-mesh-gradient` | `paper-mesh-gradient` with `speed: 0` | Exact |
| `neuro-noise` | `paper-neuro-noise` | Exact |
| `swirl` | `paper-swirl` | Exact |
| `spiral` | `paper-spiral` | Exact |
| `simplex-noise` | `paper-simplex-noise` | Exact |
| `color-panels` | `color-array-radial-panels` | Exact |
| `pulsing-border` | `pulsing-border` | Exact |
| `grain-gradient` | `paper-mesh-gradient` + `grain` | Tagged exact |
| `dithering` | `paper-simplex-noise` + `dither` | Tagged exact |
| `heatmap` | `image-source` + `color-ramp` | Tagged exact, image required |
| `image-dithering` | `image-source` + `dither` | Tagged exact, image required |
| `halftone-dots` | `image-source` + `halftone` | Tagged exact, image required |
| `water` | `image-source` + `water-ripple` | Tagged exact, image required |
| `voronoi` | local `voronoi` | Approx |
| `perlin-noise` | local `perlin-noise` | Approx |
| `waves` | local `waves` | Approx |
| `god-rays` | local `god-rays` | Approx |
| `dot-grid` | local `dot-grid` | Approx |
| `static-radial-gradient` | `radial-gradient-v2` | Approx |
| `paper-texture` | `image-source` + `paper` | Approx |
| `liquid-metal` | `image-source` + `color-ramp` + `grain` | Placeholder |

## Exact local Paper primitives

- `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts`
  - `paper-mesh-gradient`
  - `paper-neuro-noise`
  - `paper-swirl`
  - `paper-spiral`
  - `paper-simplex-noise`
- `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts`
  - `color-array-radial-panels`
- `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/shapes.ts`
  - `pulsing-border`

## Missing / blocked

- `paper-voronoi` exists locally but is intentionally not exported because the procedural `hash22` replacement does not match Paper’s pre-baked noise texture well enough.
  - File: `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/paper-shaders.ts:434`
- Image-driven Paper effects listed but not faithfully ported as standalone specialized layers:
  - `halftone-cmyk`
  - `fluted-glass`
  - `gem-smoke`
  - possibly legacy `smoke-ring`
  - File: `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/specialized.ts:1`

## Texture / runtime parity gaps

- Preview supports `sampler2D` and `vec4Array` uniforms:
  - `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-preview.tsx:187`
  - `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/components/shader-composer/shader-preview.tsx:219`
- Exported React/vanilla code does not expose `sampler2D` or `vec4Array`, so image and palette-based Paper presets are editor-only for now:
  - `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts:332`
- Texture cache is URL/image-only: no bundled Paper noise texture path or dedicated noise sampler binding.
  - `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/texture-cache.ts:1`
- Paper noise parity is approximate where texture lookup was replaced with procedural hashes. This is acceptable for mesh/pulsing-border-style value noise, but blocks Voronoi parity.
- `specialized.ts` has stale comments saying sampler2D/runtime support has not landed, but current types, generator, preview, and UI do support it in-editor.

Will there be anything further, my lord?
</task_result>
```

---

## Assistant (Plan · GPT-5.5 · 6.1s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/sources.ts",
  "offset": 1,
  "limit": 260
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/sources.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { gen } from './_helpers'
3:
4: export const solidColorLayer: LayerDefinition = {
5:   id: 'solid-color',
6:   name: 'Solid Color',
7:   description: 'Single flat color over the entire canvas',
8:   color: '#a3a3a3',
9:   category: 'generator',
10:   defaultBlendMode: 'normal',
11:   uniforms: [
12:     { name: 'color', label: 'Color', type: 'vec3', default: [0.1, 0.1, 0.12], ui: { color: true } },
13:   ],
14:   glsl: {
15:     main: `
16: return vec4({{color}}, 1.0);`,
17:   },
18: }
19:
20: // Sample an uploaded or remote image as a texture. Honours fit/scale/rotation/
21: // offset via the auto-generated _meta and _offset companion uniforms.
22: export const imageSourceLayer = gen({
23:   id: 'image-source',
24:   name: 'Image',
25:   description: 'Sample an uploaded image as a texture',
26:   color: '#3b82f6',
27:   uniforms: [
28:     {
29:       name: 'image',
30:       label: 'Image',
31:       type: 'sampler2D',
32:       default: { url: null, sourceKind: 'url', fit: 'cover' },
33:       ui: { image: { allowUpload: true } },
34:     },
35:     {
36:       name: 'tint',
37:       label: 'Tint',
38:       type: 'vec4',
39:       default: [1, 1, 1, 1],
40:       ui: { color: true },
41:     },
42:   ],
43:   glsl: {
44:     dependencies: ['applySizing'],
45:     main: `
46: vec2 sampleUv = applySizing(uv, {{image}}_meta, {{image}}_offset);
47: if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
48:   return vec4(0.0);
49: }
50: vec4 src = texture({{image}}, sampleUv);
51: return src * {{tint}};`,
52:   },
53: })
54:
55: export const SOURCE_LAYERS: Record<string, LayerDefinition> = {
56:   'solid-color': solidColorLayer,
57:   'image-source': imageSourceLayer,
58: }

(End of file - total 58 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/specialized.ts",
  "offset": 1,
  "limit": 360
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/specialized.ts</path>
<type>file</type>
<content>
1: // Faithful Paper Shaders ports live in `paper-shaders.ts`. This file is
2: // intentionally empty: the previous procedural "heatmap", "liquid-metal",
3: // "smoke-ring" and "color-panels" stubs were misleading recreations of
4: // effects that fundamentally require image input (sampler2D + u_image),
5: // which the runtime does not yet support.
6: //
7: // When sampler2D / image-source infrastructure lands, image-driven Paper
8: // effects (heatmap, liquid-metal, paper-texture, halftone-dots, halftone-cmyk,
9: // fluted-glass, gem-smoke, image-dithering, water) can be added back here as
10: // faithful ports.
11:
12: import type { LayerDefinition } from '../types'
13:
14: export const SPECIALIZED_LAYERS: Record<string, LayerDefinition> = {}

(End of file - total 14 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts",
  "offset": 240,
  "limit": 220
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts</path>
<type>file</type>
<content>
240: float speedJ = mix(0.5, 1.5, hash(vec2(col, 2.0)));
241: float len = mix({{lengthMin}}, {{lengthMax}}, hash(vec2(col, 3.0)));
242: float yOff = -u_time * {{speed}} * speedJ + seed * 4.0;
243: float yLocal = fract(p.y + yOff);
244: float lineMask = smoothstep(0.0, 0.05, yLocal) * (1.0 - smoothstep(len, len + 0.05, yLocal));
245: float xLocal = fract(q.x) - 0.5;
246: float xMask = 1.0 - aastep({{thickness}} * 0.5, abs(xLocal));
247: float m = xMask * lineMask;
248: return vec4(mix({{color1}}, {{color2}}, m), 1.0);`,
249:   },
250: }
251:
252: export const ringLayer: LayerDefinition = {
253:   id: 'ring',
254:   name: 'Ring',
255:   description: 'Concentric rings',
256:   color: '#0ea5e9',
257:   category: 'generator',
258:   defaultBlendMode: 'normal',
259:   uniforms: twoColors([
260:     { name: 'frequency', label: 'Frequency', type: 'float', default: 8.0, ui: { min: 0.5, max: 60, step: 0.5 } },
261:     { name: 'duty', label: 'Duty', type: 'float', default: 0.5, ui: { min: 0.05, max: 0.95, step: 0.01 } },
262:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
263:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
264:   ]),
265:   glsl: {
266:     dependencies: PATTERN_DEPS,
267:     main: `
268: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
269: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
270: float r = length(p);
271: float t = fract(r * {{frequency}});
272: float m = aastep({{duty}}, t);
273: return vec4(mix({{color2}}, {{color1}}, m), 1.0);`,
274:   },
275: }
276:
277: // Pseudo-3D semi-transparent panels rotating around a central axis. Direct
278: // port of paper-design/shaders' color-panels algorithm; kept as a single
279: // atom because the panel-rotation field isn't reducible to existing primitives.
280: // Uses the new vec4Array uniform for the 1..7 colour palette.
281: export const colorArrayRadialPanelsLayer: LayerDefinition = {
282:   id: 'color-array-radial-panels',
283:   name: 'Color Panels',
284:   description: 'Pseudo-3D semi-transparent panels rotating around a central axis',
285:   color: '#fb923c',
286:   category: 'generator',
287:   defaultBlendMode: 'normal',
288:   uniforms: [
289:     {
290:       name: 'colors',
291:       label: 'Colors',
292:       type: 'vec4Array',
293:       arrayLength: 7,
294:       default: {
295:         values: [
296:           [1.0, 0.616, 0.0, 1],
297:           [0.992, 0.31, 0.188, 1],
298:           [0.502, 0.608, 1.0, 1],
299:           [0.427, 0.18, 1.0, 1],
300:           [0.2, 0.227, 1.0, 1],
301:           [0.945, 0.361, 1.0, 1],
302:           [1.0, 0.835, 0.341, 1],
303:         ],
304:         length: 7,
305:       },
306:       ui: { array: { minLength: 1, maxLength: 7 } },
307:     },
308:     { name: 'colorBack', label: 'Background', type: 'vec4', default: [0, 0, 0, 1], ui: { color: true } },
309:     { name: 'density', label: 'Density', type: 'float', default: 3, ui: { min: 0.25, max: 7, step: 0.05 } },
310:     { name: 'angle1', label: 'Angle 1', type: 'float', default: 0, ui: { min: -1, max: 1, step: 0.01 } },
311:     { name: 'angle2', label: 'Angle 2', type: 'float', default: 0, ui: { min: -1, max: 1, step: 0.01 } },
312:     { name: 'length', label: 'Length', type: 'float', default: 1.1, ui: { min: 0.01, max: 3, step: 0.01 } },
313:     { name: 'edges', label: 'Edges', type: 'bool', default: false },
314:     { name: 'blur', label: 'Blur', type: 'float', default: 0, ui: { min: 0, max: 0.5, step: 0.005 } },
315:     { name: 'fadeIn', label: 'Fade In', type: 'float', default: 1, ui: { min: 0, max: 1, step: 0.01 } },
316:     { name: 'fadeOut', label: 'Fade Out', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
317:     { name: 'gradient', label: 'Gradient', type: 'float', default: 0, ui: { min: 0, max: 1, step: 0.01 } },
318:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
319:   ],
320:   glsl: {
321:     functions: `
322: #ifndef TWO_PI
323: #define TWO_PI 6.28318530718
324: #endif
325: #ifndef PI
326: #define PI 3.14159265358979
327: #endif
328: const float CP_Z_LIMIT = 0.5;
329:
330: vec2 cpGetPanel(float angle, vec2 uv, float invLength, float aa, float blur, float a1, float a2, bool edges) {
331:   float sinA = sin(angle);
332:   float cosA = cos(angle);
333:   float denom = sinA - uv.y * cosA;
334:   if (abs(denom) < 0.01) return vec2(0.0);
335:   float z = uv.y / denom;
336:   if (z <= 0.0 || z > CP_Z_LIMIT) return vec2(0.0);
337:   float zRatio = z / CP_Z_LIMIT;
338:   float panelMap = 1.0 - zRatio;
339:   float x = uv.x * (cosA * z + 1.0) * invLength;
340:   float zOff = zRatio - 0.5;
341:   float left = -0.5 + zOff * a1;
342:   float right = 0.5 - zOff * a2;
343:   float blurX = aa + 2.0 * panelMap * blur;
344:   float panel = smoothstep(left - blurX, left + 0.25 * blurX, x)
345:               * (1.0 - smoothstep(right - 0.25 * blurX, right + blurX, x));
346:   panel *= mix(0.0, panel, smoothstep(0.0, 0.01, panelMap));
347:   float midScreen = abs(sinA);
348:   if (edges) {
349:     panelMap = mix(0.99, panelMap, panel * clamp(panelMap / (0.15 * (1.0 - pow(midScreen, 0.1))), 0.0, 1.0));
350:   } else if (midScreen < 0.07) {
351:     panel *= midScreen * 15.0;
352:   }
353:   return vec2(panel, panelMap);
354: }
355:
356: vec4 cpBlend(vec4 colorA, float panelMask, float panelMap, float fadeIn, float fadeOut) {
357:   float fade = 1.0 - smoothstep(0.97 - 0.97 * fadeIn, 1.0, panelMap);
358:   fade *= smoothstep(-0.2 * (1.0 - fadeOut), fadeOut, panelMap);
359:   vec3 blendedRGB = mix(vec3(0.0), colorA.rgb, fade);
360:   float blendedAlpha = mix(0.0, colorA.a, fade);
361:   return vec4(blendedRGB, blendedAlpha) * panelMask;
362: }`,
363:     main: `
364: ${screenP}
365: vec2 cpUv = p * 1.25;
366: float t = fract(0.02 * u_time * {{speed}});
367: bool reverseTime = (t < 0.5);
368: vec3 color = vec3(0.0);
369: float opacity = 0.0;
370: float aa = 0.005;
371: int colorsCount = max(1, {{colors}}_count);
372: vec4 premultiplied[7];
373: for (int i = 0; i < 7; i++) {
374:   if (i >= colorsCount) break;
375:   vec4 c = {{colors}}[i];
376:   c.rgb *= c.a;
377:   premultiplied[i] = c;
378: }
379: float invLength = 1.5 / max({{length}}, 0.001);
380: int panelsNumber = 12;
381: float densityNormalizer = 1.0;
382: if (colorsCount == 4) { panelsNumber = 16; densityNormalizer = 1.34; }
383: else if (colorsCount == 5) { panelsNumber = 20; densityNormalizer = 1.67; }
384: else if (colorsCount == 7) { panelsNumber = 14; densityNormalizer = 1.17; }
385: float fPanelsNumber = float(panelsNumber);
386: float panelGrad = 1.0 - clamp({{gradient}}, 0.0, 1.0);
387: for (int set = 0; set < 2; set++) {
388:   bool isForward = (set == 0 && !reverseTime) || (set == 1 && reverseTime);
389:   if (!isForward) continue;
390:   // Forward sweep
391:   for (int i = 0; i <= 20; i++) {
392:     if (i >= panelsNumber) break;
393:     int idx = panelsNumber - 1 - i;
394:     float offset = float(idx) / fPanelsNumber;
395:     if (set == 1) offset += 0.5;
396:     float densityFract = densityNormalizer * fract(t + offset);
397:     float angleNorm = densityFract / max({{density}}, 1e-4);
398:     if (densityFract >= 0.5 || angleNorm >= 0.3) continue;
399:     float smoothDensity = clamp((0.5 - densityFract) / 0.1, 0.0, 1.0)
400:                        * clamp(densityFract / 0.01, 0.0, 1.0);
401:     float smoothAngle = clamp((0.3 - angleNorm) / 0.05, 0.0, 1.0);
402:     if (smoothDensity * smoothAngle < 0.001) continue;
403:     if (angleNorm > 0.5) angleNorm = 0.5;
404:     vec2 panel = cpGetPanel(angleNorm * TWO_PI + PI, cpUv, invLength, aa, {{blur}}, {{angle1}}, {{angle2}}, {{edges}});
405:     if (panel.x <= 0.001) continue;
406:     float panelMask = panel.x * smoothDensity * smoothAngle;
407:     float panelMap = panel.y;
408:     int colorIdx = idx - (idx / colorsCount) * colorsCount;
409:     int nextColorIdx = (idx + 1) - ((idx + 1) / colorsCount) * colorsCount;
410:     vec4 colorA = premultiplied[colorIdx];
411:     vec4 colorB = premultiplied[nextColorIdx];
412:     colorA = mix(colorA, colorB, max(0.0, smoothstep(0.0, 0.45, panelMap) - panelGrad));
413:     vec4 blended = cpBlend(colorA, panelMask, panelMap, {{fadeIn}}, {{fadeOut}});
414:     color = blended.rgb + color * (1.0 - blended.a);
415:     opacity = blended.a + opacity * (1.0 - blended.a);
416:   }
417:   // Reverse sweep
418:   for (int i = 0; i <= 20; i++) {
419:     if (i >= panelsNumber) break;
420:     int idx = panelsNumber - 1 - i;
421:     float offset = float(idx) / fPanelsNumber;
422:     if (set == 0) offset += 0.5;
423:     float densityFract = densityNormalizer * fract(-t + offset);
424:     float angleNorm = -densityFract / max({{density}}, 1e-4);
425:     if (densityFract >= 0.5 || angleNorm < -0.3) continue;
426:     float smoothDensity = clamp((0.5 - densityFract) / 0.1, 0.0, 1.0)
427:                        * clamp(densityFract / 0.01, 0.0, 1.0);
428:     float smoothAngle = clamp((angleNorm + 0.3) / 0.05, 0.0, 1.0);
429:     if (smoothDensity * smoothAngle < 0.001) continue;
430:     vec2 panel = cpGetPanel(angleNorm * TWO_PI + PI, cpUv, invLength, aa, {{blur}}, {{angle1}}, {{angle2}}, {{edges}});
431:     float panelMask = panel.x * smoothDensity * smoothAngle;
432:     if (panelMask <= 0.001) continue;
433:     float panelMap = panel.y;
434:     int rawIdx = (colorsCount - (idx - (idx / colorsCount) * colorsCount)) - ((colorsCount - (idx - (idx / colorsCount) * colorsCount)) / colorsCount) * colorsCount;
435:     int colorIdx = rawIdx;
436:     int nextColorIdx = (colorIdx + 1) - ((colorIdx + 1) / colorsCount) * colorsCount;
437:     vec4 colorA = premultiplied[colorIdx];
438:     vec4 colorB = premultiplied[nextColorIdx];
439:     colorA = mix(colorA, colorB, max(0.0, smoothstep(0.0, 0.45, panelMap) - panelGrad));
440:     vec4 blended = cpBlend(colorA, panelMask, panelMap, {{fadeIn}}, {{fadeOut}});
441:     color = blended.rgb + color * (1.0 - blended.a);
442:     opacity = blended.a + opacity * (1.0 - blended.a);
443:   }
444: }
445: vec3 bg = {{colorBack}}.rgb * {{colorBack}}.a;
446: color = color + bg * (1.0 - opacity);
447: opacity = opacity + {{colorBack}}.a * (1.0 - opacity);
448: return vec4(color, opacity);`,
449:   },
450: }
451:
452: export const PATTERN_LAYERS: Record<string, LayerDefinition> = {
453:   checkerboard: checkerboardLayer,
454:   stripes: stripesLayer,
455:   grid: gridLayer,
456:   'dot-grid': dotGridLayer,
457:   'hex-grid': hexGridLayer,
458:   truchet: truchetLayer,
459:   weave: weaveLayer,

(Showing lines 240-459 of 464. Use offset=460 to continue.)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/shapes.ts",
  "offset": 180,
  "limit": 180
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/shapes.ts</path>
<type>file</type>
<content>
180: }
181:
182: export const vesicaLayer: LayerDefinition = {
183:   id: 'vesica',
184:   name: 'Vesica',
185:   description: 'Almond / lens shape (intersection of two circles)',
186:   color: '#3b82f6',
187:   category: 'generator',
188:   defaultBlendMode: 'normal',
189:   uniforms: standardShapeUniforms([
190:     { name: 'radius', label: 'Radius', type: 'float', default: 0.4, ui: { min: 0.001, max: 1, step: 0.001 } },
191:     { name: 'separation', label: 'Separation', type: 'float', default: 0.2, ui: { min: 0, max: 0.39, step: 0.001 } },
192:     { name: 'rotation', label: 'Rotation', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
193:   ]),
194:   glsl: {
195:     dependencies: [...SHAPE_DEPS, 'sdVesica', 'rotate2D'],
196:     main: `
197: ${positionedP()}
198: p = rotate2D(p, {{rotation}} * 3.14159 / 180.0);
199: float d = sdVesica(p.yx, {{radius}}, {{separation}});
200: ${fillAndStroke}`,
201:   },
202: }
203:
204: // Faithful port of paper-design/shaders' pulsing-border. Spots travel around
205: // a rounded-rectangle perimeter at independent speeds; per-spot colour is
206: // drawn from a vec4Array palette; output blends between alpha-over and
207: // additive accumulation per `bloom`. Optional value-noise smoke extends the
208: // border outwards; optional beat-function pulse modulates everything.
209: //
210: // This is kept as a single atom because the angular-sweep-of-coloured-spots
211: // pattern isn't reducible to existing primitives — see `color-array-radial-
212: // panels` for the same justification.
213: export const pulsingBorderLayer: LayerDefinition = {
214:   id: 'pulsing-border',
215:   name: 'Pulsing Border',
216:   description: 'Luminous trails of color sweeping around a rounded-rectangle perimeter',
217:   color: '#22d3ee',
218:   category: 'generator',
219:   defaultBlendMode: 'normal',
220:   uniforms: [
221:     {
222:       name: 'colors',
223:       label: 'Colors',
224:       type: 'vec4Array',
225:       arrayLength: 5,
226:       default: {
227:         values: [
228:           [0.051, 0.757, 0.992, 1],
229:           [0.851, 0.082, 0.937, 1],
230:           [1.0, 0.247, 0.18, 0.8],
231:         ],
232:         length: 3,
233:       },
234:       ui: { array: { minLength: 1, maxLength: 5 } },
235:     },
236:     { name: 'colorBack', label: 'Background', type: 'vec4', default: [0, 0, 0, 1], ui: { color: true } },
237:     { name: 'roundness', label: 'Roundness', type: 'float', default: 0.25, ui: { min: 0, max: 1, step: 0.01 } },
238:     { name: 'thickness', label: 'Thickness', type: 'float', default: 0.1, ui: { min: 0, max: 1, step: 0.01 } },
239:     { name: 'softness', label: 'Softness', type: 'float', default: 0.75, ui: { min: 0, max: 1, step: 0.01 } },
240:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.2, ui: { min: 0, max: 1, step: 0.01 } },
241:     { name: 'bloom', label: 'Bloom', type: 'float', default: 0.25, ui: { min: 0, max: 1, step: 0.01 } },
242:     { name: 'spots', label: 'Spots/Color', type: 'int', default: 4, ui: { min: 1, max: 4, step: 1 } },
243:     { name: 'spotSize', label: 'Spot Size', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
244:     { name: 'pulse', label: 'Pulse', type: 'float', default: 0.25, ui: { min: 0, max: 1, step: 0.01 } },
245:     { name: 'smoke', label: 'Smoke', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
246:     { name: 'smokeSize', label: 'Smoke Size', type: 'float', default: 0.6, ui: { min: 0, max: 1, step: 0.01 } },
247:     { name: 'marginLeft', label: 'Margin L', type: 'float', default: 0, ui: { min: 0, max: 0.45, step: 0.01 } },
248:     { name: 'marginRight', label: 'Margin R', type: 'float', default: 0, ui: { min: 0, max: 0.45, step: 0.01 } },
249:     { name: 'marginTop', label: 'Margin T', type: 'float', default: 0, ui: { min: 0, max: 0.45, step: 0.01 } },
250:     { name: 'marginBottom', label: 'Margin B', type: 'float', default: 0, ui: { min: 0, max: 0.45, step: 0.01 } },
251:     { name: 'speed', label: 'Speed', type: 'float', default: 1, ui: { min: 0, max: 4, step: 0.05 } },
252:   ],
253:   glsl: {
254:     dependencies: ['hash21', 'hash22'],
255:     functions: `
256: #ifndef TWO_PI
257: #define TWO_PI 6.28318530718
258: #endif
259: #ifndef PI
260: #define PI 3.14159265358979
261: #endif
262:
263: float pbBeat(float time) {
264:   float first = pow(abs(sin(time * TWO_PI)), 10.0);
265:   float second = pow(abs(sin((time - 0.15) * TWO_PI)), 10.0);
266:   return clamp(first + 0.6 * second, 0.0, 1.0);
267: }
268:
269: float pbValueNoise(vec2 st) {
270:   vec2 i = floor(st);
271:   vec2 f = fract(st);
272:   // hash21 returns a uniform-ish [0,1] scalar, matching Paper's noise-texture
273:   // green-channel substitution.
274:   float a = hash21(i);
275:   float b = hash21(i + vec2(1.0, 0.0));
276:   float c = hash21(i + vec2(0.0, 1.0));
277:   float d = hash21(i + vec2(1.0, 1.0));
278:   vec2 u = f * f * (3.0 - 2.0 * f);
279:   float x1 = mix(a, b, u.x);
280:   float x2 = mix(c, d, u.x);
281:   return mix(x1, x2, u.y);
282: }
283:
284: float pbRoundedBox(
285:   vec2 uv, vec2 halfSize, float dist, float cornerDistance,
286:   float thickness, float softness
287: ) {
288:   float borderDistance = abs(dist);
289:   float aa = 2.0 * fwidth(dist);
290:   float low = min(mix(thickness, -thickness, softness), thickness + aa);
291:   float high = max(mix(thickness, -thickness, softness), thickness + aa);
292:   float border = 1.0 - smoothstep(low, high, borderDistance);
293:   float cornerFadeCircles = 0.0;
294:   cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv + halfSize) / max(thickness, 1e-4))));
295:   cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - vec2(-halfSize.x, halfSize.y)) / max(thickness, 1e-4))));
296:   cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - vec2(halfSize.x, -halfSize.y)) / max(thickness, 1e-4))));
297:   cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - halfSize) / max(thickness, 1e-4))));
298:   float aa2 = fwidth(cornerDistance);
299:   float cornerFade = smoothstep(0.0, mix(aa2, thickness, softness), cornerDistance);
300:   cornerFade *= cornerFadeCircles;
301:   border += cornerFade;
302:   return border;
303: }`,
304:     main: `
305: const float firstFrameOffset = 109.0;
306: float t = 1.2 * (u_time * {{speed}} + firstFrameOffset);
307:
308: // borderUV: centered + aspect-corrected (Paper's v_responsiveUV equivalent).
309: float canvasRatio = u_resolution.x / max(u_resolution.y, 1.0);
310: vec2 borderUV = (uv - 0.5);
311: borderUV.x *= max(canvasRatio, 1.0);
312: borderUV.y /= min(canvasRatio, 1.0);
313:
314: vec2 halfSize = vec2(0.5);
315: halfSize.x *= max(canvasRatio, 1.0);
316: halfSize.y /= min(canvasRatio, 1.0);
317:
318: float pulse = {{pulse}} * pbBeat(0.18 * u_time * {{speed}});
319:
320: float mL = {{marginLeft}};
321: float mR = {{marginRight}};
322: float mT = {{marginTop}};
323: float mB = {{marginBottom}};
324: float mX = mL + mR;
325: float mY = mT + mB;
326:
327: float thickness = 0.5 * {{thickness}} * min(halfSize.x, halfSize.y);
328: halfSize.x *= (1.0 - mX);
329: halfSize.y *= (1.0 - mY);
330:
331: vec2 centerShift = vec2(
332:   (mL - mR) * max(canvasRatio, 1.0) * 0.5,
333:   (mB - mT) / min(canvasRatio, 1.0) * 0.5
334: );
335: borderUV -= centerShift;
336: halfSize -= mix(thickness, 0.0, {{softness}});
337:
338: float radius = mix(0.0, min(halfSize.x, halfSize.y), {{roundness}});
339: vec2 dvec = abs(borderUV) - halfSize + radius;
340: float outsideDistance = length(max(dvec, 0.0001)) - radius;
341: float insideDistance = min(max(dvec.x, dvec.y), 0.0001);
342: float cornerDistance = abs(min(max(dvec.x, dvec.y) - 0.45 * radius, 0.0));
343: float dist = outsideDistance + insideDistance;
344:
345: float borderThickness = mix(thickness, 3.0 * thickness, {{softness}});
346: float border = pbRoundedBox(borderUV, halfSize, dist, cornerDistance, borderThickness, {{softness}});
347: border = pow(border, 1.0 + {{softness}});
348:
349: vec2 smokeUV = 0.3 * {{smokeSize}} * uv;
350: float smoke = clamp(3.0 * pbValueNoise(2.7 * smokeUV + 0.5 * t), 0.0, 1.0);
351: smoke -= pbValueNoise(3.4 * smokeUV - 0.5 * t);
352: float smokeThickness = clamp(thickness + 0.2, 0.1, 0.4);
353: smoke *= pbRoundedBox(borderUV, halfSize, dist, cornerDistance, smokeThickness, 1.0);
354: smoke = 30.0 * smoke * smoke;
355: smoke *= mix(0.0, 0.5, pow({{smoke}}, 2.0));
356: smoke *= mix(1.0, pulse, {{pulse}});
357: smoke = clamp(smoke, 0.0, 1.0);
358: border += smoke;
359: border = clamp(border, 0.0, 1.0);

(Showing lines 180-359 of 433. Use offset=360 to continue.)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/texture-cache.ts",
  "offset": 1,
  "limit": 260
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/texture-cache.ts</path>
<type>file</type>
<content>
1: // URL → WebGLTexture cache with LRU eviction and oversize downsampling.
2: // Used by the in-app preview to manage texture lifecycle without thrashing on
3: // every uniform update. Editor-only for now; exported components implement
4: // their own simpler binding.
5:
6: const MAX_TEXTURE_SIZE = 2048
7: const MAX_ENTRIES = 20
8:
9: interface CacheEntry {
10:   texture: WebGLTexture
11:   width: number
12:   height: number
13:   aspect: number
14:   /** Updated on every getTexture() so eviction picks the oldest. */
15:   lastUsed: number
16: }
17:
18: export class TextureCache {
19:   private gl: WebGL2RenderingContext
20:   private entries = new Map<string, CacheEntry>()
21:   private placeholder: WebGLTexture | null = null
22:   private inFlight = new Map<string, Promise<CacheEntry | null>>()
23:
24:   constructor(gl: WebGL2RenderingContext) {
25:     this.gl = gl
26:   }
27:
28:   /** 1×1 transparent texture; safe to bind unconditionally as a fallback. */
29:   getPlaceholder(): WebGLTexture {
30:     if (this.placeholder) return this.placeholder
31:     const gl = this.gl
32:     const tex = gl.createTexture()
33:     if (!tex) throw new Error('Failed to allocate placeholder texture')
34:     gl.bindTexture(gl.TEXTURE_2D, tex)
35:     gl.texImage2D(
36:       gl.TEXTURE_2D,
37:       0,
38:       gl.RGBA,
39:       1,
40:       1,
41:       0,
42:       gl.RGBA,
43:       gl.UNSIGNED_BYTE,
44:       new Uint8Array([0, 0, 0, 0])
45:     )
46:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
47:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
48:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
49:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
50:     this.placeholder = tex
51:     return tex
52:   }
53:
54:   /** Returns a cached entry synchronously if loaded; otherwise null. */
55:   peek(url: string): CacheEntry | null {
56:     const entry = this.entries.get(url)
57:     if (!entry) return null
58:     entry.lastUsed = performance.now()
59:     return entry
60:   }
61:
62:   /**
63:    * Loads `url` into a texture (cache or fresh). Calls onReady once the
64:    * upload completes so the renderer can re-render with the new texture.
65:    */
66:   prefetch(url: string, onReady?: () => void): void {
67:     if (this.entries.has(url)) return
68:     if (this.inFlight.has(url)) return
69:     const promise = this.load(url).finally(() => this.inFlight.delete(url))
70:     this.inFlight.set(url, promise)
71:     if (onReady) {
72:       promise.then((entry) => {
73:         if (entry) onReady()
74:       })
75:     }
76:   }
77:
78:   private async load(url: string): Promise<CacheEntry | null> {
79:     const gl = this.gl
80:     const img = await loadImage(url).catch(() => null)
81:     if (!img) return null
82:
83:     let source: HTMLImageElement | HTMLCanvasElement = img
84:     let w = img.naturalWidth
85:     let h = img.naturalHeight
86:     const limit = Math.min(
87:       MAX_TEXTURE_SIZE,
88:       gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
89:     )
90:     if (w > limit || h > limit) {
91:       const scale = Math.min(limit / w, limit / h)
92:       const dw = Math.max(1, Math.floor(w * scale))
93:       const dh = Math.max(1, Math.floor(h * scale))
94:       const canvas = document.createElement('canvas')
95:       canvas.width = dw
96:       canvas.height = dh
97:       const ctx = canvas.getContext('2d')
98:       if (ctx) {
99:         ctx.drawImage(img, 0, 0, dw, dh)
100:         source = canvas
101:         w = dw
102:         h = dh
103:       }
104:     }
105:
106:     const tex = gl.createTexture()
107:     if (!tex) return null
108:     gl.bindTexture(gl.TEXTURE_2D, tex)
109:     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
110:     gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
111:     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
112:     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
113:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
114:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
115:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
116:     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
117:
118:     const entry: CacheEntry = {
119:       texture: tex,
120:       width: w,
121:       height: h,
122:       aspect: w / Math.max(1, h),
123:       lastUsed: performance.now(),
124:     }
125:     this.entries.set(url, entry)
126:     this.evictIfNeeded()
127:     return entry
128:   }
129:
130:   private evictIfNeeded() {
131:     if (this.entries.size <= MAX_ENTRIES) return
132:     let oldestKey: string | null = null
133:     let oldestUsed = Infinity
134:     for (const [k, v] of this.entries) {
135:       if (v.lastUsed < oldestUsed) {
136:         oldestUsed = v.lastUsed
137:         oldestKey = k
138:       }
139:     }
140:     if (oldestKey) {
141:       const dead = this.entries.get(oldestKey)
142:       if (dead) this.gl.deleteTexture(dead.texture)
143:       this.entries.delete(oldestKey)
144:     }
145:   }
146:
147:   destroy() {
148:     for (const entry of this.entries.values()) {
149:       this.gl.deleteTexture(entry.texture)
150:     }
151:     this.entries.clear()
152:     if (this.placeholder) {
153:       this.gl.deleteTexture(this.placeholder)
154:       this.placeholder = null
155:     }
156:   }
157: }
158:
159: function loadImage(url: string): Promise<HTMLImageElement> {
160:   return new Promise((resolve, reject) => {
161:     const img = new Image()
162:     // dataURLs and blob URLs don't need crossOrigin; only set for absolute http(s).
163:     if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous'
164:     img.onload = () => resolve(img)
165:     img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
166:     img.src = url
167:   })
168: }

(End of file - total 168 lines)
</content>
```

---

## Assistant (Plan · GPT-5.5 · 8.6s)

**Tool: webfetch**

**Input:**

```json
{
  "url": "https://raw.githubusercontent.com/paper-design/shaders/main/docs/registry.json",
  "format": "text",
  "timeout": 30
}
```

**Output:**

```
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "Paper Shaders",
  "homepage": "https://shaders.paper.design",
  "items": [
    {
      "name": "dot-grid",
      "type": "registry:component",
      "title": "Dot Grid Example",
      "description": "Dot Grid shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/dot-grid-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "dot-orbit",
      "type": "registry:component",
      "title": "Dot Orbit Example",
      "description": "Dot Orbit shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/dot-orbit-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "god-rays",
      "type": "registry:component",
      "title": "God Rays Example",
      "description": "God Rays shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/god-rays-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "mesh-gradient",
      "type": "registry:component",
      "title": "Mesh Gradient Example",
      "description": "Mesh Gradient shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/mesh-gradient-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "metaballs",
      "type": "registry:component",
      "title": "Metaballs Example",
      "description": "Metaballs shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/metaballs-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "neuro-noise",
      "type": "registry:component",
      "title": "Neuro Noise Example",
      "description": "Neuro Noise shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/neuro-noise-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "perlin-noise",
      "type": "registry:component",
      "title": "Perlin Noise Example",
      "description": "Perlin Noise shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/perlin-noise-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "smoke-ring",
      "type": "registry:component",
      "title": "Smoke Ring Example",
      "description": "Smoke Ring shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/smoke-ring-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "spiral",
      "type": "registry:component",
      "title": "Spiral Example",
      "description": "Spiral shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/spiral-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "simplex-noise",
      "type": "registry:component",
      "title": "Simplex Noise Example",
      "description": "Simplex Noise shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/simplex-noise-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "voronoi",
      "type": "registry:component",
      "title": "Voronoi Example",
      "description": "Voronoi shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/voronoi-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "warp",
      "type": "registry:component",
      "title": "Warp Example",
      "description": "Warp shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/warp-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "waves",
      "type": "registry:component",
      "title": "Waves Example",
      "description": "Waves shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/waves-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "swirl",
      "type": "registry:component",
      "title": "Swirl Example",
      "description": "Swirl shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/swirl-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "dithering",
      "type": "registry:component",
      "title": "Dithering Example",
      "description": "Dithering shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/dithering-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "grain-gradient",
      "type": "registry:component",
      "title": "Grain Gradient Example",
      "description": "Grain Gradient shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/grain-gradient-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "liquid-metal",
      "type": "registry:component",
      "title": "Liquid Metal Example",
      "description": "Liquid Metal shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/liquid-metal-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "pulsing-border",
      "type": "registry:component",
      "title": "Pulsing Border Example",
      "description": "Pulsing Border shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/pulsing-border-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "color-panels",
      "type": "registry:component",
      "title": "Color Panels Example",
      "description": "Color Panels shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/color-panels-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "static-mesh-gradient",
      "type": "registry:component",
      "title": "Static Mesh Gradient Example",
      "description": "Static Mesh Gradient shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/static-mesh-gradient-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "static-radial-gradient",
      "type": "registry:component",
      "title": "Static radial Gradient Example",
      "description": "Static radial Gradient shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/static-radial-gradient-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "paper-texture",
      "type": "registry:component",
      "title": "Paper Texture Example",
      "description": "Paper Texture shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/paper-texture-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "fluted-glass",
      "type": "registry:component",
      "title": "Fluted Glass Example",
      "description": "Fluted Glass shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/fluted-glass-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "water",
      "type": "registry:component",
      "title": "Water Example",
      "description": "Water shader example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/water-example.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "image-dithering",
      "type": "registry:component",
      "title": "Image Dithering Example",
      "description": "Image dithering example.",
      "dependencies": ["@paper-design/shaders-react"],
      "files": [
        {
          "path": "registry/image-dithering-example.tsx",
          "type": "registry:component"
        }
      ]
    }
  ]
}

```

---

## Assistant (Plan · GPT-5.5 · 62.2s)

Certainly, Mr. Nickerson. Read-only audit complete.

**Findings**
The upstream package currently has 29 shader modules in `packages/shaders/src/shaders`. Our preset map is not 1:1 yet.

Local gaps found:

- Missing dedicated Paper shader primitives: `dot-orbit`, `fluted-glass`, `gem-smoke`, `halftone-cmyk`, `metaballs`, `smoke-ring`, `warp`.
- Several local presets marked `exact` are actually composed approximations or incomplete API matches: `static-mesh-gradient`, `grain-gradient`, `dithering`, `heatmap`, `image-dithering`, `halftone-dots`, `liquid-metal`, `paper-texture`, `water`.
- `paper-voronoi` exists but is not exported because Paper’s noise texture is missing locally: `src/lib/shader-composer/layers/paper-shaders.ts:434`.
- Preview supports images already, but generated React/vanilla exports explicitly exclude `sampler2D` and `vec4Array`: `src/lib/shader-composer/generator.ts:332`.
- Image-driven shader ports were deferred in `specialized.ts`, but the comment is now stale because editor-side sampler support exists: `src/lib/shader-composer/layers/specialized.ts:1`.

**Plan**

1. Add Paper parity foundations:
   - Add built-in Paper noise texture support for shaders that use `u_noiseTexture`.
   - Extend export generation so `sampler2D` images and `vec4Array` palettes work outside the editor.
   - Keep existing image upload/drop/paste UI, but wire it cleanly into all Paper image shaders.

2. Port every upstream shader as a dedicated Paper primitive:
   - Keep or update current direct ports: `mesh-gradient`, `neuro-noise`, `swirl`, `spiral`, `simplex-noise`, `color-panels`, `pulsing-border`.
   - Replace approximations with exact ports: `static-mesh-gradient`, `static-radial-gradient`, `voronoi`, `perlin-noise`, `waves`, `god-rays`, `dot-grid`, `grain-gradient`, `dithering`, `heatmap`, `image-dithering`, `halftone-dots`, `liquid-metal`, `paper-texture`, `water`.
   - Add missing ports: `dot-orbit`, `fluted-glass`, `gem-smoke`, `halftone-cmyk`, `metaballs`, `smoke-ring`, `warp`.

3. Rewrite `PAPER_GROUPS` in `src/lib/shader-composer/paper-presets.ts`:
   - One group per upstream shader.
   - Include all named upstream preset variants, not just defaults.
   - Remove `approx` and `placeholder` mappings once exact ports land.
   - Preserve `noImage` defaults for image shaders so users can supply their own image.

4. Verification:
   - Run `npm run build`.
   - Generate every Paper preset and check shader generation for compile-sensitive strings/uniforms.
   - Use browser automation to load the editor, switch through representative procedural, noise-texture, and image presets, and confirm no WebGL compile/runtime errors.

Assumption: “1:1” means every shader module in `packages/shaders/src/shaders` plus all named preset variants from the upstream docs/examples, not only the registry examples. If that is correct, I am ready to implement when plan mode is lifted, my lord.

---

## User

So I guess I'd like to clarify is that the idea of this program is to provide easy-to-understand primitives and building blocks users and designers can use to create shaders like paper's. so it'd be ideal if instead of porting them all over 1:1, we do a bit of brainstorming and think of which primitives we need to add/modify to allow us to provide these paper shaders as presets built using our layer/primitive approach

---

## Assistant (Plan · GPT-5.5 · 144.8s)

Of course, my lord. That clarification changes the goal in the right direction: we should avoid turning the editor into a Paper clone library, and instead identify the smallest set of designer-readable primitives that can recreate those looks as presets. I shall keep this strictly read-only and turn the audit into a primitive roadmap.

**Tool: task**

**Input:**

```json
{
  "description": "Map primitive gaps",
  "prompt": "Read-only research in /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor. Inspect src/lib/shader-composer/layers and paper-presets.ts. Catalog existing primitive categories and propose the smallest additional/modified primitives needed to express the upstream Paper shaders as layer stacks instead of monolithic ports. Focus on designer-understandable building blocks, not code implementation. Return concise recommendations with which Paper presets each primitive unlocks.",
  "subagent_type": "explore",
  "task_id": "",
  "command": ""
}
```

**Output:**

```
task_id: ses_214300cdbffeopiSBMjVr6pAWX (for resuming to continue this task if needed)

<task_result>
Certainly, Mr. Nickerson.

Inspected:

- `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers`
- `/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts`

## Existing primitive categories

- **Sources:** solid color, image
- **Shapes:** circle, ellipse, rounded rect, polygon, star, cross, crescent, vesica, pulsing border
- **Patterns:** checkerboard, stripes, grid, dots, hex, truchet, weave, strands, falling lines, rings, color panels
- **Gradients:** linear/radial/conic/diamond, multi-point gradient
- **Noise:** simplex, perlin, plasma, flow field, aurora, spiral, contours
- **Atmospherics:** smoke, fog, beam, god rays, lens flare
- **Distorters:** liquify, twirl, swirl, ripples, kaleidoscope, perspective, glass, water ripple, etc.
- **Color/ramp:** hue, saturation, brightness/contrast, tint, duotone/tritone, color ramp, luminance tap
- **Stylize/effects:** dither, halftone, posterize, grain, paper texture, glow, blur, chromatic aberration

## Smallest primitive additions/modifications

### 1. **Scalar Noise Field**
A grayscale noise generator with modes like “simplex two-octave,” “fbm,” and “animated drift.”
Use with `color-ramp`, `dither`, `posterize`.

Unlocks:

- **Simplex Noise · Default**
- **Simplex Noise · Stepped**
- **Dithering**
- Improves **Perlin Noise**

This replaces `paper-simplex-noise` as a monolith.

---

### 2. **Upgrade Color Ramp**
Add designer controls for:

- stepped vs smooth
- softness
- steps per color
- optional palette wrapping

Unlocks:

- **Simplex Noise**
- **Dithering**
- **Heatmap**
- **Liquid Metal**
- Any future palette-based Paper shader

This is probably the highest-leverage modification.

---

### 3. **Mesh Spots Gradient**
Modify/extend `multi-point-gradient` into a reusable “soft color blobs” primitive:

- editable color stops
- spot count
- spot motion
- softness/falloff
- static mode

Pair with grain and a warp distorter.

Unlocks:

- **Mesh Gradient · Default**
- **Mesh Gradient · Purple**
- **Mesh Gradient · Beach**
- **Static Mesh**
- **Grain Gradient**

---

### 4. **Liquid Mesh Warp**
A distorter for broad, organic mesh movement:

- distortion
- swirl
- speed
- center falloff

Unlocks:

- **Mesh Gradient**
- **Static Mesh**
- **Grain Gradient**

This keeps the “mesh” look composable: gradient first, then warp, then grain.

---

### 5. **Synaptic / Tendril Field**
A scalar generator for branching, neural, aurora-like lines. Color should come from `color-ramp` or `tritone`.

Unlocks:

- **Neuro Noise · Default**
- **Neuro Noise · Cyan**

This could also replace or refocus the existing `aurora` primitive as a reusable field instead of a colored final shader.

---

### 6. **Pinwheel Bands**
A polar band mask:

- band count
- twist
- center size
- softness
- noise amount
- proportion

Color via `color-ramp`.

Unlocks:

- **Swirl**

This is more designer-understandable than “Paper Swirl”: it is simply twisted radial color bands.

---

### 7. **Spiral Stripe Mask**
Upgrade existing spiral support into a mask primitive:

- density
- stroke width
- taper
- cap
- distortion
- noise
- softness

Unlocks:

- **Spiral**

Color can remain a simple background/foreground pair or be delegated to `color-ramp`.

---

### 8. **Perspective Panel Sweep**
A reusable panel/ribbon generator:

- panel count/density
- length
- blur
- edge mode
- fade in/out
- rotation speed
- palette indexing

Unlocks:

- **Color Panels · Default**
- **Color Panels · Glass**
- **Color Panels · Gradient**

This is the hardest to decompose cleanly, but naming it as “Perspective Panel Sweep” makes it a design primitive rather than a Paper port.

---

### 9. **Perimeter Runner**
A rounded-rect perimeter primitive for animated light traveling around a border:

- rounded rect bounds
- thickness
- spot size
- spot count
- palette
- speed
- pulse
- glow/smoke amount

Unlocks:

- **Pulsing Border · Default**
- **Pulsing Border · Northern Lights**
- **Pulsing Border · Solid Line**

The existing rounded rect, smoke, and glow primitives are close, but the missing reusable idea is “motion along a shape perimeter.”

---

### 10. **Colored Voronoi Cells**
Upgrade existing `voronoi` with:

- random cell color selection
- gap color
- glow color
- distortion
- animated cell movement

Unlocks:

- **Voronoi**

This would replace the current approximate preset with a more faithful, still-designer-readable “cell mosaic” primitive.

## Already sufficiently stackable

No major new primitive needed for:

- **Heatmap:** `image-source` + `color-ramp`
- **Image Dithering:** `image-source` + `dither`
- **Halftone Dots:** `image-source` + `halftone`
- **Paper Texture:** `image-source` + `paper`
- **Water:** `image-source` + `water-ripple`
- **God Rays, Dot Grid, Static Radial:** already use clear primitives

## One placeholder-specific addition

### **Luminance Relief / Chrome Lighting**
For **Liquid Metal**, add a luminance-to-relief/metallic highlight primitive before the chrome `color-ramp`.

Unlocks:

- **Liquid Metal** beyond placeholder fidelity

Very good, sire. The shortest path is: upgrade `color-ramp`, add scalar fields/masks, and treat color as a separate layer wherever possible. Will there be anything further?
</task_result>
```

**Tool: task**

**Input:**

```json
{
  "description": "Decompose Paper effects",
  "prompt": "Read-only research. Using the known upstream Paper shaders from https://github.com/paper-design/shaders, decompose each Paper shader into reusable visual operations/primitives: source, coordinate distortion, shape mask, noise field, color ramp, quantization/dither, halftone/grid, lighting/glow, image sampling. Return a concise grouping of primitive families and avoid suggesting 1:1 monolithic ports unless a shader truly cannot be decomposed.",
  "subagent_type": "general",
  "task_id": "",
  "command": ""
}
```

**Output:**

```
task_id: ses_214300caaffelMLcT9mQZk9OtY (for resuming to continue this task if needed)

<task_result>
Certainly, my Lord. I inspected upstream `paper-design/shaders` current `main`; it exposes 29 shader files. The useful decomposition is not “port each shader,” but build a small visual-ops library and recompose them.

**Primitive Families**
| Family | Reusable Primitives | Paper Shaders Using Them |
|---|---|---|
| Sources | `patternUV`, `objectUV`, `responsiveUV`, image UV, processed mask textures, random/noise textures | All |
| Coordinate Distortion | sine wave warp, swirl/vortex warp, polar/radial remap, caustic displacement, ribbed/fluted refraction, noise displacement | `mesh-gradient`, `warp`, `swirl`, `spiral`, `smoke-ring`, `water`, `fluted-glass`, `liquid-metal`, `gem-smoke` |
| Shape Masks | circles, rings, rounded rect border, SDF polygons, wave bands, spiral bands, blobs/metaballs, Voronoi cells, logo alpha/edge masks | `dot-grid`, `waves`, `spiral`, `pulsing-border`, `metaballs`, `voronoi`, `smoke-ring`, `liquid-metal`, `gem-smoke`, `heatmap` |
| Noise Fields | value noise, simplex noise, Perlin/fBm, texture-backed random, cellular noise, fiber/crumple/drop noise | `simplex-noise`, `perlin-noise`, `grain-gradient`, `paper-texture`, `god-rays`, `smoke-ring`, `water`, `warp`, `voronoi` |
| Color Ramps | multi-stop premultiplied ramp, radial ramp, stepped ramp, two-color threshold ramp, channel tint ramp | `mesh-gradient`, `static-*`, `simplex-noise`, `grain-gradient`, `swirl`, `warp`, `heatmap`, `gem-smoke` |
| Quantization / Dither | random threshold, Bayer 2x2/4x4/8x8, stepped color bands, luma quantization | `dithering`, `image-dithering`, `simplex-noise`, `voronoi`, `dot-orbit` |
| Halftone / Grid | square/hex cell layout, dot radius from luma, CMYK rotated screens, geometric dot glyphs | `halftone-dots`, `halftone-cmyk`, `dot-grid`, `dot-orbit` |
| Lighting / Glow | additive bloom, radial glow, inner/outer logo glow, caustic highlights, pseudo-normal lighting, metallic stripe lighting | `god-rays`, `pulsing-border`, `neuro-noise`, `water`, `paper-texture`, `liquid-metal`, `heatmap`, `gem-smoke`, `fluted-glass` |
| Image Sampling | direct sample, UV-distorted sample, directional blur, processed contour/alpha sample, original-color sampling | `water`, `paper-texture`, `fluted-glass`, `image-dithering`, `halftone-*`, `heatmap`, `liquid-metal`, `gem-smoke` |

**Shader Decomposition**
| Shader | Decompose Into |
|---|---|
| `mesh-gradient` | animated point-source field, inverse-distance color blend, center-weighted sine distortion, swirl rotation, grain edge/overlay |
| `static-mesh-gradient` | seeded point-source field, static sine warp X/Y, inverse-distance color ramp, blend sharpness, grain overlay |
| `static-radial-gradient` | focal radial distance field, sector clipping, angular/radial distortion, multi-stop ramp, grain overlay |
| `grain-gradient` | selectable scalar shape fields: wave, dots, truchet, corners, ripple, blob, sphere; fBm/grain displacement; multi-stop ramp |
| `simplex-noise` | two-layer animated simplex scalar field, stepped multi-stop color ramp |
| `perlin-noise` | 3D animated Perlin fBm source, two-color threshold ramp |
| `neuro-noise` | iterative sine/cos field, contrast/brightness shaping, mid/front glow ramp |
| `smoke-ring` | radial ring SDF, polar fBm distortion, animated noise cycling, radial color ramp |
| `metaballs` | moving circular field sources, smooth union threshold, per-ball color averaging |
| `voronoi` | animated Voronoi cell source, cell ID color ramp, edge/gap mask, inner glow |
| `waves` | sine/zigzag/irregular wave offset field, repeated stripe mask, two-color ramp |
| `warp` | base pattern mask: checks/stripes/edge, value-noise vector displacement, iterative swirl distortion, multi-stop ramp |
| `god-rays` | polar ray noise field, radial falloff, center glow, additive/alpha bloom compositing |
| `spiral` | polar spiral stripe field, stroke width/taper/cap shaping, simplex perturbation, two-color ramp |
| `swirl` | polar band field, radius-powered twist, optional simplex perturbation, multi-stop ramp |
| `dithering` | procedural scalar sources: simplex, warp, dots, wave, ripple, swirl, sphere; pixel grid quantization; random/Bayer threshold |
| `dot-grid` | regular cell grid, geometric SDF glyphs: circle/diamond/square/triangle, per-cell random size/opacity |
| `dot-orbit` | Voronoi-like cell centers, animated orbital offsets, circular dot mask, stepped color selection |
| `pulsing-border` | rounded-rect border SDF, angular moving spot fields, optional smoke noise expansion, bloom/additive blend |
| `color-panels` | pseudo-3D projected panel mask, panel depth/fade, alpha compositing, intra-panel color gradient |
| `paper-texture` | layered material noise: roughness, fiber, crumples, folds, drops; pseudo-normal lighting; optional image displacement/sample |
| `water` | simplex wave displacement, caustic iterative sine/cos field, edge-gated UV distortion, highlight overlay, optional image sample |
| `fluted-glass` | ribbed grid mask, prism/lens/contour/cascade/flat distortion curves, margin mask, directional blur, shadow/highlight strokes |
| `image-dithering` | image sample, luma extraction, random/Bayer threshold, luma quantization, palette/original-color remap |
| `halftone-dots` | image luma sampler, square/hex grid, circle/gooey/hole/soft dot masks, optional original-color sampling, grain |
| `halftone-cmyk` | RGB-to-CMYK extraction, four rotated halftone screens, per-channel flood/gain, ink compositing, grain/grid noise |
| `heatmap` | processed contour/inner/outer blur texture, animated travelling heat mask, inner/outer glow, multi-stop ramp, noise |
| `liquid-metal` | image/shape mask source, edge/contour field, animated stripe material, noise distortion, RGB dispersion, tint burn blend |
| `gem-smoke` | image/shape alpha and roundness source, inner/outer swirl fields, Gaussian blob smoke masks, multi-stop smoke ramp, inner fill |
| `color-panels` | projected panel field, depth fade, edge highlighting, alpha layering; best treated as a reusable pseudo-3D panel primitive |

**Porting Implication**
Build these as composable primitives first:

`uv source` -> `scalar/vector field` -> `mask` -> `ramp/quantize` -> `sample/light/composite`.

Only the logo/image preprocessing for `heatmap`, `liquid-metal`, and `gem-smoke` is somewhat special: those need a preprocessed texture channel contract, such as contour/edge/alpha/blur. Even there, the render shaders remain decomposable once that source texture exists.

At your service, Mr. Nickerson.
</task_result>
```

---

## Assistant (Plan · GPT-5.5 · 26.6s)

Of course, my lord. That is the better product direction.

I would treat Paper’s shaders as **reference recipes**, not as primitives. The primitives should be things a designer can reason about: fields, masks, ramps, distortions, sampling, lighting, and stylization.

**Core Principle**
A good preset should read like this:

`Image or field source` → `mask/distortion` → `color ramp` → `dither/halftone/grain/glow`

Rather than:

`paper-liquid-metal`

**Highest-Leverage Primitive Work**
| Primitive | What It Means To Designers | Unlocks |
|---|---|---|
| Scalar Field | Grayscale texture generator: simplex, perlin, value noise, tendrils, contours | `simplex-noise`, `perlin-noise`, `dithering`, `grain-gradient`, `neuro-noise` |
| Color Ramp Upgrade | Multi-stop palette mapping with smooth/stepped/soft/wrap controls | Almost every Paper preset |
| Mesh Spots Gradient | Soft animated color blobs with falloff and editable colors | `mesh-gradient`, `static-mesh-gradient`, `grain-gradient` |
| Organic Warp | Broad liquid UV distortion with swirl, distortion, center falloff | `mesh-gradient`, `warp`, `water`, `liquid-metal` |
| Polar Bands | Twisted radial bands with band count, center, noise, softness | `swirl`, parts of `warp` |
| Spiral Stripe Mask | Spiral field with stroke width, taper, cap, noise, softness | `spiral` |
| Voronoi Cells | Colored cells with gaps, glow, animated centers | `voronoi`, `dot-orbit` |
| Dot/Grid Glyphs | Grid of circles, squares, diamonds, triangles with random size/opacity | `dot-grid`, `halftone-dots`, `dot-orbit` |
| Halftone Screen | Luma-driven dot screens, plus CMYK rotated screen mode | `halftone-dots`, `halftone-cmyk` |
| Image Analysis | Image luma, alpha, edge, blur, contour, original-color passthrough | `heatmap`, `image-dithering`, `gem-smoke`, `liquid-metal` |
| Perimeter Runner | Animated spots moving around a rounded-rect path | `pulsing-border` |
| Perspective Panels | Pseudo-3D rotating translucent panels | `color-panels` |
| Material Noise | Fiber, crumple, fold, paper grain, drops | `paper-texture` |
| Lighting / Glow | Inner glow, outer glow, bloom, caustic highlights, chrome relief | `god-rays`, `water`, `liquid-metal`, `gem-smoke`, `heatmap` |

**Preset Direction**
| Paper Shader | Preferred Preset Stack |
|---|---|
| `mesh-gradient` | Mesh Spots Gradient → Organic Warp → Grain |
| `static-mesh-gradient` | Mesh Spots Gradient with static positions → Grain |
| `simplex-noise` | Scalar Field → Color Ramp |
| `perlin-noise` | Scalar Field → Threshold/Color Ramp |
| `neuro-noise` | Tendril Scalar Field → Glow/Color Ramp |
| `swirl` | Polar Bands → Color Ramp |
| `spiral` | Spiral Stripe Mask → Two-Color Ramp |
| `voronoi` | Voronoi Cells → Gap/Glow → Color Ramp |
| `waves` | Wave Stripe Mask → Two-Color Ramp |
| `warp` | Base Pattern Mask → Organic Warp → Color Ramp |
| `dithering` | Scalar Field → Dither |
| `image-dithering` | Image Source → Luma → Dither |
| `heatmap` | Image Source → Luma/Contour → Color Ramp → Glow |
| `halftone-dots` | Image Source → Luma → Halftone Screen |
| `halftone-cmyk` | Image Source → CMYK Split → Halftone Screen |
| `liquid-metal` | Image/Shape Mask → Organic Warp → Chrome Relief → Color Ramp |
| `paper-texture` | Image Source → Material Noise → Multiply/Overlay |
| `water` | Image Source → Water Distortion → Caustic Highlights |
| `god-rays` | Ray Field → Radial Falloff → Bloom |
| `pulsing-border` | Perimeter Runner → Smoke/Glow |
| `color-panels` | Perspective Panels → Palette/Alpha Composite |

**My Recommendation**
If I may be so bold, sire: keep the existing direct Paper ports temporarily as internal visual references, but stop presenting them as the ideal architecture. The product should move toward a smaller vocabulary of powerful primitives.

The first implementation phase should be:

1. Upgrade `color-ramp`.
2. Add `scalar-field`.
3. Add `mesh-spots-gradient`.
4. Add `organic-warp`.
5. Add image analysis primitives: `image-luma`, `image-alpha`, `image-edge/contour`.
6. Upgrade `halftone` and `dither` to cover Paper-style variants.
7. Rewrite Paper presets as readable stacks and tag any remaining monolithic/reference-only ones.

That gives us the clearest path to “make shaders like Paper” without merely embedding Paper wholesale. How else may I serve, my lord?

---

## User

yeah that make senses to me. can you draft a comprehensive plan that a junior engineer could follow?

---

## Assistant (Plan · GPT-5.5 · 34.4s)

Of course, Mr. Nickerson.

**Goal**
Turn Paper-style shaders into readable preset recipes made from reusable primitives, not 1:1 monolithic shader ports.

Relevant current files:

| Area                           | File                                                    |
| ------------------------------ | ------------------------------------------------------- |
| Presets                        | `src/lib/shader-composer/paper-presets.ts:63`           |
| Layer registry                 | `src/lib/shader-composer/layers/index.ts:1`             |
| Uniform types                  | `src/lib/shader-composer/types.ts:3`                    |
| Shader generation              | `src/lib/shader-composer/generator.ts:29`               |
| Image preview binding          | `src/components/shader-composer/shader-preview.tsx:187` |
| Export gap for images/palettes | `src/lib/shader-composer/generator.ts:332`              |

**Product Rule**
Every Paper preset should be expressible as:

```txt
source → field/mask → distortion → color/stylize → lighting/composite
```

Avoid adding `paper-liquid-metal`, `paper-water`, etc. unless a shader truly cannot be expressed through reusable parts.

**Phase 1: Foundation**

1. Keep existing Paper ports as internal references only.
2. Add a preset fidelity model that distinguishes recipe quality.
3. Suggested fidelity labels:
   - `primitive`: built from reusable primitives and intended as the canonical version.
   - `reference`: monolithic Paper-like port kept only for comparison.
   - `approx`: close visual family, missing one or more primitive capabilities.
4. Update preset descriptions so users see what building blocks are used.
5. Do not expose monolithic Paper ports as the main design pattern.

**Phase 2: Image Support**
Current editor preview already supports `sampler2D` in `shader-preview.tsx:187`, but generated exports skip images and palettes in `generator.ts:332`.

Implementation tasks:

1. Add export support for `sampler2D`.
2. Add export support for `vec4Array`.
3. Ensure exported React components can accept:
   - `HTMLImageElement`
   - image URL string
   - optional fit/scale/offset/rotation values
4. Ensure exported vanilla code can bind image textures too.
5. Keep `image-source` as the only primitive that loads images directly.
6. Add image-derived primitives that consume previous pass output:
   - `image-luma`
   - `image-alpha`
   - `image-contour`
   - `image-edge`
   - `image-blur` or reuse existing blur layers if suitable

Acceptance criteria:

1. `image-source → color-ramp` works in editor and exported React.
2. `image-source → dither` works in editor and exported React.
3. No generated shader silently drops image uniforms.

**Phase 3: High-Leverage Primitive Additions**
Implement these before rewriting most presets.

| Primitive          | Layer ID Suggestion   | Purpose                                           |
| ------------------ | --------------------- | ------------------------------------------------- |
| Scalar Field       | `scalar-field`        | Grayscale procedural field with noise/shape modes |
| Color Ramp v2      | `color-ramp` upgrade  | Smooth/stepped/soft/wrapped multi-stop palettes   |
| Mesh Spots         | `mesh-spots-gradient` | Soft animated color blobs                         |
| Organic Warp       | `organic-warp`        | Large liquid distortion/swirl                     |
| Polar Bands        | `polar-bands`         | Twisted radial bands                              |
| Spiral Stripe      | `spiral-stripe`       | Spiral mask with stroke controls                  |
| Voronoi Cells      | `voronoi-cells`       | Colored cells, gaps, glow                         |
| Dot Glyph Grid     | `dot-glyph-grid`      | Grid of circle/square/diamond/triangle glyphs     |
| Halftone Screen    | `halftone-screen`     | Luma-driven dots and CMYK mode                    |
| Material Noise     | `material-noise`      | Paper fibers, folds, crumples, grain              |
| Perimeter Runner   | `perimeter-runner`    | Animated lights around a rounded rect             |
| Perspective Panels | `perspective-panels`  | Rotating translucent panels                       |
| Chrome Relief      | `chrome-relief`       | Luma/edge-based metallic lighting                 |
| Glow Field         | `glow-field`          | Inner/outer glow, bloom, ray-style light          |

**Phase 4: Primitive Details**
`scalar-field`

Add modes:

```txt
simplex
perlin
fbm
tendrils
rings
waves
ripples
blobs
contours
sphere
```

Suggested uniforms:

```txt
mode
scale
speed
octaves
persistence
lacunarity
contrast
brightness
seed
```

Use for:

```txt
simplex-noise
perlin-noise
dithering
grain-gradient
neuro-noise
smoke-ring
```

`color-ramp`

Add controls:

```txt
colors
steps
stepsPerColor
softness
domainMin
domainMax
channel
wrap
premultiplyAlpha
```

Use for:

```txt
simplex-noise
heatmap
liquid-metal
grain-gradient
swirl
warp
gem-smoke
```

`mesh-spots-gradient`

Suggested controls:

```txt
colors
spotCount
falloff
softness
motion
speed
seed
staticPositions
```

Use for:

```txt
mesh-gradient
static-mesh-gradient
grain-gradient
```

`organic-warp`

Suggested controls:

```txt
distortion
swirl
scale
speed
centerFalloff
iterations
noiseAmount
```

Use for:

```txt
mesh-gradient
warp
water
liquid-metal
fluted-glass
```

`halftone-screen`

Suggested controls:

```txt
grid
shape
size
angle
contrast
softness
originalColors
inverted
cmyk
```

Use for:

```txt
halftone-dots
halftone-cmyk
image-dithering
dot-grid
```

**Phase 5: Rewrite Paper Presets As Recipes**
Replace current approximate/placeholder stacks in `src/lib/shader-composer/paper-presets.ts:63`.

Target recipe examples:

| Paper Preset           | New Recipe                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- |
| `mesh-gradient`        | `mesh-spots-gradient → organic-warp → grain`                                  |
| `static-mesh-gradient` | `mesh-spots-gradient(static) → grain`                                         |
| `simplex-noise`        | `scalar-field(simplex) → color-ramp`                                          |
| `perlin-noise`         | `scalar-field(perlin/fbm) → color-ramp`                                       |
| `neuro-noise`          | `scalar-field(tendrils) → color-ramp → glow-field`                            |
| `swirl`                | `polar-bands → color-ramp`                                                    |
| `spiral`               | `spiral-stripe → color-ramp`                                                  |
| `voronoi`              | `voronoi-cells → color-ramp/glow`                                             |
| `waves`                | `scalar-field(waves) → color-ramp`                                            |
| `warp`                 | `dot/check pattern → organic-warp → color-ramp`                               |
| `dithering`            | `scalar-field → dither`                                                       |
| `image-dithering`      | `image-source → image-luma → dither`                                          |
| `heatmap`              | `image-source → image-luma/contour → color-ramp → glow-field`                 |
| `halftone-dots`        | `image-source → image-luma → halftone-screen`                                 |
| `halftone-cmyk`        | `image-source → halftone-screen(cmyk)`                                        |
| `liquid-metal`         | `image-source/shape → image-edge → organic-warp → chrome-relief → color-ramp` |
| `paper-texture`        | `image-source → material-noise → overlay/multiply`                            |
| `water`                | `image-source → organic-warp/water-ripple → glow-field(caustics)`             |
| `god-rays`             | `scalar-field(rays) → radial mask → glow-field`                               |
| `pulsing-border`       | `perimeter-runner → glow-field`                                               |
| `color-panels`         | `perspective-panels → color-ramp/composite`                                   |

**Phase 6: Implementation Order**
Recommended order for a junior engineer:

1. Add export support for `sampler2D` and `vec4Array`.
2. Upgrade `color-ramp`.
3. Add `scalar-field`.
4. Rebuild `simplex-noise`, `perlin-noise`, `dithering`, and `heatmap` presets.
5. Add `mesh-spots-gradient`.
6. Add `organic-warp`.
7. Rebuild `mesh-gradient`, `static-mesh-gradient`, `grain-gradient`, and `warp`.
8. Add image analysis layers.
9. Rebuild `image-dithering`, `halftone-dots`, `paper-texture`, `water`.
10. Add specialized-but-reusable primitives: `perimeter-runner`, `perspective-panels`, `chrome-relief`.
11. Rebuild `pulsing-border`, `color-panels`, `liquid-metal`, `gem-smoke`.

**Phase 7: Validation**
For each new primitive:

1. Add one minimal preset using only that primitive.
2. Add one Paper-style preset using it in a stack.
3. Run `npm run build`.
4. Run the shader generator over every Paper preset.
5. Verify no GLSL compile errors in browser.
6. Verify image presets work with uploaded image, pasted URL, and empty placeholder.
7. Compare visually against Paper references only as guidance, not as a strict porting requirement.

**Definition Of Done**
The work is complete when:

1. Every Paper shader has a preset recipe.
2. Most recipes are built from reusable primitives, not monolithic Paper ports.
3. Image-based presets work in editor preview and generated exports.
4. `liquid-metal`, `gem-smoke`, `fluted-glass`, and `halftone-cmyk` no longer require placeholder approximations.
5. A designer can open a Paper-style preset and understand the layer stack from the layer names alone.

If I may be so bold, I would start with `color-ramp`, `scalar-field`, and image export support. Those three unlock the most presets with the least architectural risk. How else may I serve, my lord?

---

## User

lets build it

---

## Assistant (Build · Kimi K2.6 · 5.6s)

---

## User

lets do it

---

## Assistant (Build · GLM-5.1 · 18.7s)

**Tool: todowrite**

**Input:**

```json
{
  "todos": [
    {
      "content": "Add export support for sampler2D and vec4Array in generator.ts",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Upgrade color-ramp with stepped/soft/wrap controls",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Add scalar-field primitive",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Add mesh-spots-gradient primitive",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Add organic-warp distorter primitive",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Add image analysis layers (image-luma, image-edge, image-contour)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Add halftone-screen primitive (dots + CMYK mode)",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add polar-bands primitive",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add spiral-stripe primitive",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add perimeter-runner primitive",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add perspective-panels primitive",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add chrome-relief and glow-field primitives",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Add material-noise primitive",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Rewrite paper-presets.ts as primitive-based recipes",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Validate: npm run build + browser check",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**

```
[
  {
    "content": "Add export support for sampler2D and vec4Array in generator.ts",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Upgrade color-ramp with stepped/soft/wrap controls",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Add scalar-field primitive",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Add mesh-spots-gradient primitive",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Add organic-warp distorter primitive",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Add image analysis layers (image-luma, image-edge, image-contour)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Add halftone-screen primitive (dots + CMYK mode)",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add polar-bands primitive",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add spiral-stripe primitive",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add perimeter-runner primitive",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add perspective-panels primitive",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add chrome-relief and glow-field primitives",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Add material-noise primitive",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Rewrite paper-presets.ts as primitive-based recipes",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Validate: npm run build + browser check",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Build · GLM-5.1 · 4.5s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/_helpers.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/_helpers.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition, BlendMode } from '../types'
2:
3: type LayerCategory = LayerDefinition['category']
4: type FactoryOpts = { consumesPrevPass?: boolean; defaultBlendMode?: BlendMode }
5: type LayerInput = Omit<LayerDefinition, 'category' | 'defaultBlendMode' | 'consumesPrevPass'>
6:
7: const make =
8:   (category: LayerCategory, opts: FactoryOpts = {}) =>
9:   (def: LayerInput): LayerDefinition => ({
10:     ...def,
11:     category,
12:     defaultBlendMode: opts.defaultBlendMode ?? 'normal',
13:     consumesPrevPass: opts.consumesPrevPass,
14:   })
15:
16: export const gen = make('generator')
17: export const distorter = make('distorter', { consumesPrevPass: true })
18: export const fx = make('effect', { consumesPrevPass: true })
19: export const baseFx = make('effect')
20: export const colorFx = make('modifier')
21: export const sampleFx = make('modifier', { consumesPrevPass: true })
22:
23: export const SCREEN_P = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
24: vec2 p = (uv - 0.5) * _ar;`
25:
26: export const TEX_SIZE = `vec2 texel = 1.0 / u_resolution;`

(End of file - total 26 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { colorFx, sampleFx } from './_helpers'
3:
4: export const hueShiftLayer = colorFx({
5:   id: 'hue-shift',
6:   name: 'Hue Shift',
7:   description: 'Rotate the hue wheel',
8:   color: '#a855f7',
9:   uniforms: [
10:     { name: 'amount', label: 'Hue', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
11:   ],
12:   glsl: {
13:     dependencies: ['rgb2hsv', 'hsv2rgb'],
14:     main: `
15: vec3 h = rgb2hsv(base.rgb);
16: h.x = fract(h.x + {{amount}} / 360.0);
17: return vec4(hsv2rgb(h), base.a);`,
18:   },
19: })
20:
21: export const saturationLayer = colorFx({
22:   id: 'saturation',
23:   name: 'Saturation',
24:   description: 'Adjust saturation',
25:   color: '#a855f7',
26:   uniforms: [
27:     { name: 'amount', label: 'Saturation', type: 'float', default: 1.0, ui: { min: 0, max: 3, step: 0.01 } },
28:   ],
29:   glsl: {
30:     dependencies: ['luma'],
31:     main: `
32: float lum = luma(base.rgb);
33: return vec4(mix(vec3(lum), base.rgb, {{amount}}), base.a);`,
34:   },
35: })
36:
37: export const vibranceLayer = colorFx({
38:   id: 'vibrance',
39:   name: 'Vibrance',
40:   description: 'Saturate less-saturated colors more',
41:   color: '#a855f7',
42:   uniforms: [
43:     { name: 'amount', label: 'Vibrance', type: 'float', default: 0.5, ui: { min: -1, max: 2, step: 0.01 } },
44:   ],
45:   glsl: {
46:     dependencies: ['luma'],
47:     main: `
48: float mx = max(base.r, max(base.g, base.b));
49: float mn = min(base.r, min(base.g, base.b));
50: float sat = mx - mn;
51: float lum = luma(base.rgb);
52: float w = (1.0 - sat) * {{amount}};
53: return vec4(mix(vec3(lum), base.rgb, 1.0 + w), base.a);`,
54:   },
55: })
56:
57: export const brightnessContrastLayer = colorFx({
58:   id: 'brightness-contrast',
59:   name: 'Brightness/Contrast',
60:   description: 'Brightness and contrast adjustment',
61:   color: '#a855f7',
62:   uniforms: [
63:     { name: 'brightness', label: 'Brightness', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },
64:     { name: 'contrast', label: 'Contrast', type: 'float', default: 1.0, ui: { min: 0, max: 3, step: 0.01 } },
65:   ],
66:   glsl: {
67:     main: `
68: vec3 col = (base.rgb - 0.5) * {{contrast}} + 0.5 + {{brightness}};
69: return vec4(col, base.a);`,
70:   },
71: })
72:
73: export const sharpnessLayer = sampleFx({
74:   id: 'sharpness',
75:   name: 'Sharpness',
76:   description: 'Edge-aware sharpening (unsharp mask)',
77:   color: '#a855f7',
78:   uniforms: [
79:     { name: 'amount', label: 'Amount', type: 'float', default: 0.5, ui: { min: 0, max: 3, step: 0.01 } },
80:   ],
81:   glsl: {
82:     main: `
83: vec2 texel = 1.0 / u_resolution;
84: vec3 c  = texture(u_prevPass, uv).rgb;
85: vec3 n1 = texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb;
86: vec3 n2 = texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb;
87: vec3 n3 = texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb;
88: vec3 n4 = texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb;
89: vec3 blurred = (n1 + n2 + n3 + n4) * 0.25;
90: return vec4(c + (c - blurred) * {{amount}}, 1.0);`,
91:   },
92: })
93:
94: export const tintLayer = colorFx({
95:   id: 'tint',
96:   name: 'Tint',
97:   description: 'Tint with a single color',
98:   color: '#a855f7',
99:   uniforms: [
100:     { name: 'color', label: 'Color', type: 'vec3', default: [1.0, 0.7, 0.4], ui: { color: true } },
101:     { name: 'amount', label: 'Amount', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
102:   ],
103:   glsl: {
104:     main: `
105: return vec4(mix(base.rgb, base.rgb * {{color}} * 1.4, {{amount}}), base.a);`,
106:   },
107: })
108:
109: export const duotoneLayer = colorFx({
110:   id: 'duotone',
111:   name: 'Duotone',
112:   description: 'Map luminance to a 2-color gradient',
113:   color: '#a855f7',
114:   uniforms: [
115:     { name: 'color1', label: 'Shadow', type: 'vec3', default: [0.05, 0.0, 0.3], ui: { color: true } },
116:     { name: 'color2', label: 'Highlight', type: 'vec3', default: [1.0, 0.85, 0.5], ui: { color: true } },
117:   ],
118:   glsl: {
119:     dependencies: ['luma'],
120:     main: `
121: float lum = luma(base.rgb);
122: return vec4(mix({{color1}}, {{color2}}, lum), base.a);`,
123:   },
124: })
125:
126: export const tritoneLayer = colorFx({
127:   id: 'tritone',
128:   name: 'Tritone',
129:   description: 'Three-tone luminance map',
130:   color: '#a855f7',
131:   uniforms: [
132:     { name: 'color1', label: 'Shadow', type: 'vec3', default: [0.05, 0.0, 0.2], ui: { color: true } },
133:     { name: 'color2', label: 'Mid', type: 'vec3', default: [0.7, 0.3, 0.5], ui: { color: true } },
134:     { name: 'color3', label: 'Highlight', type: 'vec3', default: [1.0, 0.95, 0.7], ui: { color: true } },
135:     { name: 'midPoint', label: 'Mid', type: 'float', default: 0.5, ui: { min: 0.05, max: 0.95, step: 0.01 } },
136:   ],
137:   glsl: {
138:     dependencies: ['luma'],
139:     main: `
140: float lum = luma(base.rgb);
141: vec3 col = lum < {{midPoint}}
142:   ? mix({{color1}}, {{color2}}, lum / max({{midPoint}}, 1e-4))
143:   : mix({{color2}}, {{color3}}, (lum - {{midPoint}}) / max(1.0 - {{midPoint}}, 1e-4));
144: return vec4(col, base.a);`,
145:   },
146: })
147:
148: export const solarizeLayer = colorFx({
149:   id: 'solarize',
150:   name: 'Solarize',
151:   description: 'Invert tones above a threshold',
152:   color: '#a855f7',
153:   uniforms: [
154:     { name: 'threshold', label: 'Threshold', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
155:   ],
156:   glsl: {
157:     main: `
158: vec3 col = mix(base.rgb, 1.0 - base.rgb, step({{threshold}}, base.rgb));
159: return vec4(col, base.a);`,
160:   },
161: })
162:
163: export const invertLayer = colorFx({
164:   id: 'invert',
165:   name: 'Invert',
166:   description: 'Color inversion',
167:   color: '#a855f7',
168:   uniforms: [
169:     { name: 'amount', label: 'Amount', type: 'float', default: 1.0, ui: { min: 0, max: 1, step: 0.01 } },
170:   ],
171:   glsl: {
172:     main: `
173: return vec4(mix(base.rgb, 1.0 - base.rgb, {{amount}}), base.a);`,
174:   },
175: })
176:
177: export const grayscaleLayer = colorFx({
178:   id: 'grayscale',
179:   name: 'Grayscale',
180:   description: 'Desaturate to luminance',
181:   color: '#a855f7',
182:   uniforms: [
183:     { name: 'amount', label: 'Amount', type: 'float', default: 1.0, ui: { min: 0, max: 1, step: 0.01 } },
184:   ],
185:   glsl: {
186:     dependencies: ['luma'],
187:     main: `
188: float lum = luma(base.rgb);
189: return vec4(mix(base.rgb, vec3(lum), {{amount}}), base.a);`,
190:   },
191: })
192:
193: export const chromaticAberration2Layer = sampleFx({
194:   id: 'chromatic-aberration-2',
195:   name: 'Chromatic Aberration (Sep.)',
196:   description: 'True separable RGB-channel offset',
197:   color: '#ef4444',
198:   uniforms: [
199:     { name: 'redOffsetX', label: 'Red X', type: 'float', default: 0.005, ui: { min: -0.05, max: 0.05, step: 0.001 } },
200:     { name: 'redOffsetY', label: 'Red Y', type: 'float', default: 0.0, ui: { min: -0.05, max: 0.05, step: 0.001 } },
201:     { name: 'greenOffsetX', label: 'Green X', type: 'float', default: 0.0, ui: { min: -0.05, max: 0.05, step: 0.001 } },
202:     { name: 'greenOffsetY', label: 'Green Y', type: 'float', default: 0.0, ui: { min: -0.05, max: 0.05, step: 0.001 } },
203:     { name: 'blueOffsetX', label: 'Blue X', type: 'float', default: -0.005, ui: { min: -0.05, max: 0.05, step: 0.001 } },
204:     { name: 'blueOffsetY', label: 'Blue Y', type: 'float', default: 0.0, ui: { min: -0.05, max: 0.05, step: 0.001 } },
205:   ],
206:   glsl: {
207:     main: `
208: float r = texture(u_prevPass, uv + vec2({{redOffsetX}}, {{redOffsetY}})).r;
209: float g = texture(u_prevPass, uv + vec2({{greenOffsetX}}, {{greenOffsetY}})).g;
210: float b = texture(u_prevPass, uv + vec2({{blueOffsetX}}, {{blueOffsetY}})).b;
211: return vec4(r, g, b, 1.0);`,
212:   },
213: })
214:
215: export const chromaFlowLayer = colorFx({
216:   id: 'chroma-flow',
217:   name: 'Chroma Flow',
218:   description: 'Animated chromatic flow tint',
219:   color: '#a855f7',
220:   uniforms: [
221:     { name: 'amount', label: 'Amount', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },
222:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.5, max: 10, step: 0.1 } },
223:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
224:   ],
225:   glsl: {
226:     main: `
227: float t = u_time * {{speed}};
228: vec3 tint = 0.5 + 0.5 * cos(uv.xyx * {{scale}} * 6.28318 + t + vec3(0.0, 2.094, 4.188));
229: return vec4(mix(base.rgb, base.rgb * tint, {{amount}}), base.a);`,
230:   },
231: })
232:
233: // N-color stepped/smooth ramp. Reads previous-pass scalar (default: luma)
234: // and maps to a 1..10-stop palette. The single highest-leverage atom for
235: // reproducing Paper presets that use `colors[N]` arrays.
236: export const colorRampLayer = sampleFx({
237:   id: 'color-ramp',
238:   name: 'Color Ramp',
239:   description: 'Map a scalar (luma or RGBA channel) through an N-stop palette',
240:   color: '#f59e0b',
241:   uniforms: [
242:     {
243:       name: 'colors',
244:       label: 'Colors',
245:       type: 'vec4Array',
246:       arrayLength: 10,
247:       default: {
248:         values: [
249:           [0.05, 0.05, 0.1, 1],
250:           [0.4, 0.6, 1.0, 1],
251:           [1.0, 0.95, 0.85, 1],
252:         ],
253:         length: 3,
254:       },
255:       ui: { array: { minLength: 1, maxLength: 10 } },
256:     },
257:     {
258:       name: 'channel',
259:       label: 'Channel',
260:       type: 'int',
261:       default: 0,
262:       ui: { min: 0, max: 4, step: 1 },
263:     },
264:     {
265:       name: 'steps',
266:       label: 'Steps',
267:       type: 'int',
268:       default: 0,
269:       ui: { min: 0, max: 16, step: 1 },
270:     },
271:     {
272:       name: 'domainMin',
273:       label: 'Domain Min',
274:       type: 'float',
275:       default: 0,
276:       ui: { min: 0, max: 1, step: 0.01 },
277:     },
278:     {
279:       name: 'domainMax',
280:       label: 'Domain Max',
281:       type: 'float',
282:       default: 1,
283:       ui: { min: 0, max: 1, step: 0.01 },
284:     },
285:   ],
286:   glsl: {
287:     dependencies: ['luma', 'colorRampLookup'],
288:     main: `
289: vec4 src = texture(u_prevPass, uv);
290: float scalar;
291: int ch = {{channel}};
292: if (ch == 0) scalar = luma(src.rgb);
293: else if (ch == 1) scalar = src.r;
294: else if (ch == 2) scalar = src.g;
295: else if (ch == 3) scalar = src.b;
296: else scalar = src.a;
297: float span = max({{domainMax}} - {{domainMin}}, 1e-4);
298: float t = clamp((scalar - {{domainMin}}) / span, 0.0, 1.0);
299: return colorRampLookup(t, {{colors}}, {{colors}}_count, {{steps}});`,
300:   },
301: })
302:
303: // Replaces previous-pass with vec4(luma, luma, luma, 1.0) so downstream
304: // dither/threshold/ramp consumers see a clean scalar.
305: export const luminanceTapLayer = sampleFx({
306:   id: 'luminance-tap',
307:   name: 'Luminance Tap',
308:   description: 'Replace previous pass with its luminance',
309:   color: '#f59e0b',
310:   uniforms: [],
311:   glsl: {
312:     dependencies: ['luma'],
313:     main: `
314: float lum = luma(texture(u_prevPass, uv).rgb);
315: return vec4(lum, lum, lum, 1.0);`,
316:   },
317:   outputKind: 'scalar',
318: })
319:
320: // CMYK channel separation. Output mode 0 = grayscale (channel as luma);
321: // mode 1 = tinted (full CMYK process color). Stack four with mode=1 +
322: // halftone effects for a CMYK halftone print look.
323: export const cmykSeparateLayer = sampleFx({
324:   id: 'cmyk-separate',
325:   name: 'CMYK Separate',
326:   description: 'Output a single CMYK channel from previous pass',
327:   color: '#f59e0b',
328:   uniforms: [
329:     {
330:       name: 'channel',
331:       label: 'Channel',
332:       type: 'int',
333:       default: 0,
334:       ui: { min: 0, max: 3, step: 1 },
335:     },
336:     {
337:       name: 'mode',
338:       label: 'Mode',
339:       type: 'int',
340:       default: 0,
341:       ui: { min: 0, max: 1, step: 1 },
342:     },
343:   ],
344:   glsl: {
345:     main: `
346: vec3 rgb = texture(u_prevPass, uv).rgb;
347: float k = 1.0 - max(rgb.r, max(rgb.g, rgb.b));
348: vec4 cmyk = vec4(0.0);
349: float denom = max(1.0 - k, 1e-4);
350: cmyk.x = (1.0 - rgb.r - k) / denom; // C
351: cmyk.y = (1.0 - rgb.g - k) / denom; // M
352: cmyk.z = (1.0 - rgb.b - k) / denom; // Y
353: cmyk.w = k;
354: int ch = {{channel}};
355: float v = ch == 0 ? cmyk.x : ch == 1 ? cmyk.y : ch == 2 ? cmyk.z : cmyk.w;
356: v = clamp(v, 0.0, 1.0);
357: if ({{mode}} == 0) return vec4(v, v, v, 1.0);
358: vec3 tints[4];
359: tints[0] = vec3(0.0, 0.7, 0.95); // C
360: tints[1] = vec3(0.95, 0.1, 0.5); // M
361: tints[2] = vec3(0.95, 0.85, 0.1); // Y
362: tints[3] = vec3(0.0, 0.0, 0.0);   // K
363: vec3 tint = tints[0];
364: if (ch == 1) tint = tints[1];
365: else if (ch == 2) tint = tints[2];
366: else if (ch == 3) tint = tints[3];
367: return vec4(mix(vec3(1.0), tint, v), 1.0);`,
368:   },
369: })
370:
371: export const COLOR_LAYERS: Record<string, LayerDefinition> = {
372:   'hue-shift': hueShiftLayer,
373:   saturation: saturationLayer,
374:   vibrance: vibranceLayer,
375:   'brightness-contrast': brightnessContrastLayer,
376:   sharpness: sharpnessLayer,
377:   tint: tintLayer,
378:   duotone: duotoneLayer,
379:   tritone: tritoneLayer,
380:   solarize: solarizeLayer,
381:   invert: invertLayer,
382:   grayscale: grayscaleLayer,
383:   'chromatic-aberration-2': chromaticAberration2Layer,
384:   'chroma-flow': chromaFlowLayer,
385:   'color-ramp': colorRampLayer,
386:   'luminance-tap': luminanceTapLayer,
387:   'cmyk-separate': cmykSeparateLayer,
388: }

(End of file - total 388 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2:
3: const screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
4: vec2 p = (uv - 0.5) * _ar;`
5:
6: // Plasma — multi-octave layered sin/cos pattern; designer favourite for
7: // liquid colour wash backgrounds.
8: export const plasmaLayer: LayerDefinition = {
9:   id: 'plasma',
10:   name: 'Plasma',
11:   description: 'Multi-octave colour wash — soft, liquid background',
12:   color: '#ec4899',
13:   category: 'generator',
14:   defaultBlendMode: 'normal',
15:   uniforms: [
16:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.95, 0.3, 0.6], ui: { color: true } },
17:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.3, 0.5, 0.95], ui: { color: true } },
18:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.6, 0.95, 0.7], ui: { color: true } },
19:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.5, max: 20, step: 0.1 } },
20:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
21:   ],
22:   glsl: {
23:     main: `
24: ${screenP}
25: float t = u_time * {{speed}};
26: vec2 q = p * {{scale}};
27: float v =  sin(q.x + t);
28: v += sin((q.y + t) * 0.5);
29: v += sin((q.x + q.y + t) * 0.5);
30: vec2 c = q + 0.5 * vec2(sin(t * 0.3), cos(t * 0.4));
31: v += sin(length(c) + t);
32: v *= 0.25;
33: float a = 0.5 + 0.5 * sin(v * 3.14159);
34: float b = 0.5 + 0.5 * cos(v * 3.14159);
35: vec3 col = mix(mix({{color1}}, {{color2}}, a), {{color3}}, b);
36: return vec4(col, 1.0);`,
37:   },
38: }
39:
40: // Perlin Noise (3D, time as z) — classic FBM via simplex2D treated as gradient.
41: // Reuses simplex2D helper from glsl-utils.
42: export const perlinNoiseLayer: LayerDefinition = {
43:   id: 'perlin-noise',
44:   name: 'Perlin Noise',
45:   description: 'Animated FBM noise mapped to two colours',
46:   color: '#8b5cf6',
47:   category: 'generator',
48:   defaultBlendMode: 'normal',
49:   uniforms: [
50:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.05, 0.05, 0.1], ui: { color: true } },
51:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.85, 0.95, 1.0], ui: { color: true } },
52:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.1, max: 30, step: 0.1 } },
53:     { name: 'octaves', label: 'Octaves', type: 'float', default: 5.0, ui: { min: 1, max: 8, step: 1 } },
54:     { name: 'persistence', label: 'Persistence', type: 'float', default: 0.5, ui: { min: 0.1, max: 1, step: 0.01 } },
55:     { name: 'lacunarity', label: 'Lacunarity', type: 'float', default: 2.0, ui: { min: 1.1, max: 4, step: 0.1 } },
56:     { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },
57:   ],
58:   glsl: {
59:     dependencies: ['simplex2D'],
60:     main: `
61: ${screenP}
62: vec2 q = p * {{scale}} + u_time * {{speed}} * 0.3;
63: float sum = 0.0;
64: float amp = 1.0;
65: float freq = 1.0;
66: float maxAmp = 0.0;
67: for (int i = 0; i < 8; i++) {
68:   if (float(i) >= {{octaves}}) break;
69:   sum += simplex2D(q * freq) * amp;
70:   maxAmp += amp;
71:   amp *= {{persistence}};
72:   freq *= {{lacunarity}};
73: }
74: float n = (sum / max(maxAmp, 1e-4)) * 0.5 + 0.5;
75: return vec4(mix({{color1}}, {{color2}}, n), 1.0);`,
76:   },
77: }
78:
79: // FlowField — vector field magnitude rendered as a swirling gradient.
80: export const flowFieldLayer: LayerDefinition = {
81:   id: 'flow-field',
82:   name: 'Flow Field',
83:   description: 'Curl-noise flow magnitude visualised as colour',
84:   color: '#06b6d4',
85:   category: 'generator',
86:   defaultBlendMode: 'normal',
87:   uniforms: [
88:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.1, 0.05, 0.2], ui: { color: true } },
89:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.2, 0.7, 0.9], ui: { color: true } },
90:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.5, max: 20, step: 0.1 } },
91:     { name: 'iterations', label: 'Iterations', type: 'float', default: 4.0, ui: { min: 1, max: 12, step: 1 } },
92:     { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },
93:   ],
94:   glsl: {
95:     dependencies: ['simplex2D'],
96:     main: `
97: ${screenP}
98: vec2 q = p * {{scale}};
99: float t = u_time * {{speed}};
100: for (int i = 0; i < 12; i++) {
101:   if (float(i) >= {{iterations}}) break;
102:   float a = simplex2D(q + t) * 6.28318;
103:   q += vec2(cos(a), sin(a)) * 0.15;
104: }
105: float v = simplex2D(q) * 0.5 + 0.5;
106: return vec4(mix({{color1}}, {{color2}}, v), 1.0);`,
107:   },
108: }
109:
110: // Aurora — domain-warped trig-fold noise (Paper "neuro noise" family).
111: // 15 iterations with exponential scale growth and an accumulating sine sum
112: // produces tendril-like networks rather than smooth bands.
113: export const auroraLayer: LayerDefinition = {
114:   id: 'aurora',
115:   name: 'Aurora',
116:   description: 'Glowing domain-warped synaptic / aurora-borealis pattern',
117:   color: '#22d3ee',
118:   category: 'generator',
119:   defaultBlendMode: 'normal',
120:   uniforms: [
121:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.0, 0.08], ui: { color: true } },
122:     { name: 'colorMid', label: 'Mid', type: 'vec3', default: [0.1, 0.3, 0.9], ui: { color: true } },
123:     { name: 'colorFront', label: 'Front', type: 'vec3', default: [0.85, 0.95, 1.0], ui: { color: true } },
124:     { name: 'scale', label: 'Scale', type: 'float', default: 1.0, ui: { min: 0.1, max: 6, step: 0.05 } },
125:     { name: 'brightness', label: 'Brightness', type: 'float', default: 1.2, ui: { min: 0.1, max: 4, step: 0.05 } },
126:     { name: 'contrast', label: 'Contrast', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },
127:     { name: 'speed', label: 'Speed', type: 'float', default: 0.3, ui: { min: 0, max: 4, step: 0.05 } },
128:   ],
129:   glsl: {
130:     main: `
131: ${screenP}
132: vec2 q = p * 1.5 / {{scale}};
133: float t = u_time * {{speed}};
134: float scaleMul = 1.0;
135: float sineAcc = 0.0;
136: for (int i = 0; i < 15; i++) {
137:   q = vec2(q.x + sin(q.y + t), q.y + cos(q.x + t * 1.3));
138:   q *= 1.2;
139:   scaleMul *= 1.2;
140:   sineAcc += abs(sin(q.x * 0.5)) + abs(cos(q.y * 0.5));
141: }
142: float v = sineAcc / 30.0;
143: v = pow(clamp(v * v * {{contrast}}, 0.0, 1.0), 0.7) * {{brightness}};
144: vec3 col = mix({{colorBack}}, {{colorMid}}, smoothstep(0.0, 0.5, v));
145: col = mix(col, {{colorFront}}, smoothstep(0.45, 1.0, v));
146: return vec4(col, 1.0);`,
147:   },
148: }
149:
150: // Spiral — animated polar-coordinate spiral.
151: export const spiralLayer: LayerDefinition = {
152:   id: 'spiral',
153:   name: 'Spiral',
154:   description: 'Animated logarithmic spiral with adjustable density',
155:   color: '#a855f7',
156:   category: 'generator',
157:   defaultBlendMode: 'normal',
158:   uniforms: [
159:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.05, 0.05, 0.08], ui: { color: true } },
160:     { name: 'colorFront', label: 'Stroke', type: 'vec3', default: [0.95, 0.8, 0.4], ui: { color: true } },
161:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
162:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
163:     { name: 'density', label: 'Density', type: 'float', default: 6.0, ui: { min: 1, max: 40, step: 0.1 } },
164:     { name: 'thickness', label: 'Thickness', type: 'float', default: 0.4, ui: { min: 0.05, max: 0.95, step: 0.01 } },
165:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: -4, max: 4, step: 0.05 } },
166:   ],
167:   glsl: {
168:     dependencies: ['aastep'],
169:     main: `
170: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
171: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
172: float r = length(p);
173: float a = atan(p.y, p.x);
174: float phase = a + log(r + 1e-3) * {{density}} + u_time * {{speed}};
175: float t = fract(phase / 6.28318);
176: float m = 1.0 - aastep({{thickness}}, abs(t - 0.5) * 2.0);
177: return vec4(mix({{colorBack}}, {{colorFront}}, m), 1.0);`,
178:   },
179: }
180:
181: // ContourLines — equipotential lines from a noise field.
182: export const contourLinesLayer: LayerDefinition = {
183:   id: 'contour-lines',
184:   name: 'Contour Lines',
185:   description: 'Topographic contour lines from noise',
186:   color: '#84cc16',
187:   category: 'generator',
188:   defaultBlendMode: 'normal',
189:   uniforms: [
190:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.04, 0.05], ui: { color: true } },
191:     { name: 'colorFront', label: 'Lines', type: 'vec3', default: [0.55, 0.95, 0.7], ui: { color: true } },
192:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.5, max: 20, step: 0.1 } },
193:     { name: 'frequency', label: 'Line Frequency', type: 'float', default: 8.0, ui: { min: 1, max: 40, step: 0.5 } },
194:     { name: 'thickness', label: 'Thickness', type: 'float', default: 0.4, ui: { min: 0.05, max: 0.95, step: 0.01 } },
195:     { name: 'speed', label: 'Speed', type: 'float', default: 0.0, ui: { min: 0, max: 4, step: 0.05 } },
196:   ],
197:   glsl: {
198:     dependencies: ['simplex2D', 'aastep'],
199:     main: `
200: ${screenP}
201: vec2 q = p * {{scale}} + u_time * {{speed}} * 0.3;
202: float n = simplex2D(q) * 0.5 + 0.5;
203: float lines = abs(fract(n * {{frequency}}) - 0.5) * 2.0;
204: float m = 1.0 - aastep({{thickness}}, lines);
205: return vec4(mix({{colorBack}}, {{colorFront}}, m), 1.0);`,
206:   },
207: }
208:
209: export const NOISE_LAYERS: Record<string, LayerDefinition> = {
210:   plasma: plasmaLayer,
211:   'perlin-noise': perlinNoiseLayer,
212:   'flow-field': flowFieldLayer,
213:   aurora: auroraLayer,
214:   'spiral-pattern': spiralLayer,
215:   'contour-lines': contourLinesLayer,
216: }

(End of file - total 216 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/index.ts",
  "offset": 221
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/index.ts</path>
<type>file</type>
<content>
221: float dist = length(center);
222: float angleRad = {{angle}} * 3.14159 / 180.0;
223: vec2 dir = mix(vec2(cos(angleRad), sin(angleRad)), normalize(center + 0.001), {{radial}});
224: vec2 offset = dir * {{intensity}} * (1.0 + dist * {{radial}});
225:
226: // Simulate chromatic shift
227: vec3 col = vec3(
228:   mix(base.r, base.g, offset.x * 10.0),
229:   base.g,
230:   mix(base.b, base.g, -offset.x * 10.0)
231: );
232: return vec4(col, base.a);`,
233:   },
234: }
235:
236: export const glowLayer: LayerDefinition = {
237:   id: 'glow',
238:   name: 'Glow',
239:   description: 'Adds a soft bloom/glow effect',
240:   color: '#fbbf24',
241:   category: 'effect',
242:   defaultBlendMode: 'add',
243:   uniforms: [
244:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.5, ui: { min: 0, max: 2, step: 0.01 } },
245:     { name: 'threshold', label: 'Threshold', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
246:     { name: 'radius', label: 'Radius', type: 'float', default: 0.1, ui: { min: 0, max: 0.5, step: 0.01 } },
247:     { name: 'color', label: 'Glow Color', type: 'vec3', default: [1.0, 1.0, 1.0], ui: { color: true } },
248:   ],
249:   glsl: {
250:     main: `
251: float luminance = dot(base.rgb, vec3(0.299, 0.587, 0.114));
252: float bloom = smoothstep({{threshold}}, 1.0, luminance);
253: vec3 glowCol = {{color}} * bloom * {{intensity}};
254: vec3 col = base.rgb + glowCol;
255: return vec4(col, base.a);`,
256:   },
257: }
258:
259: export const bulgeLayer: LayerDefinition = {
260:   id: 'bulge',
261:   name: 'Bulge',
262:   description: 'Pinches or bulges the previous content around a focal point',
263:   color: '#22d3ee',
264:   category: 'distorter',
265:   defaultBlendMode: 'normal',
266:   consumesPrevPass: true,
267:   uniforms: [
268:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
269:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
270:     { name: 'radius', label: 'Radius', type: 'float', default: 0.4, ui: { min: 0.01, max: 1, step: 0.01 } },
271:     { name: 'strength', label: 'Strength', type: 'float', default: 0.5, ui: { min: -1, max: 1, step: 0.01 } },
272:   ],
273:   glsl: {
274:     main: `
275: vec2 center = vec2({{centerX}}, {{centerY}});
276: vec2 d = uv - center;
277: float r = length(d);
278: float falloff = 1.0 - smoothstep(0.0, {{radius}}, r);
279: vec2 distorted = uv - d * falloff * {{strength}};
280: return texture(u_prevPass, distorted);`,
281:   },
282: }
283:
284: export const colorShiftLayer: LayerDefinition = {
285:   id: 'color-shift',
286:   name: 'Color Shift',
287:   description: 'Hue rotation and saturation adjustment',
288:   color: '#a855f7',
289:   category: 'modifier',
290:   defaultBlendMode: 'normal',
291:   uniforms: [
292:     { name: 'hueShift', label: 'Hue Shift', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
293:     { name: 'saturation', label: 'Saturation', type: 'float', default: 1.0, ui: { min: 0, max: 2, step: 0.01 } },
294:     { name: 'brightness', label: 'Brightness', type: 'float', default: 1.0, ui: { min: 0, max: 2, step: 0.01 } },
295:   ],
296:   glsl: {
297:     dependencies: ['rgb2hsv', 'hsv2rgb'],
298:     main: `
299: vec3 hsv = rgb2hsv(base.rgb);
300: hsv.x = fract(hsv.x + {{hueShift}} / 360.0);
301: hsv.y *= {{saturation}};
302: hsv.z *= {{brightness}};
303: vec3 col = hsv2rgb(hsv);
304: return vec4(col, base.a);`,
305:   },
306: }
307:
308: export const LAYER_LIBRARY: Record<string, LayerDefinition> = {
309:   'simplex-noise': simplexNoiseLayer,
310:   'voronoi': voronoiLayer,
311:   'linear-gradient': linearGradientLayer,
312:   'radial-gradient': radialGradientLayer,
313:   'waves': wavesLayer,
314:   'vignette': vignetteLayer,
315:   'grain': grainLayer,
316:   'chromatic-aberration': chromaticAberrationLayer,
317:   'glow': glowLayer,
318:   'color-shift': colorShiftLayer,
319:   'bulge': bulgeLayer,
320:   ...SHAPE_LAYERS,
321:   ...PATTERN_LAYERS,
322:   ...GRADIENT_LAYERS,
323:   ...NOISE_LAYERS,
324:   ...ATMOSPHERIC_LAYERS,
325:   ...SOURCE_LAYERS,
326:   ...DISTORTER_LAYERS,
327:   ...BLUR_LAYERS,
328:   ...LIGHTING_LAYERS,
329:   ...COLOR_LAYERS,
330:   ...STYLIZE_LAYERS,
331:   ...SPECIALIZED_LAYERS,
332:   ...PAPER_SHADER_LAYERS,
333: }
334:
335: export const LAYER_CATEGORIES = {
336:   generator: { name: 'Generators', description: 'Create base patterns' },
337:   modifier: { name: 'Modifiers', description: 'Transform colors and values' },
338:   effect: { name: 'Effects', description: 'Post-processing effects' },
339:   distorter: { name: 'Distorters', description: 'Warp the layers below' },
340:   blend: { name: 'Blend', description: 'Combine layers' },
341: }

(End of file - total 341 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/runtime-shell.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/runtime-shell.ts</path>
<type>file</type>
<content>
1: // Multi-pass GL pipeline used by both the live preview and any exported
2: // component. Compiles each pass's program, manages two ping-pong FBOs, and
3: // drives a fullscreen-quad draw per pass. Uniform binding is delegated via
4: // `bindUniforms` so callers can read from React state, props, or an options
5: // object without changing this file.
6: //
7: // IMPORTANT: this file is the single source of truth for the runtime. The
8: // generator inlines its source verbatim into exported React/Vanilla code so
9: // the export and the preview can never drift.
10: //
11: // Texture-unit convention: TEXTURE0 is owned by the runtime and bound to
12: // `u_prevPass` whenever a pass reads it. Image-uniform binders (callers of
13: // `bindUniforms`) must use TEXTURE1 and above. The `passContext.nextTextureUnit`
14: // passed into `bindUniforms` reflects the first free unit for that pass.
15:
16: export interface PipelinePass {
17:   fragment: string
18:   readsPrevPass: boolean
19: }
20:
21: export interface PassContext {
22:   passIndex: number
23:   // First texture unit available to image uniforms in this pass. 1 if the
24:   // pass reads u_prevPass (which sits on TEXTURE0), 0 otherwise.
25:   nextTextureUnit: number
26: }
27:
28: export interface PipelineHandle {
29:   render(
30:     time: number,
31:     width: number,
32:     height: number,
33:     bindUniforms: (ctx: PassContext, program: WebGLProgram) => void
34:   ): void
35:   destroy(): void
36: }
37:
38: export function createShaderPipeline(
39:   gl: WebGL2RenderingContext,
40:   vertexSource: string,
41:   passes: PipelinePass[]
42: ): PipelineHandle {
43:   function compile(type: number, src: string): WebGLShader | null {
44:     const sh = gl.createShader(type)
45:     if (!sh) return null
46:     gl.shaderSource(sh, src)
47:     gl.compileShader(sh)
48:     if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
49:       console.error(
50:         type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment',
51:         'shader error:',
52:         gl.getShaderInfoLog(sh)
53:       )
54:       gl.deleteShader(sh)
55:       return null
56:     }
57:     return sh
58:   }
59:
60:   const programs: (WebGLProgram | null)[] = passes.map((p) => {
61:     const vs = compile(gl.VERTEX_SHADER, vertexSource)
62:     const fs = compile(gl.FRAGMENT_SHADER, p.fragment)
63:     if (!vs || !fs) return null
64:     const prog = gl.createProgram()
65:     if (!prog) return null
66:     gl.attachShader(prog, vs)
67:     gl.attachShader(prog, fs)
68:     gl.linkProgram(prog)
69:     gl.deleteShader(vs)
70:     gl.deleteShader(fs)
71:     if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
72:       console.error('Program link error:', gl.getProgramInfoLog(prog))
73:       gl.deleteProgram(prog)
74:       return null
75:     }
76:     return prog
77:   })
78:
79:   const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
80:   const buffer = gl.createBuffer()
81:   gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
82:   gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
83:
84:   let texA: WebGLTexture | null = null
85:   let texB: WebGLTexture | null = null
86:   let fboA: WebGLFramebuffer | null = null
87:   let fboB: WebGLFramebuffer | null = null
88:   let fboW = 0
89:   let fboH = 0
90:
91:   function ensureFbos(w: number, h: number) {
92:     if (w === fboW && h === fboH && texA && texB) return
93:     if (texA) gl.deleteTexture(texA)
94:     if (texB) gl.deleteTexture(texB)
95:     if (fboA) gl.deleteFramebuffer(fboA)
96:     if (fboB) gl.deleteFramebuffer(fboB)
97:     fboW = w
98:     fboH = h
99:     const make = () => {
100:       const t = gl.createTexture()
101:       gl.bindTexture(gl.TEXTURE_2D, t)
102:       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
103:       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
104:       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
105:       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
106:       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
107:       const f = gl.createFramebuffer()
108:       gl.bindFramebuffer(gl.FRAMEBUFFER, f)
109:       gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
110:       return [t, f] as const
111:     }
112:     const [tA, fA] = make()
113:     texA = tA
114:     fboA = fA
115:     const [tB, fB] = make()
116:     texB = tB
117:     fboB = fB
118:     gl.bindFramebuffer(gl.FRAMEBUFFER, null)
119:   }
120:
121:   function render(
122:     time: number,
123:     width: number,
124:     height: number,
125:     bindUniforms: (ctx: PassContext, prog: WebGLProgram) => void
126:   ) {
127:     if (passes.length === 0) return
128:     ensureFbos(width, height)
129:
130:     let read: WebGLTexture | null = texA
131:     let writeFbo: WebGLFramebuffer | null = fboB
132:
133:     if (passes[0].readsPrevPass) {
134:       gl.bindFramebuffer(gl.FRAMEBUFFER, fboA)
135:       gl.viewport(0, 0, width, height)
136:       gl.clearColor(0, 0, 0, 0)
137:       gl.clear(gl.COLOR_BUFFER_BIT)
138:     }
139:
140:     for (let i = 0; i < passes.length; i++) {
141:       const pass = passes[i]
142:       const prog = programs[i]
143:       if (!prog) continue
144:       const isLast = i === passes.length - 1
145:       gl.useProgram(prog)
146:
147:       gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
148:       const posLoc = gl.getAttribLocation(prog, 'a_position')
149:       gl.enableVertexAttribArray(posLoc)
150:       gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
151:
152:       const uTime = gl.getUniformLocation(prog, 'u_time')
153:       if (uTime) gl.uniform1f(uTime, time)
154:       const uRes = gl.getUniformLocation(prog, 'u_resolution')
155:       if (uRes) gl.uniform2f(uRes, width, height)
156:
157:       if (pass.readsPrevPass) {
158:         gl.activeTexture(gl.TEXTURE0)
159:         gl.bindTexture(gl.TEXTURE_2D, read)
160:         const uPrev = gl.getUniformLocation(prog, 'u_prevPass')
161:         if (uPrev) gl.uniform1i(uPrev, 0)
162:       }
163:
164:       bindUniforms(
165:         { passIndex: i, nextTextureUnit: pass.readsPrevPass ? 1 : 0 },
166:         prog
167:       )
168:
169:       gl.bindFramebuffer(gl.FRAMEBUFFER, isLast ? null : writeFbo)
170:       gl.viewport(0, 0, width, height)
171:       gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
172:
173:       if (!isLast) {
174:         const justWrote = writeFbo === fboA ? texA : texB
175:         read = justWrote
176:         writeFbo = writeFbo === fboA ? fboB : fboA
177:       }
178:     }
179:   }
180:
181:   function destroy() {
182:     if (texA) gl.deleteTexture(texA)
183:     if (texB) gl.deleteTexture(texB)
184:     if (fboA) gl.deleteFramebuffer(fboA)
185:     if (fboB) gl.deleteFramebuffer(fboB)
186:     if (buffer) gl.deleteBuffer(buffer)
187:     programs.forEach((p) => p && gl.deleteProgram(p))
188:   }
189:
190:   return { render, destroy }
191: }

(End of file - total 191 lines)
</content>
```

---

## Assistant (Build · GLM-5.1 · 3.9s)

At once, my lord. Let me read the remaining layer files I need, then begin implementation.

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/distorters.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/distorters.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { distorter } from './_helpers'
3:
4: export const spherizeLayer = distorter({
5:   id: 'spherize',
6:   name: 'Spherize',
7:   description: 'Sphere lens distortion (fisheye)',
8:   color: '#22d3ee',
9:   uniforms: [
10:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
11:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
12:     { name: 'radius', label: 'Radius', type: 'float', default: 0.5, ui: { min: 0.05, max: 1.5, step: 0.01 } },
13:     { name: 'strength', label: 'Strength', type: 'float', default: 0.5, ui: { min: -1, max: 1, step: 0.01 } },
14:   ],
15:   glsl: {
16:     main: `
17: vec2 c = vec2({{centerX}}, {{centerY}});
18: vec2 d = uv - c;
19: float r = length(d) / max({{radius}}, 1e-4);
20: float warp = 1.0 - {{strength}} * (1.0 - smoothstep(0.0, 1.0, r));
21: vec2 distorted = c + d * mix(1.0, warp, step(r, 1.0));
22: return texture(u_prevPass, distorted);`,
23:   },
24: })
25:
26: export const liquifyLayer = distorter({
27:   id: 'liquify',
28:   name: 'Liquify',
29:   description: 'Soft noise-driven liquid warp',
30:   color: '#22d3ee',
31:   uniforms: [
32:     { name: 'amount', label: 'Amount', type: 'float', default: 0.05, ui: { min: 0, max: 0.4, step: 0.005 } },
33:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.5, max: 20, step: 0.1 } },
34:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
35:   ],
36:   glsl: {
37:     dependencies: ['simplex2D'],
38:     main: `
39: float t = u_time * {{speed}};
40: float dx = simplex2D(uv * {{scale}} + vec2(t, 0.0));
41: float dy = simplex2D(uv * {{scale}} + vec2(0.0, t + 7.3));
42: return texture(u_prevPass, uv + vec2(dx, dy) * {{amount}});`,
43:   },
44: })
45:
46: export const stretchLayer = distorter({
47:   id: 'stretch',
48:   name: 'Stretch',
49:   description: 'Stretch along the X / Y axes',
50:   color: '#22d3ee',
51:   uniforms: [
52:     { name: 'scaleX', label: 'Scale X', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.01 } },
53:     { name: 'scaleY', label: 'Scale Y', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.01 } },
54:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
55:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
56:   ],
57:   glsl: {
58:     main: `
59: vec2 c = vec2({{centerX}}, {{centerY}});
60: vec2 d = (uv - c) / vec2({{scaleX}}, {{scaleY}});
61: return texture(u_prevPass, c + d);`,
62:   },
63: })
64:
65: export const twirlLayer = distorter({
66:   id: 'twirl',
67:   name: 'Twirl',
68:   description: 'Local rotation, falls off with distance',
69:   color: '#22d3ee',
70:   uniforms: [
71:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
72:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
73:     { name: 'radius', label: 'Radius', type: 'float', default: 0.4, ui: { min: 0.05, max: 1.5, step: 0.01 } },
74:     { name: 'angle', label: 'Angle (deg)', type: 'float', default: 90.0, ui: { min: -720, max: 720, step: 1 } },
75:   ],
76:   glsl: {
77:     main: `
78: vec2 c = vec2({{centerX}}, {{centerY}});
79: vec2 d = uv - c;
80: float r = length(d);
81: float falloff = 1.0 - smoothstep(0.0, {{radius}}, r);
82: float a = {{angle}} * 3.14159 / 180.0 * falloff;
83: float ca = cos(a), sa = sin(a);
84: vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
85: return texture(u_prevPass, c + rd);`,
86:   },
87: })
88:
89: export const swirlLayer = distorter({
90:   id: 'swirl',
91:   name: 'Swirl',
92:   description: 'Radius-dependent rotation across the canvas',
93:   color: '#22d3ee',
94:   uniforms: [
95:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
96:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
97:     { name: 'strength', label: 'Strength', type: 'float', default: 4.0, ui: { min: -20, max: 20, step: 0.1 } },
98:   ],
99:   glsl: {
100:     main: `
101: vec2 c = vec2({{centerX}}, {{centerY}});
102: vec2 d = uv - c;
103: float r = length(d);
104: float a = r * {{strength}};
105: float ca = cos(a), sa = sin(a);
106: vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
107: return texture(u_prevPass, c + rd);`,
108:   },
109: })
110:
111: export const concentricSpinLayer = distorter({
112:   id: 'concentric-spin',
113:   name: 'Concentric Spin',
114:   description: 'Concentric rings rotating at different rates',
115:   color: '#22d3ee',
116:   uniforms: [
117:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
118:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
119:     { name: 'rings', label: 'Rings', type: 'float', default: 8.0, ui: { min: 1, max: 30, step: 1 } },
120:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: -4, max: 4, step: 0.05 } },
121:   ],
122:   glsl: {
123:     main: `
124: vec2 c = vec2({{centerX}}, {{centerY}});
125: vec2 d = uv - c;
126: float r = length(d);
127: float band = floor(r * {{rings}});
128: float a = sin(band * 1.7) * u_time * {{speed}};
129: float ca = cos(a), sa = sin(a);
130: vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
131: return texture(u_prevPass, c + rd);`,
132:   },
133: })
134:
135: export const gridDistortionLayer = distorter({
136:   id: 'grid-distortion',
137:   name: 'Grid Distortion',
138:   description: 'Mesh-style noise warp',
139:   color: '#22d3ee',
140:   uniforms: [
141:     { name: 'amount', label: 'Amount', type: 'float', default: 0.05, ui: { min: 0, max: 0.4, step: 0.005 } },
142:     { name: 'scale', label: 'Scale', type: 'float', default: 4.0, ui: { min: 1, max: 30, step: 0.5 } },
143:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
144:   ],
145:   glsl: {
146:     dependencies: ['simplex2D'],
147:     main: `
148: float t = u_time * {{speed}};
149: vec2 q = uv * {{scale}};
150: vec2 offset = vec2(simplex2D(q + t), simplex2D(q + t + 13.7)) * {{amount}};
151: return texture(u_prevPass, uv + offset);`,
152:   },
153: })
154:
155: export const waveDistortionLayer = distorter({
156:   id: 'wave-distortion',
157:   name: 'Wave Distortion',
158:   description: 'Sine-wave UV displacement',
159:   color: '#22d3ee',
160:   uniforms: [
161:     { name: 'frequency', label: 'Frequency', type: 'float', default: 12.0, ui: { min: 1, max: 60, step: 0.5 } },
162:     { name: 'amplitude', label: 'Amplitude', type: 'float', default: 0.02, ui: { min: 0, max: 0.3, step: 0.005 } },
163:     { name: 'speed', label: 'Speed', type: 'float', default: 1.5, ui: { min: 0, max: 8, step: 0.05 } },
164:     { name: 'angle', label: 'Direction (deg)', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
165:   ],
166:   glsl: {
167:     dependencies: ['rotate2D'],
168:     main: `
169: vec2 q = rotate2D(uv - 0.5, {{angle}} * 3.14159 / 180.0) + 0.5;
170: vec2 offset = vec2(
171:   sin(q.y * {{frequency}} + u_time * {{speed}}),
172:   cos(q.x * {{frequency}} + u_time * {{speed}})
173: ) * {{amplitude}};
174: return texture(u_prevPass, uv + offset);`,
175:   },
176: })
177:
178: export const ripplesLayer = distorter({
179:   id: 'ripples',
180:   name: 'Ripples',
181:   description: 'Concentric ripples from a focal point',
182:   color: '#22d3ee',
183:   uniforms: [
184:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
185:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
186:     { name: 'frequency', label: 'Frequency', type: 'float', default: 30.0, ui: { min: 1, max: 200, step: 1 } },
187:     { name: 'amplitude', label: 'Amplitude', type: 'float', default: 0.02, ui: { min: 0, max: 0.3, step: 0.005 } },
188:     { name: 'speed', label: 'Speed', type: 'float', default: 2.0, ui: { min: 0, max: 10, step: 0.05 } },
189:     { name: 'falloff', label: 'Falloff', type: 'float', default: 2.0, ui: { min: 0, max: 10, step: 0.1 } },
190:   ],
191:   glsl: {
192:     main: `
193: vec2 c = vec2({{centerX}}, {{centerY}});
194: vec2 d = uv - c;
195: float r = length(d);
196: float wave = sin(r * {{frequency}} - u_time * {{speed}}) * exp(-r * {{falloff}}) * {{amplitude}};
197: return texture(u_prevPass, uv + normalize(d + 1e-6) * wave);`,
198:   },
199: })
200:
201: export const shatterLayer = distorter({
202:   id: 'shatter',
203:   name: 'Shatter',
204:   description: 'Voronoi cell fragments displaced',
205:   color: '#22d3ee',
206:   uniforms: [
207:     { name: 'scale', label: 'Cells', type: 'float', default: 8.0, ui: { min: 2, max: 40, step: 0.5 } },
208:     { name: 'amount', label: 'Amount', type: 'float', default: 0.05, ui: { min: 0, max: 0.5, step: 0.005 } },
209:   ],
210:   glsl: {
211:     dependencies: ['hash2'],
212:     main: `
213: vec2 q = uv * {{scale}};
214: vec2 cell = floor(q);
215: vec2 offset = (hash2(cell) - 0.5) * 2.0 * {{amount}};
216: return texture(u_prevPass, uv + offset);`,
217:   },
218: })
219:
220: export const mirrorLayer = distorter({
221:   id: 'mirror',
222:   name: 'Mirror',
223:   description: 'Reflect across an axis',
224:   color: '#22d3ee',
225:   uniforms: [
226:     { name: 'angle', label: 'Axis Angle', type: 'float', default: 90.0, ui: { min: 0, max: 360, step: 1 } },
227:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
228:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
229:     { name: 'side', label: 'Mirror Side', type: 'float', default: 1.0, ui: { min: -1, max: 1, step: 1 } },
230:   ],
231:   glsl: {
232:     dependencies: ['rotate2D'],
233:     main: `
234: vec2 c = vec2({{centerX}}, {{centerY}});
235: float a = {{angle}} * 3.14159 / 180.0;
236: vec2 d = rotate2D(uv - c, -a);
237: d.x = abs(d.x) * {{side}};
238: return texture(u_prevPass, c + rotate2D(d, a));`,
239:   },
240: })
241:
242: export const kaleidoscopeLayer = distorter({
243:   id: 'kaleidoscope',
244:   name: 'Kaleidoscope',
245:   description: 'N-fold radial mirror',
246:   color: '#22d3ee',
247:   uniforms: [
248:     { name: 'segments', label: 'Segments', type: 'float', default: 8.0, ui: { min: 2, max: 40, step: 1 } },
249:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
250:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
251:     { name: 'rotation', label: 'Rotation', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
252:   ],
253:   glsl: {
254:     main: `
255: vec2 c = vec2({{centerX}}, {{centerY}});
256: vec2 d = uv - c;
257: float r = length(d);
258: float a = atan(d.y, d.x) + {{rotation}} * 3.14159 / 180.0;
259: float seg = 6.28318 / max({{segments}}, 1.0);
260: a = abs(mod(a, seg) - seg * 0.5);
261: vec2 rd = vec2(cos(a), sin(a)) * r;
262: return texture(u_prevPass, c + rd);`,
263:   },
264: })
265:
266: export const polarCoordinatesLayer = distorter({
267:   id: 'polar-coordinates',
268:   name: 'Polar Coordinates',
269:   description: 'Rectangular ↔ polar UV remap',
270:   color: '#22d3ee',
271:   uniforms: [
272:     { name: 'mode', label: 'Mode (0=R→P, 1=P→R)', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 1 } },
273:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
274:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
275:   ],
276:   glsl: {
277:     main: `
278: vec2 c = vec2({{centerX}}, {{centerY}});
279: vec2 d = uv - c;
280: vec2 q;
281: if ({{mode}} < 0.5) {
282:   // rect -> polar: x=angle/2pi, y=radius
283:   float r = length(d);
284:   float a = atan(d.y, d.x) / 6.28318 + 0.5;
285:   q = vec2(a, r);
286: } else {
287:   // polar -> rect
288:   float a = (uv.x - 0.5) * 6.28318;
289:   float r = uv.y;
290:   q = c + vec2(cos(a), sin(a)) * r;
291: }
292: return texture(u_prevPass, q);`,
293:   },
294: })
295:
296: export const perspectiveLayer = distorter({
297:   id: 'perspective',
298:   name: 'Perspective',
299:   description: 'Trapezoidal perspective skew',
300:   color: '#22d3ee',
301:   uniforms: [
302:     { name: 'horizontal', label: 'Horizontal', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },
303:     { name: 'vertical', label: 'Vertical', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },
304:   ],
305:   glsl: {
306:     main: `
307: vec2 q = uv - 0.5;
308: float scaleX = 1.0 + {{vertical}} * q.y;
309: float scaleY = 1.0 + {{horizontal}} * q.x;
310: q = q / vec2(scaleX, scaleY);
311: return texture(u_prevPass, q + 0.5);`,
312:   },
313: })
314:
315: export const pixelateLayer = distorter({
316:   id: 'pixelate',
317:   name: 'Pixelate',
318:   description: 'Reduce resolution to discrete cells',
319:   color: '#22d3ee',
320:   uniforms: [
321:     { name: 'cells', label: 'Cells', type: 'float', default: 80.0, ui: { min: 4, max: 400, step: 1 } },
322:   ],
323:   glsl: {
324:     main: `
325: vec2 cells = vec2({{cells}}, {{cells}} * (u_resolution.y / max(u_resolution.x, 1.0)));
326: vec2 q = (floor(uv * cells) + 0.5) / cells;
327: return texture(u_prevPass, q);`,
328:   },
329: })
330:
331: export const glassLayer = distorter({
332:   id: 'glass',
333:   name: 'Glass',
334:   description: 'Frosted-glass refraction',
335:   color: '#22d3ee',
336:   uniforms: [
337:     { name: 'amount', label: 'Refraction', type: 'float', default: 0.04, ui: { min: 0, max: 0.3, step: 0.005 } },
338:     { name: 'scale', label: 'Scale', type: 'float', default: 8.0, ui: { min: 1, max: 50, step: 0.5 } },
339:   ],
340:   glsl: {
341:     dependencies: ['simplex2D'],
342:     main: `
343: vec2 q = uv * {{scale}};
344: float e = 0.01;
345: float n  = simplex2D(q);
346: float nx = simplex2D(q + vec2(e, 0.0));
347: float ny = simplex2D(q + vec2(0.0, e));
348: vec2 grad = vec2(nx - n, ny - n) / e;
349: return texture(u_prevPass, uv + grad * {{amount}});`,
350:   },
351: })
352:
353: export const glassTilesLayer = distorter({
354:   id: 'glass-tiles',
355:   name: 'Glass Tiles',
356:   description: 'Fluted-glass / vertical tile refraction',
357:   color: '#22d3ee',
358:   uniforms: [
359:     { name: 'count', label: 'Tile Count', type: 'float', default: 20.0, ui: { min: 2, max: 100, step: 1 } },
360:     { name: 'amount', label: 'Distortion', type: 'float', default: 0.05, ui: { min: 0, max: 0.3, step: 0.005 } },
361:     { name: 'angle', label: 'Angle', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
362:   ],
363:   glsl: {
364:     dependencies: ['rotate2D'],
365:     main: `
366: vec2 q = rotate2D(uv - 0.5, {{angle}} * 3.14159 / 180.0);
367: float t = q.x * {{count}};
368: float bend = (fract(t) - 0.5) * {{amount}};
369: q.x += bend;
370: vec2 q2 = rotate2D(q, -{{angle}} * 3.14159 / 180.0) + 0.5;
371: return texture(u_prevPass, q2);`,
372:   },
373: })
374:
375: export const glitchLayer = distorter({
376:   id: 'glitch',
377:   name: 'Glitch',
378:   description: 'Banded horizontal jitter with chroma shift',
379:   color: '#22d3ee',
380:   uniforms: [
381:     { name: 'amount', label: 'Amount', type: 'float', default: 0.04, ui: { min: 0, max: 0.3, step: 0.005 } },
382:     { name: 'lines', label: 'Bands', type: 'float', default: 80.0, ui: { min: 4, max: 400, step: 1 } },
383:     { name: 'chroma', label: 'Chroma Shift', type: 'float', default: 0.005, ui: { min: 0, max: 0.05, step: 0.001 } },
384:     { name: 'speed', label: 'Speed', type: 'float', default: 6.0, ui: { min: 0, max: 30, step: 0.1 } },
385:   ],
386:   glsl: {
387:     dependencies: ['hash'],
388:     main: `
389: float band = floor(uv.y * {{lines}});
390: float t = floor(u_time * {{speed}});
391: float jitter = (hash(vec2(band, t)) - 0.5) * 2.0 * {{amount}};
392: vec2 q = vec2(uv.x + jitter, uv.y);
393: float r = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;
394: float g = texture(u_prevPass, q).g;
395: float b = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;
396: return vec4(r, g, b, 1.0);`,
397:   },
398: })
399:
400: export const vhsLayer = distorter({
401:   id: 'vhs',
402:   name: 'VHS',
403:   description: 'Tape-like chroma + scanlines + tracking',
404:   color: '#22d3ee',
405:   uniforms: [
406:     { name: 'chroma', label: 'Chroma Shift', type: 'float', default: 0.006, ui: { min: 0, max: 0.05, step: 0.001 } },
407:     { name: 'scanline', label: 'Scanline', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
408:     { name: 'tracking', label: 'Tracking', type: 'float', default: 0.02, ui: { min: 0, max: 0.3, step: 0.005 } },
409:     { name: 'speed', label: 'Speed', type: 'float', default: 1.0, ui: { min: 0, max: 4, step: 0.05 } },
410:   ],
411:   glsl: {
412:     dependencies: ['hash'],
413:     main: `
414: float t = u_time * {{speed}};
415: float roll = sin(uv.y * 200.0 + t * 4.0);
416: vec2 q = vec2(uv.x + roll * {{tracking}} * 0.05, uv.y);
417: float r = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;
418: float g = texture(u_prevPass, q).g;
419: float b = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;
420: vec3 col = vec3(r, g, b);
421: float scan = 0.5 + 0.5 * cos(uv.y * u_resolution.y * 3.14159);
422: col *= mix(1.0, scan, {{scanline}});
423: col += (hash(uv * u_resolution + t) - 0.5) * 0.05;
424: return vec4(col, 1.0);`,
425:   },
426: })
427:
428: export const crtScreenLayer = distorter({
429:   id: 'crt-screen',
430:   name: 'CRT Screen',
431:   description: 'Barrel distortion + scanlines + vignette',
432:   color: '#22d3ee',
433:   uniforms: [
434:     { name: 'curvature', label: 'Curvature', type: 'float', default: 0.15, ui: { min: 0, max: 1, step: 0.01 } },
435:     { name: 'scanline', label: 'Scanline', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },
436:     { name: 'vignette', label: 'Vignette', type: 'float', default: 0.5, ui: { min: 0, max: 2, step: 0.01 } },
437:     { name: 'chroma', label: 'Chroma Shift', type: 'float', default: 0.003, ui: { min: 0, max: 0.05, step: 0.001 } },
438:   ],
439:   glsl: {
440:     main: `
441: vec2 q = uv - 0.5;
442: float r2 = dot(q, q);
443: q *= 1.0 + r2 * {{curvature}};
444: q += 0.5;
445: if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
446: float rch = texture(u_prevPass, q + vec2({{chroma}}, 0.0)).r;
447: float gch = texture(u_prevPass, q).g;
448: float bch = texture(u_prevPass, q - vec2({{chroma}}, 0.0)).b;
449: vec3 col = vec3(rch, gch, bch);
450: float scan = 0.5 + 0.5 * cos(q.y * u_resolution.y * 3.14159);
451: col *= mix(1.0, scan, {{scanline}});
452: float vig = 1.0 - r2 * {{vignette}} * 4.0;
453: col *= clamp(vig, 0.0, 1.0);
454: return vec4(col, 1.0);`,
455:   },
456: })
457:
458: // Radial sine-wave UV displacement modulated by FBM noise. Stack over an
459: // `image-source` (or any prev-pass) for caustic-style water surfaces.
460: export const waterRippleLayer = distorter({
461:   id: 'water-ripple',
462:   name: 'Water Ripple',
463:   description: 'Radial wave displacement with FBM modulation',
464:   color: '#22d3ee',
465:   uniforms: [
466:     { name: 'amplitude', label: 'Amplitude', type: 'float', default: 0.02, ui: { min: 0, max: 0.2, step: 0.001 } },
467:     { name: 'frequency', label: 'Frequency', type: 'float', default: 12, ui: { min: 1, max: 60, step: 0.5 } },
468:     { name: 'speed', label: 'Speed', type: 'float', default: 0.6, ui: { min: 0, max: 4, step: 0.05 } },
469:     { name: 'focalX', label: 'Focal X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
470:     { name: 'focalY', label: 'Focal Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
471:     { name: 'noiseAmount', label: 'Noise', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
472:     { name: 'noiseScale', label: 'Noise Scale', type: 'float', default: 4, ui: { min: 0.1, max: 20, step: 0.1 } },
473:   ],
474:   glsl: {
475:     dependencies: ['simplex2D', 'fbm'],
476:     main: `
477: vec2 c = vec2({{focalX}}, {{focalY}});
478: vec2 d = uv - c;
479: float r = length(d);
480: float t = u_time * {{speed}};
481: float ring = sin(r * {{frequency}} - t);
482: float n = fbm(uv * {{noiseScale}} + vec2(t * 0.2, 0.0), 3.0, 2.0, 0.5);
483: vec2 dir = r > 1e-4 ? d / r : vec2(0.0);
484: vec2 push = dir * ring * {{amplitude}}
485:           + vec2(n, n) * {{amplitude}} * {{noiseAmount}};
486: return texture(u_prevPass, uv - push);`,
487:   },
488: })
489:
490: export const DISTORTER_LAYERS: Record<string, LayerDefinition> = {
491:   spherize: spherizeLayer,
492:   liquify: liquifyLayer,
493:   stretch: stretchLayer,
494:   twirl: twirlLayer,
495:   swirl: swirlLayer,
496:   'concentric-spin': concentricSpinLayer,
497:   'grid-distortion': gridDistortionLayer,
498:   'wave-distortion': waveDistortionLayer,
499:   ripples: ripplesLayer,
500:   shatter: shatterLayer,
501:   mirror: mirrorLayer,
502:   kaleidoscope: kaleidoscopeLayer,
503:   'polar-coordinates': polarCoordinatesLayer,
504:   perspective: perspectiveLayer,
505:   pixelate: pixelateLayer,
506:   glass: glassLayer,
507:   'glass-tiles': glassTilesLayer,
508:   glitch: glitchLayer,
509:   vhs: vhsLayer,
510:   'crt-screen': crtScreenLayer,
511:   'water-ripple': waterRippleLayer,
512: }

(End of file - total 512 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/stylize.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/stylize.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { fx, baseFx } from './_helpers'
3:
4: export const halftoneLayer = fx({
5:   id: 'halftone',
6:   name: 'Halftone',
7:   description: 'Print-style dot screen sized by luminance',
8:   color: '#475569',
9:   uniforms: [
10:     { name: 'cells', label: 'Cells', type: 'float', default: 60.0, ui: { min: 4, max: 400, step: 1 } },
11:     { name: 'angle', label: 'Angle', type: 'float', default: 30.0, ui: { min: 0, max: 90, step: 1 } },
12:     { name: 'softness', label: 'Softness', type: 'float', default: 0.05, ui: { min: 0.001, max: 0.4, step: 0.001 } },
13:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [1.0, 1.0, 1.0], ui: { color: true } },
14:     { name: 'colorDot', label: 'Dot', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
15:   ],
16:   glsl: {
17:     dependencies: ['rotate2D', 'luma'],
18:     main: `
19: vec2 q = rotate2D(uv - 0.5, {{angle}} * 3.14159 / 180.0) + 0.5;
20: vec2 cellUv = fract(q * vec2({{cells}}, {{cells}} * (u_resolution.y / max(u_resolution.x, 1.0)))) - 0.5;
21: float lum = luma(texture(u_prevPass, uv).rgb);
22: float radius = (1.0 - lum) * 0.5;
23: float d = length(cellUv);
24: float fillDot = 1.0 - smoothstep(radius - {{softness}}, radius + {{softness}}, d);
25: return vec4(mix({{colorBack}}, {{colorDot}}, fillDot), 1.0);`,
26:   },
27: })
28:
29: export const ditherLayer = fx({
30:   id: 'dither',
31:   name: 'Dither',
32:   description: '4×4 Bayer ordered dither (2-color)',
33:   color: '#475569',
34:   uniforms: [
35:     { name: 'levels', label: 'Levels', type: 'float', default: 4.0, ui: { min: 2, max: 16, step: 1 } },
36:     { name: 'pixelSize', label: 'Pixel Size', type: 'float', default: 2.0, ui: { min: 1, max: 12, step: 1 } },
37:     { name: 'colorDark', label: 'Dark', type: 'vec3', default: [0.05, 0.05, 0.1], ui: { color: true } },
38:     { name: 'colorLight', label: 'Light', type: 'vec3', default: [1.0, 1.0, 0.95], ui: { color: true } },
39:   ],
40:   glsl: {
41:     dependencies: ['luma'],
42:     functions: `
43: const float bayer4[16] = float[16](
44:   0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
45:  12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
46:   3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
47:  15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
48: );`,
49:     main: `
50: vec2 px = floor(uv * u_resolution / max({{pixelSize}}, 1.0)) * max({{pixelSize}}, 1.0) / u_resolution;
51: float lum = luma(texture(u_prevPass, px).rgb);
52: ivec2 ipx = ivec2(mod(uv * u_resolution / max({{pixelSize}}, 1.0), 4.0));
53: float t = bayer4[ipx.y * 4 + ipx.x];
54: float q = floor(lum * {{levels}} + t) / {{levels}};
55: return vec4(mix({{colorDark}}, {{colorLight}}, clamp(q, 0.0, 1.0)), 1.0);`,
56:   },
57: })
58:
59: export const posterizeLayer = baseFx({
60:   id: 'posterize',
61:   name: 'Posterize',
62:   description: 'Reduce to N color levels',
63:   color: '#475569',
64:   uniforms: [
65:     { name: 'levels', label: 'Levels', type: 'float', default: 5.0, ui: { min: 2, max: 16, step: 1 } },
66:   ],
67:   glsl: {
68:     main: `
69: vec3 col = floor(base.rgb * {{levels}} + 0.5) / {{levels}};
70: return vec4(col, base.a);`,
71:   },
72: })
73:
74: export const embossLayer = fx({
75:   id: 'emboss',
76:   name: 'Emboss',
77:   description: 'Embossed relief',
78:   color: '#475569',
79:   uniforms: [
80:     { name: 'amount', label: 'Amount', type: 'float', default: 1.0, ui: { min: 0, max: 4, step: 0.05 } },
81:     { name: 'angle', label: 'Light Angle', type: 'float', default: 135.0, ui: { min: 0, max: 360, step: 1 } },
82:   ],
83:   glsl: {
84:     dependencies: ['luma'],
85:     main: `
86: vec2 texel = 1.0 / u_resolution;
87: float a = {{angle}} * 3.14159 / 180.0;
88: vec2 dir = vec2(cos(a), sin(a)) * texel;
89: float l1 = luma(texture(u_prevPass, uv + dir).rgb);
90: float l2 = luma(texture(u_prevPass, uv - dir).rgb);
91: float v = (l1 - l2) * {{amount}} + 0.5;
92: return vec4(vec3(v), 1.0);`,
93:   },
94: })
95:
96: export const asciiLayer = fx({
97:   id: 'ascii',
98:   name: 'ASCII',
99:   description: 'Coarse ASCII-like dot density',
100:   color: '#475569',
101:   uniforms: [
102:     { name: 'cells', label: 'Cells', type: 'float', default: 80.0, ui: { min: 8, max: 300, step: 1 } },
103:     { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
104:     { name: 'colorChar', label: 'Character', type: 'vec3', default: [0.4, 1.0, 0.5], ui: { color: true } },
105:   ],
106:   glsl: {
107:     dependencies: ['luma'],
108:     main: `
109: vec2 cells = vec2({{cells}}, {{cells}} * (u_resolution.y / max(u_resolution.x, 1.0)));
110: vec2 cellId = floor(uv * cells);
111: vec2 cellUv = fract(uv * cells);
112: vec2 cellSample = (cellId + 0.5) / cells;
113: float lum = luma(texture(u_prevPass, cellSample).rgb);
114: float bars = floor(lum * 4.0);
115: float fill = step(cellUv.y, bars * 0.25 + 0.05);
116: float bar  = step(abs(cellUv.x - 0.5), 0.4) * fill;
117: return vec4(mix({{colorBack}}, {{colorChar}}, bar), 1.0);`,
118:   },
119: })
120:
121: export const filmGrain2Layer = baseFx({
122:   id: 'film-grain-2',
123:   name: 'Film Grain (v2)',
124:   description: 'Animated colored film grain (operates on base)',
125:   color: '#a3a3a3',
126:   uniforms: [
127:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.08, ui: { min: 0, max: 0.5, step: 0.005 } },
128:     { name: 'size', label: 'Grain Size', type: 'float', default: 1.0, ui: { min: 0.2, max: 4, step: 0.05 } },
129:     { name: 'colored', label: 'Colored', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 1 } },
130:     { name: 'speed', label: 'Speed', type: 'float', default: 1.0, ui: { min: 0, max: 5, step: 0.05 } },
131:   ],
132:   glsl: {
133:     dependencies: ['hash', 'hash3'],
134:     main: `
135: vec2 g = floor(uv * u_resolution / max({{size}}, 0.01));
136: float t = floor(u_time * {{speed}} * 24.0);
137: vec3 noise = {{colored}} > 0.5
138:   ? hash3(g + t) * 2.0 - 1.0
139:   : vec3(hash(g + t) * 2.0 - 1.0);
140: return vec4(base.rgb + noise * {{intensity}}, base.a);`,
141:   },
142: })
143:
144: export const vignette2Layer = baseFx({
145:   id: 'vignette-2',
146:   name: 'Vignette (v2)',
147:   description: 'Smooth vignette with adjustable shape',
148:   color: '#475569',
149:   uniforms: [
150:     { name: 'amount', label: 'Amount', type: 'float', default: 0.6, ui: { min: 0, max: 2, step: 0.01 } },
151:     { name: 'radius', label: 'Radius', type: 'float', default: 0.5, ui: { min: 0.1, max: 1.5, step: 0.01 } },
152:     { name: 'softness', label: 'Softness', type: 'float', default: 0.5, ui: { min: 0.01, max: 1.5, step: 0.01 } },
153:     { name: 'roundness', label: 'Roundness', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },
154:     { name: 'color', label: 'Color', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
155:   ],
156:   glsl: {
157:     main: `
158: vec2 q = (uv - 0.5) * vec2(pow(u_resolution.x / max(u_resolution.y, 1.0), 1.0 / max({{roundness}}, 0.001)), 1.0);
159: float r = length(q);
160: float v = smoothstep({{radius}}, {{radius}} + {{softness}}, r) * {{amount}};
161: return vec4(mix(base.rgb, {{color}}, v), base.a);`,
162:   },
163: })
164:
165: export const paperLayer = baseFx({
166:   id: 'paper',
167:   name: 'Paper',
168:   description: 'Paper-texture overlay (fiber-noise multiply)',
169:   color: '#fef3c7',
170:   uniforms: [
171:     { name: 'amount', label: 'Amount', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
172:     { name: 'scale', label: 'Scale', type: 'float', default: 80.0, ui: { min: 8, max: 300, step: 1 } },
173:     { name: 'fiberAngle', label: 'Fiber Angle', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
174:   ],
175:   glsl: {
176:     dependencies: ['simplex2D', 'rotate2D'],
177:     main: `
178: vec2 q = rotate2D(uv * {{scale}}, {{fiberAngle}} * 3.14159 / 180.0);
179: float n = simplex2D(q) * 0.5 + simplex2D(q * 3.0) * 0.25 + simplex2D(q * 9.0) * 0.125;
180: float w = 1.0 - {{amount}} * (0.5 - n);
181: return vec4(base.rgb * w, base.a);`,
182:   },
183: })
184:
185: export const STYLIZE_LAYERS: Record<string, LayerDefinition> = {
186:   halftone: halftoneLayer,
187:   dither: ditherLayer,
188:   posterize: posterizeLayer,
189:   emboss: embossLayer,
190:   ascii: asciiLayer,
191:   'film-grain-2': filmGrain2Layer,
192:   'vignette-2': vignette2Layer,
193:   paper: paperLayer,
194: }

(End of file - total 194 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/glsl-utils.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/glsl-utils.ts</path>
<type>file</type>
<content>
1: // Shared GLSL utility functions that can be reused across layers
2: // Each function is keyed by name for deduplication
3:
4: export const GLSL_UTILS: Record<string, string> = {
5:   // Random and hash functions
6:   hash: `
7: float hash(vec2 p) {
8:   return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
9: }`,
10:
11:   hash2: `
12: vec2 hash2(vec2 p) {
13:   return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
14: }`,
15:
16:   hash3: `
17: vec3 hash3(vec2 p) {
18:   vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
19:                 dot(p, vec2(269.5, 183.3)),
20:                 dot(p, vec2(419.2, 371.9)));
21:   return fract(sin(q) * 43758.5453);
22: }`,
23:
24:   // Noise functions
25:   simplex2D: `
26: vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
27: vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
28: vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
29:
30: float simplex2D(vec2 v) {
31:   const vec4 C = vec4(0.211324865405187, 0.366025403784439,
32:                       -0.577350269189626, 0.024390243902439);
33:   vec2 i = floor(v + dot(v, C.yy));
34:   vec2 x0 = v - i + dot(i, C.xx);
35:   vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
36:   vec4 x12 = x0.xyxy + C.xxzz;
37:   x12.xy -= i1;
38:   i = mod289v2(i);
39:   vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
40:   vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
41:   m = m * m;
42:   m = m * m;
43:   vec3 x = 2.0 * fract(p * C.www) - 1.0;
44:   vec3 h = abs(x) - 0.5;
45:   vec3 ox = floor(x + 0.5);
46:   vec3 a0 = x - ox;
47:   m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
48:   vec3 g;
49:   g.x = a0.x * x0.x + h.x * x0.y;
50:   g.yz = a0.yz * x12.xz + h.yz * x12.yw;
51:   return 130.0 * dot(m, g);
52: }`,
53:
54:   // FBM (Fractal Brownian Motion)
55:   fbm: `
56: float fbm(vec2 p, float octaves, float lacunarity, float gain) {
57:   float sum = 0.0;
58:   float amp = 1.0;
59:   float freq = 1.0;
60:   float maxOct = min(octaves, 8.0);
61:   for (float i = 0.0; i < 8.0; i += 1.0) {
62:     if (i >= maxOct) break;
63:     sum += amp * simplex2D(p * freq);
64:     freq *= lacunarity;
65:     amp *= gain;
66:   }
67:   return sum;
68: }`,
69:
70:   // Voronoi
71:   voronoi: `
72: vec3 voronoi(vec2 x, float randomness) {
73:   vec2 n = floor(x);
74:   vec2 f = fract(x);
75:   float minDist = 8.0;
76:   vec2 minPoint = vec2(0.0);
77:   vec2 minCell = vec2(0.0);
78:   for (int j = -1; j <= 1; j++) {
79:     for (int i = -1; i <= 1; i++) {
80:       vec2 g = vec2(float(i), float(j));
81:       vec2 o = hash2(n + g) * randomness;
82:       vec2 r = g - f + o;
83:       float d = dot(r, r);
84:       if (d < minDist) {
85:         minDist = d;
86:         minPoint = r;
87:         minCell = n + g;
88:       }
89:     }
90:   }
91:   return vec3(sqrt(minDist), minCell);
92: }`,
93:
94:   // Blend modes
95:   blendNormal: `
96: vec4 blendNormal(vec4 base, vec4 blend, float opacity) {
97:   return mix(base, blend, blend.a * opacity);
98: }`,
99:
100:   blendAdd: `
101: vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
102:   return base + blend * opacity;
103: }`,
104:
105:   blendMultiply: `
106: vec4 blendMultiply(vec4 base, vec4 blend, float opacity) {
107:   return mix(base, base * blend, opacity);
108: }`,
109:
110:   blendScreen: `
111: vec4 blendScreen(vec4 base, vec4 blend, float opacity) {
112:   return mix(base, 1.0 - (1.0 - base) * (1.0 - blend), opacity);
113: }`,
114:
115:   blendOverlay: `
116: vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
117:   vec4 result;
118:   result.rgb = mix(
119:     2.0 * base.rgb * blend.rgb,
120:     1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
121:     step(0.5, base.rgb)
122:   );
123:   result.a = blend.a;
124:   return mix(base, result, opacity);
125: }`,
126:
127:   blendSoftLight: `
128: vec4 blendSoftLight(vec4 base, vec4 blend, float opacity) {
129:   vec4 result;
130:   result.rgb = mix(
131:     2.0 * base.rgb * blend.rgb + base.rgb * base.rgb * (1.0 - 2.0 * blend.rgb),
132:     sqrt(base.rgb) * (2.0 * blend.rgb - 1.0) + 2.0 * base.rgb * (1.0 - blend.rgb),
133:     step(0.5, blend.rgb)
134:   );
135:   result.a = blend.a;
136:   return mix(base, result, opacity);
137: }`,
138:
139:   blendHardLight: `
140: vec4 blendHardLight(vec4 base, vec4 blend, float opacity) {
141:   vec4 result;
142:   result.rgb = mix(
143:     2.0 * base.rgb * blend.rgb,
144:     1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
145:     step(0.5, blend.rgb)
146:   );
147:   result.a = blend.a;
148:   return mix(base, result, opacity);
149: }`,
150:
151:   // Utility functions
152:   remap: `
153: float remap(float value, float inMin, float inMax, float outMin, float outMax) {
154:   return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
155: }`,
156:
157:   rotate2D: `
158: vec2 rotate2D(vec2 v, float angle) {
159:   float s = sin(angle);
160:   float c = cos(angle);
161:   return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
162: }`,
163:
164:   // Aspect-corrected centered UV: y in [-0.5, 0.5], x scaled by aspect.
165:   // Use this whenever a primitive needs to look the same on any canvas shape.
166:   screenUv: `
167: vec2 screenUv(vec2 uv) {
168:   return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
169: }`,
170:
171:   // Anti-aliased step using screen-space derivatives.
172:   // Works in WebGL2 / GLSL ES 3.00 where fwidth is core (no extension required).
173:   aastep: `
174: float aastep(float threshold, float value) {
175:   float afwidth = max(0.5 * fwidth(value), 1e-6);
176:   return smoothstep(threshold - afwidth, threshold + afwidth, value);
177: }`,
178:
179:   // Smooth-min (continuous union) — k controls softness.
180:   smin: `
181: float smin(float a, float b, float k) {
182:   float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
183:   return mix(b, a, h) - k * h * (1.0 - h);
184: }`,
185:
186:   // 2D Signed-Distance Functions (Inigo Quilez canonical set).
187:   sdCircle: `
188: float sdCircle(vec2 p, float r) { return length(p) - r; }`,
189:
190:   sdBox: `
191: float sdBox(vec2 p, vec2 b) {
192:   vec2 d = abs(p) - b;
193:   return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
194: }`,
195:
196:   sdRoundedBox: `
197: float sdRoundedBox(vec2 p, vec2 b, float r) {
198:   vec2 q = abs(p) - b + vec2(r);
199:   return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
200: }`,
201:
202:   sdEllipse: `
203: float sdEllipse(vec2 p, vec2 ab) {
204:   p = abs(p);
205:   if (p.x > p.y) { p = p.yx; ab = ab.yx; }
206:   float l = ab.y * ab.y - ab.x * ab.x;
207:   float m = ab.x * p.x / l;
208:   float m2 = m * m;
209:   float n = ab.y * p.y / l;
210:   float n2 = n * n;
211:   float c = (m2 + n2 - 1.0) / 3.0;
212:   float c3 = c * c * c;
213:   float q = c3 + m2 * n2 * 2.0;
214:   float d = c3 + m2 * n2;
215:   float g = m + m * n2;
216:   float co;
217:   if (d < 0.0) {
218:     float h = acos(q / c3) / 3.0;
219:     float s = cos(h);
220:     float t = sin(h) * sqrt(3.0);
221:     float rx = sqrt(-c * (s + t + 2.0) + m2);
222:     float ry = sqrt(-c * (s - t + 2.0) + m2);
223:     co = (ry + sign(l) * rx + abs(g) / (rx * ry) - m) / 2.0;
224:   } else {
225:     float h = 2.0 * m * n * sqrt(d);
226:     float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
227:     float u = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
228:     float rx = -s - u - c * 4.0 + 2.0 * m2;
229:     float ry = (s - u) * sqrt(3.0);
230:     float rm = sqrt(rx * rx + ry * ry);
231:     co = (ry / sqrt(rm - rx) + 2.0 * g / rm - m) / 2.0;
232:   }
233:   vec2 r = vec2(ab.x * co, ab.y * sqrt(1.0 - co * co));
234:   return length(r - p) * sign(p.y - r.y);
235: }`,
236:
237:   sdEquilateralTriangle: `
238: float sdEquilateralTriangle(vec2 p, float r) {
239:   const float k = 1.7320508; // sqrt(3)
240:   p.x = abs(p.x) - r;
241:   p.y = p.y + r / k;
242:   if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
243:   p.x -= clamp(p.x, -2.0 * r, 0.0);
244:   return -length(p) * sign(p.y);
245: }`,
246:
247:   sdRegularPolygon: `
248: float sdRegularPolygon(vec2 p, float r, float n) {
249:   float an = 3.1415926 / n;
250:   float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
251:   return length(p) * cos(bn) - r * cos(an);
252: }`,
253:
254:   sdStar: `
255: float sdStar(vec2 p, float r, float n, float m) {
256:   float an = 3.1415926 / n;
257:   float en = 3.1415926 / m;
258:   vec2 acs = vec2(cos(an), sin(an));
259:   vec2 ecs = vec2(cos(en), sin(en));
260:   float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
261:   p = length(p) * vec2(cos(bn), abs(sin(bn)));
262:   p -= r * acs;
263:   p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
264:   return length(p) * sign(p.x);
265: }`,
266:
267:   sdSegment: `
268: float sdSegment(vec2 p, vec2 a, vec2 b) {
269:   vec2 pa = p - a, ba = b - a;
270:   float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
271:   return length(pa - ba * h);
272: }`,
273:
274:   sdCross: `
275: float sdCross(vec2 p, vec2 b, float r) {
276:   p = abs(p); p = (p.y > p.x) ? p.yx : p.xy;
277:   vec2 q = p - b;
278:   float k = max(q.y, q.x);
279:   vec2 w = (k > 0.0) ? q : vec2(b.y - p.x, -k);
280:   return sign(k) * length(max(w, 0.0)) + r;
281: }`,
282:
283:   sdVesica: `
284: float sdVesica(vec2 p, float r, float d) {
285:   p = abs(p);
286:   float b = sqrt(r * r - d * d);
287:   return ((p.y - b) * d > p.x * b)
288:     ? length(p - vec2(0.0, b))
289:     : length(p - vec2(-d, 0.0)) - r;
290: }`,
291:
292:   // HSV conversion
293:   rgb2hsv: `
294: vec3 rgb2hsv(vec3 c) {
295:   vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
296:   vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
297:   vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
298:   float d = q.x - min(q.w, q.y);
299:   float e = 1.0e-10;
300:   return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
301: }`,
302:
303:   hsv2rgb: `
304: vec3 hsv2rgb(vec3 c) {
305:   vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
306:   vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
307:   return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
308: }`,
309:
310:   luma: `
311: float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }`,
312:
313:   // Paper Shaders' procedural value-noise hash. Used by Paper's mesh-gradient
314:   // and value-noise primitives. Different distribution from our hash().
315:   hash21: `
316: float hash21(vec2 p) {
317:   p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
318:   p += dot(p, p + 19.19);
319:   return fract(p.x * p.y);
320: }`,
321:
322:   // Paper's procedural 2D-out hash. Better-distributed than two hash21 calls.
323:   hash22: `
324: vec2 hash22(vec2 p) {
325:   p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
326:   p += dot(p, p.yx + 19.19);
327:   return fract(vec2(p.x * p.y, p.x + p.y));
328: }`,
329:
330:   // Paper's `snoise` is byte-identical to our simplex2D — we just expose the
331:   // Paper-canonical name so verbatim ports compile without renaming.
332:   snoise: `
333: float snoise(vec2 v) { return simplex2D(v); }`,
334:
335:   // Sampler-helper: maps canvas-space UV in [0,1] to image-space UV, honouring
336:   // image aspect, fit mode (0=cover, 1=contain, 2=fill), uniform scale, rotation
337:   // (radians) and pixel-space offset. Canvas aspect comes from u_resolution.
338:   // Meta layout: (imgAspect, fitMode, scale, rotation). Offset is vec2 in UV.
339:   applySizing: `
340: vec2 applySizing(vec2 uv, vec4 meta, vec2 offset) {
341:   vec2 c = uv - 0.5 - offset;
342:   float canvasAspect = u_resolution.x / max(u_resolution.y, 1.0);
343:   float imgAspect = max(meta.x, 1e-4);
344:   float fitMode = meta.y;
345:   float scale = max(meta.z, 1e-4);
346:   float rot = meta.w;
347:   // Rotate around center.
348:   float ca = cos(rot);
349:   float sa = sin(rot);
350:   c = vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca);
351:   // Aspect correction. Cover (default) fills the canvas; contain letterboxes;
352:   // fill stretches.
353:   vec2 ratio = vec2(1.0);
354:   if (fitMode < 0.5) {
355:     // cover: shrink the axis with smaller "image fits" so image fills canvas.
356:     if (canvasAspect > imgAspect) {
357:       ratio = vec2(1.0, imgAspect / canvasAspect);
358:     } else {
359:       ratio = vec2(canvasAspect / imgAspect, 1.0);
360:     }
361:   } else if (fitMode < 1.5) {
362:     // contain: opposite axis.
363:     if (canvasAspect > imgAspect) {
364:       ratio = vec2(imgAspect / canvasAspect, 1.0);
365:     } else {
366:       ratio = vec2(1.0, canvasAspect / imgAspect);
367:     }
368:   } // fill: ratio stays (1,1).
369:   c /= max(scale, 1e-4);
370:   c /= ratio;
371:   return c + 0.5;
372: }`,
373:
374:   // Smooth/stepped color-ramp lookup over a fixed-size vec4 palette. Steps=0
375:   // means smooth; steps>0 quantises the input. The fixed array length 10 must
376:   // match RAMP_MAX in the generator emission.
377:   colorRampLookup: `
378: vec4 colorRampLookup(float t, vec4 colors[10], int count, int steps) {
379:   int n = max(count, 1);
380:   if (n == 1) return colors[0];
381:   float tc = clamp(t, 0.0, 1.0);
382:   if (steps > 0) {
383:     float fSteps = float(steps);
384:     tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);
385:     tc = clamp(tc, 0.0, 1.0);
386:   }
387:   float seg = tc * float(n - 1);
388:   int i0 = int(floor(seg));
389:   int i1 = i0 + 1;
390:   if (i1 > n - 1) i1 = n - 1;
391:   float f = seg - float(i0);
392:   // GLSL ES 3 disallows non-constant array indexing on sampler/struct arrays
393:   // but vec4 arrays are fine.
394:   vec4 a = colors[i0];
395:   vec4 b = colors[i1];
396:   return mix(a, b, f);
397: }`,
398:
399:   gaussian9: `
400: vec4 gaussian9(sampler2D src, vec2 uv, vec2 r) {
401:   vec4 c = texture(src, uv) * 0.227;
402:   c += texture(src, uv + vec2( r.x, 0.0)) * 0.194;
403:   c += texture(src, uv + vec2(-r.x, 0.0)) * 0.194;
404:   c += texture(src, uv + vec2(0.0,  r.y)) * 0.121;
405:   c += texture(src, uv + vec2(0.0, -r.y)) * 0.121;
406:   c += texture(src, uv + vec2( r.x,  r.y)) * 0.0707;
407:   c += texture(src, uv + vec2(-r.x,  r.y)) * 0.0707;
408:   c += texture(src, uv + vec2( r.x, -r.y)) * 0.0707;
409:   c += texture(src, uv + vec2(-r.x, -r.y)) * 0.0707;
410:   return c;
411: }`,
412: }
413:
414: export const BLEND_MODE_FUNCTIONS: Record<string, string> = {
415:   normal: 'blendNormal',
416:   add: 'blendAdd',
417:   multiply: 'blendMultiply',
418:   screen: 'blendScreen',
419:   overlay: 'blendOverlay',
420:   softLight: 'blendSoftLight',
421:   hardLight: 'blendHardLight',
422: }

(End of file - total 422 lines)
</content>
```

---

## Assistant (Build · GLM-5.1 · 33.9s)

Very good, Mr. Nickerson. I have sufficient context to begin. Let me implement the primitives in priority order.

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/glsl-utils.ts",
  "oldString": "  // Smooth/stepped color-ramp lookup over a fixed-size vec4 palette. Steps=0\n  // means smooth; steps>0 quantises the input. The fixed array length 10 must\n  // match RAMP_MAX in the generator emission.\n  colorRampLookup: `\nvec4 colorRampLookup(float t, vec4 colors[10], int count, int steps) {\n  int n = max(count, 1);\n  if (n == 1) return colors[0];\n  float tc = clamp(t, 0.0, 1.0);\n  if (steps > 0) {\n    float fSteps = float(steps);\n    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);\n    tc = clamp(tc, 0.0, 1.0);\n  }\n  float seg = tc * float(n - 1);\n  int i0 = int(floor(seg));\n  int i1 = i0 + 1;\n  if (i1 > n - 1) i1 = n - 1;\n  float f = seg - float(i0);\n  // GLSL ES 3 disallows non-constant array indexing on sampler/struct arrays\n  // but vec4 arrays are fine.\n  vec4 a = colors[i0];\n  vec4 b = colors[i1];\n  return mix(a, b, f);\n}`,",
  "newString": "  // Smooth/stepped color-ramp lookup over a fixed-size vec4 palette.\n  // steps=0 → smooth, steps>0 → quantised globally.\n  // stepsPerColor>0 → quantise within each color segment.\n  // softness controls blend sharpness (0=hard, 1=fully smooth).\n  // wrap=true → palette repeats; wrap=false → clamp at last color.\n  // The fixed array length 10 must match RAMP_MAX in the generator emission.\n  colorRampLookup: `\nvec4 colorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {\n  int n = max(count, 1);\n  if (n == 1) return colors[0];\n  float tc = clamp(t, 0.0, 1.0);\n  if (wrap) tc = fract(tc);\n  if (steps > 0) {\n    float fSteps = float(steps);\n    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);\n    tc = clamp(tc, 0.0, 1.0);\n  }\n  float seg = tc * float(n - 1);\n  int i0 = int(floor(seg));\n  int i1 = i0 + 1;\n  if (i1 > n - 1) i1 = wrap ? 0 : n - 1;\n  float f = seg - float(i0);\n  if (stepsPerColor > 1) {\n    float spc = float(stepsPerColor);\n    f = floor(f * spc) / max(spc - 1.0, 1.0);\n    f = clamp(f, 0.0, 1.0);\n  }\n  float fw = fwidth(f);\n  float s = max(softness, 0.0);\n  f = smoothstep(0.5 - s - fw, 0.5 + s + fw, f);\n  vec4 a = colors[i0];\n  vec4 b = colors[i1];\n  return mix(a, b, f);\n}`,"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · GLM-5.1 · 22.8s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts",
  "newString": "export const colorRampLayer = sampleFx({\n  id: 'color-ramp',\n  name: 'Color Ramp',\n  description: 'Map a scalar (luma or RGBA channel) through an N-stop palette',\n  color: '#f59e0b',\n  uniforms: [\n    {\n      name: 'colors',\n      label: 'Colors',\n      type: 'vec4Array',\n      arrayLength: 10,\n      default: {\n        values: [\n          [0.05, 0.05, 0.1, 1],\n          [0.4, 0.6, 1.0, 1],\n          [1.0, 0.95, 0.85, 1],\n        ],\n        length: 3,\n      },\n      ui: { array: { minLength: 1, maxLength: 10 } },\n    },\n    {\n      name: 'channel',\n      label: 'Channel',\n      type: 'int',\n      default: 0,\n      ui: { min: 0, max: 4, step: 1 },\n    },\n    {\n      name: 'steps',\n      label: 'Steps',\n      type: 'int',\n      default: 0,\n      ui: { min: 0, max: 16, step: 1 },\n    },\n    {\n      name: 'stepsPerColor',\n      label: 'Steps/Color',\n      type: 'int',\n      default: 1,\n      ui: { min: 1, max: 10, step: 1 },\n    },\n    {\n      name: 'softness',\n      label: 'Softness',\n      type: 'float',\n      default: 0.5,\n      ui: { min: 0, max: 1, step: 0.01 },\n    },\n    {\n      name: 'wrap',\n      label: 'Wrap',\n      type: 'bool',\n      default: false,\n    },\n    {\n      name: 'domainMin',\n      label: 'Domain Min',\n      type: 'float',\n      default: 0,\n      ui: { min: 0, max: 1, step: 0.01 },\n    },\n    {\n      name: 'domainMax',\n      label: 'Domain Max',\n      type: 'float',\n      default: 1,\n      ui: { min: 0, max: 1, step: 0.01 },\n    },\n  ],\n  glsl: {\n    dependencies: ['luma', 'colorRampLookup'],\n    main: `\nvec4 src = texture(u_prevPass, uv);\nfloat scalar;\nint ch = {{channel}};\nif (ch == 0) scalar = luma(src.rgb);\nelse if (ch == 1) scalar = src.r;\nelse if (ch == 2) scalar = src.g;\nelse if (ch == 3) scalar = src.b;\nelse scalar = src.a;\nfloat span = max({{domainMax}} - {{domainMin}}, 1e-4);\nfloat t = clamp((scalar - {{domainMin}}) / span, 0.0, 1.0);\nreturn colorRampLookup(t, {{colors}}, {{colors}}_count, {{steps}}, {{softness}}, {{stepsPerColor}}, {{wrap}});`,\n  },\n})",
  "oldString": "export const colorRampLayer = sampleFx({\n  id: 'color-ramp',\n  name: 'Color Ramp',\n  description: 'Map a scalar (luma or RGBA channel) through an N-stop palette',\n  color: '#f59e0b',\n  uniforms: [\n    {\n      name: 'colors',\n      label: 'Colors',\n      type: 'vec4Array',\n      arrayLength: 10,\n      default: {\n        values: [\n          [0.05, 0.05, 0.1, 1],\n          [0.4, 0.6, 1.0, 1],\n          [1.0, 0.95, 0.85, 1],\n        ],\n        length: 3,\n      },\n      ui: { array: { minLength: 1, maxLength: 10 } },\n    },\n    {\n      name: 'channel',\n      label: 'Channel',\n      type: 'int',\n      default: 0,\n      ui: { min: 0, max: 4, step: 1 },\n    },\n    {\n      name: 'steps',\n      label: 'Steps',\n      type: 'int',\n      default: 0,\n      ui: { min: 0, max: 16, step: 1 },\n    },\n    {\n      name: 'domainMin',\n      label: 'Domain Min',\n      type: 'float',\n      default: 0,\n      ui: { min: 0, max: 1, step: 0.01 },\n    },\n    {\n      name: 'domainMax',\n      label: 'Domain Max',\n      type: 'float',\n      default: 1,\n      ui: { min: 0, max: 1, step: 0.01 },\n    },\n  ],\n  glsl: {\n    dependencies: ['luma', 'colorRampLookup'],\n    main: `\nvec4 src = texture(u_prevPass, uv);\nfloat scalar;\nint ch = {{channel}};\nif (ch == 0) scalar = luma(src.rgb);\nelse if (ch == 1) scalar = src.r;\nelse if (ch == 2) scalar = src.g;\nelse if (ch == 3) scalar = src.b;\nelse scalar = src.a;\nfloat span = max({{domainMax}} - {{domainMin}}, 1e-4);\nfloat t = clamp((scalar - {{domainMin}}) / span, 0.0, 1.0);\nreturn colorRampLookup(t, {{colors}}, {{colors}}_count, {{steps}});`,\n  },\n})"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · GLM-5.1 · 31.4s)

Now add the new primitives. Let me add `scalar-field`, `mesh-spots-gradient`, `organic-warp`, and the image analysis layers.

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts",
  "newString": "import type { LayerDefinition } from '../types'\nimport { gen, SCREEN_P } from './_helpers'\n\nexport const scalarFieldLayer = gen({\n  id: 'scalar-field',\n  name: 'Scalar Field',\n  description: 'Grayscale procedural field for driving color ramps and masks',\n  color: '#94a3b8',\n  uniforms: [\n    { name: 'mode', label: 'Mode', type: 'int', default: 0, ui: { min: 0, max: 8, step: 1 } },\n    { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.1, max: 30, step: 0.1 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'octaves', label: 'Octaves', type: 'float', default: 5.0, ui: { min: 1, max: 8, step: 1 } },\n    { name: 'persistence', label: 'Persistence', type: 'float', default: 0.5, ui: { min: 0.1, max: 1, step: 0.01 } },\n    { name: 'lacunarity', label: 'Lacunarity', type: 'float', default: 2.0, ui: { min: 1.1, max: 4, step: 0.1 } },\n    { name: 'contrast', label: 'Contrast', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },\n    { name: 'brightness', label: 'Brightness', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },\n    { name: 'seed', label: 'Seed', type: 'float', default: 0.0, ui: { min: 0, max: 100, step: 0.1 } },\n  ],\n  glsl: {\n    dependencies: ['simplex2D'],\n    functions: `\nfloat sfFbm(vec2 p, float oct, float lac, float per) {\n  float sum = 0.0, amp = 1.0, freq = 1.0, mx = 0.0;\n  for (int i = 0; i < 8; i++) {\n    if (float(i) >= oct) break;\n    sum += amp * simplex2D(p * freq);\n    mx += amp; amp *= per; freq *= lac;\n  }\n  return sum / max(mx, 1e-4);\n}\nfloat sfTendrils(vec2 p, float t) {\n  float scaleMul = 1.0, sineAcc = 0.0;\n  for (int i = 0; i < 15; i++) {\n    p = vec2(p.x + sin(p.y + t), p.y + cos(p.x + t * 1.3));\n    p *= 1.2; scaleMul *= 1.2;\n    sineAcc += abs(sin(p.x * 0.5)) + abs(cos(p.y * 0.5));\n  }\n  return sineAcc / 30.0;\n}\nfloat sfRings(vec2 p, float t) {\n  float r = length(p);\n  return sin(r * 20.0 - t * 3.0) * 0.5 + 0.5;\n}\nfloat sfWaves(vec2 p, float t) {\n  return sin(p.x * 10.0 + t) * 0.5 + 0.5;\n}\nfloat sfRipples(vec2 p, float t) {\n  float r = length(p);\n  float v = sin(r * 30.0 - t * 4.0) * exp(-r * 3.0);\n  return v * 0.5 + 0.5;\n}\nfloat sfBlobs(vec2 p, float t) {\n  float v = 0.0;\n  for (int i = 0; i < 5; i++) {\n    float fi = float(i);\n    vec2 c = vec2(sin(t * (0.3 + fi * 0.17) + fi * 0.37) * 0.4,\n                  cos(t * (0.4 + fi * 0.13) + fi * 0.53) * 0.4);\n    float d = length(p - c);\n    v += 0.08 / (d * d + 0.01);\n  }\n  return clamp(v, 0.0, 1.0);\n}\nfloat sfSphere(vec2 p) {\n  float r = length(p);\n  return sqrt(max(1.0 - r * r * 4.0, 0.0));\n}`,\n    main: `\n${SCREEN_P}\nfloat t = u_time * {{speed}};\nvec2 q = p * {{scale}} + {{seed}};\nint m = {{mode}};\nfloat v;\nif (m == 0) {\n  v = sfFbm(q + vec2(0.0, 0.3 * t), {{octaves}}, {{lacunarity}}, {{persistence}}) * 0.5 + 0.5;\n} else if (m == 1) {\n  v = 0.5 * (simplex2D(q - vec2(0.0, 0.3 * t)) + simplex2D(2.0 * q + vec2(0.0, 0.32 * t))) * 0.5 + 0.5;\n} else if (m == 2) {\n  v = sfTendrils(p * 13.0, t);\n  v = pow(clamp(v * v * {{contrast}}, 0.0, 1.0), 0.7);\n} else if (m == 3) {\n  v = sfRings(p, t);\n} else if (m == 4) {\n  v = sfWaves(p, t);\n} else if (m == 5) {\n  v = sfRipples(p, t);\n} else if (m == 6) {\n  v = sfBlobs(p, t);\n} else if (m == 7) {\n  v = abs(simplex2D(q + t * 0.2));\n} else {\n  v = sfSphere(p);\n}\nv = clamp(v * {{contrast}} + {{brightness}}, 0.0, 1.0);\nreturn vec4(v, v, v, 1.0);`,\n  },\n  outputKind: 'scalar',\n})\n\nconst screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);\nvec2 p = (uv - 0.5) * _ar;`",
  "oldString": "import type { LayerDefinition } from '../types'\n\nconst screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);\nvec2 p = (uv - 0.5) * _ar;`"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · GLM-5.1 · 5.4s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts",
  "newString": "export const NOISE_LAYERS: Record<string, LayerDefinition> = {\n  'scalar-field': scalarFieldLayer,\n  plasma: plasmaLayer,\n  'perlin-noise': perlinNoiseLayer,\n  'flow-field': flowFieldLayer,\n  aurora: auroraLayer,\n  'spiral-pattern': spiralLayer,\n  'contour-lines': contourLinesLayer,\n}",
  "oldString": "export const NOISE_LAYERS: Record<string, LayerDefinition> = {\n  plasma: plasmaLayer,\n  'perlin-noise': perlinNoiseLayer,\n  'flow-field': flowFieldLayer,\n  aurora: auroraLayer,\n  'spiral-pattern': spiralLayer,\n  'contour-lines': contourLinesLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · GLM-5.1 · 2.5s)

Now add `mesh-spots-gradient` and `organic-warp`:

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/gradients.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/gradients.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2:
3: // All gradients here use 3 colors (color1 → color2 → color3) with adjustable
4: // midpoint position. Multi-color palette ramps will land later as a separate
5: // uniform type; 3 stops covers the common case for now.
6:
7: const threeColors = (): LayerDefinition['uniforms'] => [
8:   { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.05, 0.05, 0.15], ui: { color: true } },
9:   { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.5, 0.2, 0.6], ui: { color: true } },
10:   { name: 'color3', label: 'Color 3', type: 'vec3', default: [1.0, 0.8, 0.4], ui: { color: true } },
11:   { name: 'midPoint', label: 'Mid Position', type: 'float', default: 0.5, ui: { min: 0.05, max: 0.95, step: 0.01 } },
12: ]
13:
14: const sampleRamp = `vec3 sampleRamp(float t, vec3 c1, vec3 c2, vec3 c3, float mid) {
15:   if (t < mid) return mix(c1, c2, t / max(mid, 1e-4));
16:   return mix(c2, c3, (t - mid) / max(1.0 - mid, 1e-4));
17: }`
18:
19: const screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
20: vec2 p = (uv - 0.5) * _ar;`
21:
22: export const linearGradientV2Layer: LayerDefinition = {
23:   id: 'linear-gradient-v2',
24:   name: 'Linear Gradient (3-color)',
25:   description: 'Linear gradient with three color stops',
26:   color: '#fb923c',
27:   category: 'generator',
28:   defaultBlendMode: 'normal',
29:   uniforms: [
30:     ...threeColors(),
31:     { name: 'angle', label: 'Angle', type: 'float', default: 90.0, ui: { min: 0, max: 360, step: 1 } },
32:     { name: 'spread', label: 'Spread', type: 'float', default: 1.0, ui: { min: 0.1, max: 2, step: 0.01 } },
33:   ],
34:   glsl: {
35:     dependencies: ['rotate2D'],
36:     functions: sampleRamp,
37:     main: `
38: ${screenP}
39: p = rotate2D(p, {{angle}} * 3.14159 / 180.0);
40: float t = clamp((p.y / {{spread}}) + 0.5, 0.0, 1.0);
41: return vec4(sampleRamp(t, {{color1}}, {{color2}}, {{color3}}, {{midPoint}}), 1.0);`,
42:   },
43: }
44:
45: export const radialGradientV2Layer: LayerDefinition = {
46:   id: 'radial-gradient-v2',
47:   name: 'Radial Gradient (3-color)',
48:   description: 'Radial gradient with focal point and three colors',
49:   color: '#fb923c',
50:   category: 'generator',
51:   defaultBlendMode: 'normal',
52:   uniforms: [
53:     ...threeColors(),
54:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
55:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
56:     { name: 'radius', label: 'Radius', type: 'float', default: 0.6, ui: { min: 0.05, max: 2, step: 0.01 } },
57:     { name: 'falloff', label: 'Falloff', type: 'float', default: 1.0, ui: { min: 0.2, max: 4, step: 0.01 } },
58:   ],
59:   glsl: {
60:     functions: sampleRamp,
61:     main: `
62: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
63: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
64: float t = clamp(pow(length(p) / {{radius}}, {{falloff}}), 0.0, 1.0);
65: return vec4(sampleRamp(t, {{color1}}, {{color2}}, {{color3}}, {{midPoint}}), 1.0);`,
66:   },
67: }
68:
69: export const conicGradientLayer: LayerDefinition = {
70:   id: 'conic-gradient',
71:   name: 'Conic Gradient',
72:   description: 'Sweep gradient around a center point',
73:   color: '#fb923c',
74:   category: 'generator',
75:   defaultBlendMode: 'normal',
76:   uniforms: [
77:     ...threeColors(),
78:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
79:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
80:     { name: 'rotation', label: 'Rotation', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
81:   ],
82:   glsl: {
83:     functions: sampleRamp,
84:     main: `
85: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
86: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
87: float a = atan(p.y, p.x) + 3.14159;
88: float t = fract(a / 6.28318 + {{rotation}} / 360.0);
89: return vec4(sampleRamp(t, {{color1}}, {{color2}}, {{color3}}, {{midPoint}}), 1.0);`,
90:   },
91: }
92:
93: export const diamondGradientLayer: LayerDefinition = {
94:   id: 'diamond-gradient',
95:   name: 'Diamond Gradient',
96:   description: 'Diamond / Manhattan-distance gradient',
97:   color: '#fb923c',
98:   category: 'generator',
99:   defaultBlendMode: 'normal',
100:   uniforms: [
101:     ...threeColors(),
102:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
103:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
104:     { name: 'radius', label: 'Radius', type: 'float', default: 0.6, ui: { min: 0.05, max: 2, step: 0.01 } },
105:     { name: 'rotation', label: 'Rotation', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
106:   ],
107:   glsl: {
108:     dependencies: ['rotate2D'],
109:     functions: sampleRamp,
110:     main: `
111: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
112: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
113: p = rotate2D(p, {{rotation}} * 3.14159 / 180.0);
114: float d = (abs(p.x) + abs(p.y)) / {{radius}};
115: float t = clamp(d, 0.0, 1.0);
116: return vec4(sampleRamp(t, {{color1}}, {{color2}}, {{color3}}, {{midPoint}}), 1.0);`,
117:   },
118: }
119:
120: // MultiPointGradient — N animated/static color spots blended via smooth-min
121: // distance. The mesh-gradient family. Limited to 4 spots until a true
122: // colorRamp uniform type lands; that's plenty for designer ergonomics.
123:
124: export const multiPointGradientLayer: LayerDefinition = {
125:   id: 'multi-point-gradient',
126:   name: 'Multi-Point Gradient',
127:   description: '4 colored spots blended into a soft mesh gradient',
128:   color: '#fb923c',
129:   category: 'generator',
130:   defaultBlendMode: 'normal',
131:   uniforms: [
132:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.95, 0.4, 0.6], ui: { color: true } },
133:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.4, 0.7, 0.95], ui: { color: true } },
134:     { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.95, 0.85, 0.4], ui: { color: true } },
135:     { name: 'color4', label: 'Color 4', type: 'vec3', default: [0.6, 0.4, 0.9], ui: { color: true } },
136:     { name: 'softness', label: 'Softness', type: 'float', default: 0.6, ui: { min: 0.05, max: 2, step: 0.01 } },
137:     { name: 'speed', label: 'Speed', type: 'float', default: 0.3, ui: { min: 0, max: 3, step: 0.01 } },
138:     { name: 'amplitude', label: 'Amplitude', type: 'float', default: 0.3, ui: { min: 0, max: 0.6, step: 0.01 } },
139:   ],
140:   glsl: {
141:     main: `
142: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
143: vec2 p = (uv - 0.5) * _ar;
144: float t = u_time * {{speed}};
145: vec2 c1 = vec2(cos(t * 0.7), sin(t * 0.9)) * {{amplitude}} + vec2(-0.3, -0.2);
146: vec2 c2 = vec2(cos(t * 1.1 + 1.0), sin(t * 0.8 + 1.0)) * {{amplitude}} + vec2(0.3, -0.1);
147: vec2 c3 = vec2(cos(t * 0.6 + 2.0), sin(t * 1.0 + 2.0)) * {{amplitude}} + vec2(-0.2, 0.3);
148: vec2 c4 = vec2(cos(t * 0.9 + 3.0), sin(t * 0.7 + 3.0)) * {{amplitude}} + vec2(0.3, 0.3);
149: float k = 1.0 / max({{softness}}, 0.001);
150: float w1 = exp(-length(p - c1) * k);
151: float w2 = exp(-length(p - c2) * k);
152: float w3 = exp(-length(p - c3) * k);
153: float w4 = exp(-length(p - c4) * k);
154: float ws = w1 + w2 + w3 + w4 + 1e-4;
155: vec3 col = ({{color1}} * w1 + {{color2}} * w2 + {{color3}} * w3 + {{color4}} * w4) / ws;
156: return vec4(col, 1.0);`,
157:   },
158: }
159:
160: export const GRADIENT_LAYERS: Record<string, LayerDefinition> = {
161:   'linear-gradient-v2': linearGradientV2Layer,
162:   'radial-gradient-v2': radialGradientV2Layer,
163:   'conic-gradient': conicGradientLayer,
164:   'diamond-gradient': diamondGradientLayer,
165:   'multi-point-gradient': multiPointGradientLayer,
166: }

(End of file - total 166 lines)
</content>
```

---

## Assistant (Build · GLM-5.1 · 9.5s)

**Tool: edit**

**Input:**

```json
{}
```

**Error:**

```
Tool execution aborted
```

---

## User

continue

---

## Assistant (Build · Claude Sonnet 4.6 · 73.1s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts",
  "offset": 1,
  "limit": 20
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { gen, SCREEN_P } from './_helpers'
3:
4: export const scalarFieldLayer = gen({
5:   id: 'scalar-field',
6:   name: 'Scalar Field',
7:   description: 'Grayscale procedural field for driving color ramps and masks',
8:   color: '#94a3b8',
9:   uniforms: [
10:     { name: 'mode', label: 'Mode', type: 'int', default: 0, ui: { min: 0, max: 8, step: 1 } },
11:     { name: 'scale', label: 'Scale', type: 'float', default: 3.0, ui: { min: 0.1, max: 30, step: 0.1 } },
12:     { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },
13:     { name: 'octaves', label: 'Octaves', type: 'float', default: 5.0, ui: { min: 1, max: 8, step: 1 } },
14:     { name: 'persistence', label: 'Persistence', type: 'float', default: 0.5, ui: { min: 0.1, max: 1, step: 0.01 } },
15:     { name: 'lacunarity', label: 'Lacunarity', type: 'float', default: 2.0, ui: { min: 1.1, max: 4, step: 0.1 } },
16:     { name: 'contrast', label: 'Contrast', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },
17:     { name: 'brightness', label: 'Brightness', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },
18:     { name: 'seed', label: 'Seed', type: 'float', default: 0.0, ui: { min: 0, max: 100, step: 0.1 } },
19:   ],
20:   glsl: {

(Showing lines 1-20 of 314. Use offset=21 to continue.)
</content>
```

---

## Assistant (Build · Claude Sonnet 4.6 · 10.6s)

Good, both imports are present. Now let me implement all the remaining primitives in parallel, then update the layer library and rewrite the presets.

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/atmospherics.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/atmospherics.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2:
3: const screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
4: vec2 p = (uv - 0.5) * _ar;`
5:
6: // Smoke — drifting layered noise; standalone generator with alpha falloff
7: // so it composites nicely on top of other content.
8: export const smokeLayer: LayerDefinition = {
9:   id: 'smoke',
10:   name: 'Smoke',
11:   description: 'Drifting smoky cloud field',
12:   color: '#94a3b8',
13:   category: 'generator',
14:   defaultBlendMode: 'normal',
15:   uniforms: [
16:     { name: 'color', label: 'Color', type: 'vec3', default: [0.95, 0.95, 1.0], ui: { color: true } },
17:     { name: 'scale', label: 'Scale', type: 'float', default: 2.5, ui: { min: 0.3, max: 12, step: 0.05 } },
18:     { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },
19:     { name: 'density', label: 'Density', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
20:     { name: 'softness', label: 'Softness', type: 'float', default: 0.6, ui: { min: 0.05, max: 1, step: 0.01 } },
21:   ],
22:   glsl: {
23:     dependencies: ['simplex2D'],
24:     main: `
25: ${screenP}
26: vec2 q = p * {{scale}};
27: float t = u_time * {{speed}};
28: float v = 0.0;
29: float amp = 0.5;
30: for (int i = 0; i < 5; i++) {
31:   v += simplex2D(q + vec2(t, t * 0.7)) * amp;
32:   q *= 2.0;
33:   amp *= 0.5;
34: }
35: float a = smoothstep(0.5 - {{softness}} * 0.5, 0.5 + {{softness}} * 0.5, v * 0.5 + 0.5);
36: return vec4({{color}}, a * {{density}});`,
37:   },
38: }
39:
40: // Fog — uniform haze that fades toward the edges.
41: export const fogLayer: LayerDefinition = {
42:   id: 'fog',
43:   name: 'Fog',
44:   description: 'Soft volumetric haze',
45:   color: '#cbd5e1',
46:   category: 'generator',
47:   defaultBlendMode: 'normal',
48:   uniforms: [
49:     { name: 'color', label: 'Color', type: 'vec3', default: [0.9, 0.92, 0.95], ui: { color: true } },
50:     { name: 'density', label: 'Density', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },
51:     { name: 'falloff', label: 'Edge Falloff', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },
52:     { name: 'scale', label: 'Texture Scale', type: 'float', default: 4.0, ui: { min: 0.5, max: 20, step: 0.1 } },
53:     { name: 'speed', label: 'Speed', type: 'float', default: 0.2, ui: { min: 0, max: 4, step: 0.05 } },
54:   ],
55:   glsl: {
56:     dependencies: ['simplex2D'],
57:     main: `
58: ${screenP}
59: float n = simplex2D(p * {{scale}} + u_time * {{speed}}) * 0.5 + 0.5;
60: float edge = pow(1.0 - smoothstep(0.0, 0.7, length(p)), {{falloff}});
61: return vec4({{color}}, n * edge * {{density}});`,
62:   },
63: }
64:
65: // Beam — a soft directional light beam crossing the canvas.
66: export const beamLayer: LayerDefinition = {
67:   id: 'beam',
68:   name: 'Beam',
69:   description: 'Soft directional light beam',
70:   color: '#fde68a',
71:   category: 'generator',
72:   defaultBlendMode: 'add',
73:   uniforms: [
74:     { name: 'color', label: 'Color', type: 'vec3', default: [1.0, 0.95, 0.8], ui: { color: true } },
75:     { name: 'angle', label: 'Angle', type: 'float', default: 30.0, ui: { min: 0, max: 360, step: 1 } },
76:     { name: 'thickness', label: 'Thickness', type: 'float', default: 0.15, ui: { min: 0.01, max: 1, step: 0.01 } },
77:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.7, ui: { min: 0, max: 2, step: 0.01 } },
78:     { name: 'offset', label: 'Offset', type: 'float', default: 0.0, ui: { min: -1, max: 1, step: 0.01 } },
79:   ],
80:   glsl: {
81:     dependencies: ['rotate2D'],
82:     main: `
83: ${screenP}
84: p = rotate2D(p, {{angle}} * 3.14159 / 180.0);
85: float d = abs(p.y - {{offset}});
86: float a = exp(-d * d / max({{thickness}} * {{thickness}}, 1e-4)) * {{intensity}};
87: return vec4({{color}} * a, a);`,
88:   },
89: }
90:
91: // God Rays — polar radial rays modulated by angular noise. Drives Paper's godRays.
92: export const godRaysLayer: LayerDefinition = {
93:   id: 'god-rays',
94:   name: 'God Rays',
95:   description: 'Radial light rays from a focal point',
96:   color: '#facc15',
97:   category: 'generator',
98:   defaultBlendMode: 'add',
99:   uniforms: [
100:     { name: 'color', label: 'Color', type: 'vec3', default: [1.0, 0.9, 0.6], ui: { color: true } },
101:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: -0.5, max: 1.5, step: 0.01 } },
102:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: -0.5, max: 1.5, step: 0.01 } },
103:     { name: 'density', label: 'Density', type: 'float', default: 30.0, ui: { min: 1, max: 200, step: 1 } },
104:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.6, ui: { min: 0, max: 3, step: 0.01 } },
105:     { name: 'falloff', label: 'Falloff', type: 'float', default: 1.5, ui: { min: 0.1, max: 5, step: 0.05 } },
106:     { name: 'speed', label: 'Speed', type: 'float', default: 0.2, ui: { min: 0, max: 4, step: 0.05 } },
107:   ],
108:   glsl: {
109:     dependencies: ['simplex2D'],
110:     main: `
111: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
112: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
113: float r = length(p);
114: float a = atan(p.y, p.x);
115: float n = simplex2D(vec2(a * {{density}}, u_time * {{speed}})) * 0.5 + 0.5;
116: float ray = pow(n, 4.0);
117: float f = exp(-r * {{falloff}}) * {{intensity}};
118: float v = ray * f;
119: return vec4({{color}} * v, v);`,
120:   },
121: }
122:
123: // Lens Flare — central bright spot plus a streak.
124: export const lensFlareLayer: LayerDefinition = {
125:   id: 'lens-flare',
126:   name: 'Lens Flare',
127:   description: 'Bright central glow with horizontal streak',
128:   color: '#fde047',
129:   category: 'generator',
130:   defaultBlendMode: 'add',
131:   uniforms: [
132:     { name: 'color', label: 'Color', type: 'vec3', default: [1.0, 0.9, 0.7], ui: { color: true } },
133:     { name: 'centerX', label: 'Center X', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
134:     { name: 'centerY', label: 'Center Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
135:     { name: 'glowSize', label: 'Glow Size', type: 'float', default: 0.15, ui: { min: 0.01, max: 1, step: 0.01 } },
136:     { name: 'streakLength', label: 'Streak Length', type: 'float', default: 0.6, ui: { min: 0, max: 2, step: 0.01 } },
137:     { name: 'intensity', label: 'Intensity', type: 'float', default: 0.8, ui: { min: 0, max: 3, step: 0.01 } },
138:   ],
139:   glsl: {
140:     main: `
141: vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
142: vec2 p = (uv - vec2({{centerX}}, {{centerY}})) * _ar;
143: float r = length(p);
144: float glow = exp(-r * r / max({{glowSize}} * {{glowSize}}, 1e-4));
145: float streak = exp(-abs(p.y) * 60.0) * exp(-abs(p.x) / max({{streakLength}}, 1e-4));
146: float v = (glow + streak * 0.7) * {{intensity}};
147: return vec4({{color}} * v, v);`,
148:   },
149: }
150:
151: export const ATMOSPHERIC_LAYERS: Record<string, LayerDefinition> = {
152:   smoke: smokeLayer,
153:   fog: fogLayer,
154:   beam: beamLayer,
155:   'god-rays': godRaysLayer,
156:   'lens-flare': lensFlareLayer,
157: }

(End of file - total 157 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/lighting.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/lighting.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2: import { fx, TEX_SIZE } from './_helpers'
3:
4: export const neonLayer = fx({
5:   id: 'neon',
6:   name: 'Neon',
7:   description: 'Glowing-edges neon effect',
8:   color: '#facc15',
9:   uniforms: [
10:     { name: 'color', label: 'Color', type: 'vec3', default: [0.4, 0.95, 1.0], ui: { color: true } },
11:     { name: 'thickness', label: 'Edge Thickness', type: 'float', default: 1.5, ui: { min: 0.1, max: 6, step: 0.1 } },
12:     { name: 'glow', label: 'Glow Radius', type: 'float', default: 6.0, ui: { min: 0, max: 30, step: 0.5 } },
13:     { name: 'intensity', label: 'Intensity', type: 'float', default: 1.5, ui: { min: 0, max: 4, step: 0.05 } },
14:   ],
15:   glsl: {
16:     dependencies: ['luma'],
17:     main: `
18: ${TEX_SIZE}
19: vec2 t = texel * {{thickness}};
20: float lc = luma(texture(u_prevPass, uv).rgb);
21: float l1 = luma(texture(u_prevPass, uv + vec2(t.x, 0.0)).rgb);
22: float l2 = luma(texture(u_prevPass, uv - vec2(t.x, 0.0)).rgb);
23: float l3 = luma(texture(u_prevPass, uv + vec2(0.0, t.y)).rgb);
24: float l4 = luma(texture(u_prevPass, uv - vec2(0.0, t.y)).rgb);
25: float edge = abs(l1 - l2) + abs(l3 - l4);
26: vec2 g = texel * {{glow}};
27: vec4 blur = vec4(0.0);
28: for (int i = -2; i <= 2; i++) {
29:   for (int j = -2; j <= 2; j++) {
30:     blur += texture(u_prevPass, uv + g * vec2(float(i), float(j)));
31:   }
32: }
33: blur /= 25.0;
34: float blurEdge = length(blur.rgb - texture(u_prevPass, uv).rgb);
35: vec3 col = {{color}} * (edge * 6.0 + blurEdge * 1.5) * {{intensity}};
36: return vec4(col, 1.0);`,
37:   },
38: })
39:
40: export const dropShadowLayer = fx({
41:   id: 'drop-shadow',
42:   name: 'Drop Shadow',
43:   description: 'Soft shadow behind opaque content',
44:   color: '#1e293b',
45:   uniforms: [
46:     { name: 'color', label: 'Shadow Color', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },
47:     { name: 'opacity', label: 'Opacity', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
48:     { name: 'offsetX', label: 'Offset X', type: 'float', default: 0.005, ui: { min: -0.1, max: 0.1, step: 0.001 } },
49:     { name: 'offsetY', label: 'Offset Y', type: 'float', default: 0.005, ui: { min: -0.1, max: 0.1, step: 0.001 } },
50:     { name: 'blur', label: 'Blur', type: 'float', default: 4.0, ui: { min: 0, max: 30, step: 0.5 } },
51:   ],
52:   glsl: {
53:     main: `
54: ${TEX_SIZE}
55: vec2 r = texel * {{blur}};
56: vec2 off = vec2({{offsetX}}, {{offsetY}});
57: float a = 0.0;
58: const int N = 3;
59: for (int i = -N; i <= N; i++) {
60:   for (int j = -N; j <= N; j++) {
61:     a += texture(u_prevPass, uv - off + r * vec2(float(i), float(j))).a;
62:   }
63: }
64: a /= float((2 * N + 1) * (2 * N + 1));
65: vec4 src = texture(u_prevPass, uv);
66: vec4 shadow = vec4({{color}}, a * {{opacity}});
67: vec4 col;
68: col.rgb = mix(shadow.rgb, src.rgb, src.a);
69: col.a = src.a + shadow.a * (1.0 - src.a);
70: return col;`,
71:   },
72: })
73:
74: export const tiltShiftLayer = fx({
75:   id: 'tilt-shift',
76:   name: 'Tilt Shift',
77:   description: 'Selective focus band (tilt-shift miniature)',
78:   color: '#0ea5e9',
79:   uniforms: [
80:     { name: 'focusY', label: 'Focus Y', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
81:     { name: 'focusWidth', label: 'Focus Width', type: 'float', default: 0.2, ui: { min: 0.01, max: 0.8, step: 0.01 } },
82:     { name: 'blur', label: 'Max Blur', type: 'float', default: 6.0, ui: { min: 0, max: 30, step: 0.5 } },
83:     { name: 'angle', label: 'Angle', type: 'float', default: 0.0, ui: { min: -45, max: 45, step: 1 } },
84:   ],
85:   glsl: {
86:     dependencies: ['rotate2D', 'gaussian9'],
87:     main: `
88: ${TEX_SIZE}
89: vec2 q = rotate2D(uv - 0.5, {{angle}} * 3.14159 / 180.0);
90: float d = abs(q.y - ({{focusY}} - 0.5));
91: float t = smoothstep({{focusWidth}} * 0.5, {{focusWidth}} * 0.5 + 0.4, d);
92: return gaussian9(u_prevPass, uv, texel * {{blur}} * t);`,
93:   },
94: })
95:
96: export const fogOverlayLayer = fx({
97:   id: 'fog-overlay',
98:   name: 'Fog Overlay',
99:   description: 'Atmospheric haze tint',
100:   color: '#cbd5e1',
101:   uniforms: [
102:     { name: 'color', label: 'Fog Color', type: 'vec3', default: [0.85, 0.9, 0.95], ui: { color: true } },
103:     { name: 'amount', label: 'Amount', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },
104:     { name: 'softness', label: 'Softness', type: 'float', default: 0.6, ui: { min: 0, max: 1, step: 0.01 } },
105:   ],
106:   glsl: {
107:     dependencies: ['simplex2D'],
108:     main: `
109: vec4 src = texture(u_prevPass, uv);
110: float n = simplex2D(uv * 4.0 + u_time * 0.1) * 0.5 + 0.5;
111: float w = mix({{amount}}, n * {{amount}}, {{softness}});
112: return vec4(mix(src.rgb, {{color}}, w), src.a);`,
113:   },
114: })
115:
116: export const advancedGlowLayer = fx({
117:   id: 'advanced-glow',
118:   name: 'Advanced Glow',
119:   description: 'True bloom — bright pass + blur + add',
120:   color: '#fbbf24',
121:   uniforms: [
122:     { name: 'threshold', label: 'Threshold', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },
123:     { name: 'radius', label: 'Radius', type: 'float', default: 8.0, ui: { min: 0, max: 40, step: 0.5 } },
124:     { name: 'intensity', label: 'Intensity', type: 'float', default: 1.0, ui: { min: 0, max: 4, step: 0.05 } },
125:     { name: 'tint', label: 'Tint', type: 'vec3', default: [1.0, 1.0, 1.0], ui: { color: true } },
126:   ],
127:   glsl: {
128:     dependencies: ['luma'],
129:     main: `
130: ${TEX_SIZE}
131: vec2 r = texel * {{radius}};
132: vec3 bright = vec3(0.0);
133: const int N = 3;
134: for (int i = -N; i <= N; i++) {
135:   for (int j = -N; j <= N; j++) {
136:     vec3 c = texture(u_prevPass, uv + r * vec2(float(i), float(j))).rgb;
137:     bright += max(c - {{threshold}}, vec3(0.0)) * smoothstep({{threshold}} - 0.05, {{threshold}} + 0.05, luma(c));
138:   }
139: }
140: bright /= float((2 * N + 1) * (2 * N + 1));
141: vec4 src = texture(u_prevPass, uv);
142: return vec4(src.rgb + bright * {{tint}} * {{intensity}}, src.a);`,
143:   },
144: })
145:
146: export const LIGHTING_LAYERS: Record<string, LayerDefinition> = {
147:   neon: neonLayer,
148:   'drop-shadow': dropShadowLayer,
149:   'tilt-shift': tiltShiftLayer,
150:   'fog-overlay': fogOverlayLayer,
151:   'advanced-glow': advancedGlowLayer,
152: }

(End of file - total 152 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts",
  "offset": 1,
  "limit": 50
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/patterns.ts</path>
<type>file</type>
<content>
1: import type { LayerDefinition } from '../types'
2:
3: const PATTERN_DEPS = ['aastep']
4:
5: const screenP = `vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
6: vec2 p = (uv - 0.5) * _ar;`
7:
8: // Two-color pattern primitive helpers. Each pattern computes a 0..1 mask `m`
9: // then outputs mix(color1, color2, m) with alpha = 1.
10:
11: function twoColors(extra: LayerDefinition['uniforms']): LayerDefinition['uniforms'] {
12:   return [
13:     ...extra,
14:     { name: 'color1', label: 'Color 1', type: 'vec3', default: [0.05, 0.05, 0.05], ui: { color: true } },
15:     { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.95, 0.95, 0.95], ui: { color: true } },
16:   ]
17: }
18:
19: export const checkerboardLayer: LayerDefinition = {
20:   id: 'checkerboard',
21:   name: 'Checkerboard',
22:   description: 'Two-tone tiled checker pattern',
23:   color: '#0ea5e9',
24:   category: 'generator',
25:   defaultBlendMode: 'normal',
26:   uniforms: twoColors([
27:     { name: 'scale', label: 'Scale', type: 'float', default: 8.0, ui: { min: 1, max: 64, step: 0.5 } },
28:     { name: 'rotation', label: 'Rotation', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },
29:   ]),
30:   glsl: {
31:     dependencies: [...PATTERN_DEPS, 'rotate2D'],
32:     main: `
33: ${screenP}
34: p = rotate2D(p, {{rotation}} * 3.14159 / 180.0);
35: vec2 cell = floor(p * {{scale}});
36: float m = mod(cell.x + cell.y, 2.0);
37: return vec4(mix({{color1}}, {{color2}}, m), 1.0);`,
38:   },
39: }
40:
41: export const stripesLayer: LayerDefinition = {
42:   id: 'stripes',
43:   name: 'Stripes',
44:   description: 'Hard-edged parallel stripes',
45:   color: '#0ea5e9',
46:   category: 'generator',
47:   defaultBlendMode: 'normal',
48:   uniforms: twoColors([
49:     { name: 'frequency', label: 'Frequency', type: 'float', default: 12.0, ui: { min: 1, max: 60, step: 0.5 } },
50:     { name: 'duty', label: 'Duty', type: 'float', default: 0.5, ui: { min: 0.05, max: 0.95, step: 0.01 } },

(Showing lines 1-50 of 464. Use offset=51 to continue.)
</content>
```

---

## Assistant (Build · Claude Sonnet 4.6 · 22.3s)

Good. Now I have all the context I need. Let me implement everything in parallel — new primitives across all layer files, then the LAYER_LIBRARY registration, then the preset rewrite.

**Tool: todowrite**

**Input:**

```json
{
  "todos": [
    {
      "content": "Add export support for sampler2D and vec4Array in generator.ts",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Upgrade color-ramp with stepped/soft/wrap controls",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Add scalar-field primitive",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Add mesh-spots-gradient primitive",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Add organic-warp distorter primitive",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Add polar-bands and spiral-stripe primitives",
      "status": "in_progress",
      "priority": "medium"
    },
    {
      "content": "Add image analysis layers (image-edge, image-contour, chrome-relief)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Add glow-field, material-noise, dot-glyph-grid, voronoi-cells primitives",
      "status": "in_progress",
      "priority": "medium"
    },
    {
      "content": "Register all new primitives in LAYER_LIBRARY",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Rewrite paper-presets.ts as primitive-based recipes",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Validate: npm run build + browser check",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**

```
[
  {
    "content": "Add export support for sampler2D and vec4Array in generator.ts",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Upgrade color-ramp with stepped/soft/wrap controls",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Add scalar-field primitive",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Add mesh-spots-gradient primitive",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Add organic-warp distorter primitive",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Add polar-bands and spiral-stripe primitives",
    "status": "in_progress",
    "priority": "medium"
  },
  {
    "content": "Add image analysis layers (image-edge, image-contour, chrome-relief)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Add glow-field, material-noise, dot-glyph-grid, voronoi-cells primitives",
    "status": "in_progress",
    "priority": "medium"
  },
  {
    "content": "Register all new primitives in LAYER_LIBRARY",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Rewrite paper-presets.ts as primitive-based recipes",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Validate: npm run build + browser check",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Build · Claude Sonnet 4.6 · 18.6s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/gradients.ts",
  "oldString": "export const GRADIENT_LAYERS: Record<string, LayerDefinition> = {\n  'linear-gradient-v2': linearGradientV2Layer,\n  'radial-gradient-v2': radialGradientV2Layer,\n  'conic-gradient': conicGradientLayer,\n  'diamond-gradient': diamondGradientLayer,\n  'multi-point-gradient': multiPointGradientLayer,\n}",
  "newString": "// Mesh Spots Gradient — N animated color blobs blended via IDW (inverse\n// distance weighting), same algorithm Paper uses for mesh-gradient. Uses a\n// vec4Array palette so spot count is variable and designer-editable.\n// Set speed=0 for a static mesh.\nexport const meshSpotsGradientLayer: LayerDefinition = {\n  id: 'mesh-spots-gradient',\n  name: 'Mesh Spots Gradient',\n  description: 'Soft animated color blobs blended into a smooth mesh — use with Organic Warp',\n  color: '#fb7185',\n  category: 'generator',\n  defaultBlendMode: 'normal',\n  uniforms: [\n    {\n      name: 'colors',\n      label: 'Colors',\n      type: 'vec4Array',\n      arrayLength: 8,\n      default: {\n        values: [\n          [0.88, 0.91, 1.0, 1],\n          [0.14, 0.11, 0.6, 1],\n          [0.97, 0.31, 0.57, 1],\n          [0.62, 0.31, 0.83, 1],\n        ],\n        length: 4,\n      },\n      ui: { array: { minLength: 2, maxLength: 8 } },\n    },\n    { name: 'falloff', label: 'Falloff', type: 'float', default: 3.5, ui: { min: 0.5, max: 8, step: 0.05 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'amplitude', label: 'Motion', type: 'float', default: 0.4, ui: { min: 0, max: 0.6, step: 0.01 } },\n    { name: 'seed', label: 'Seed', type: 'float', default: 0.0, ui: { min: 0, max: 100, step: 0.1 } },\n  ],\n  glsl: {\n    dependencies: ['hash21'],\n    functions: `\nvec2 msgSpotPos(int i, float t, float amp, float seed) {\n  float fi = float(i) + seed;\n  float a = fi * 0.37;\n  float bx = 0.6 + fract(fi / 3.0) * 0.9;\n  float by = 0.8 + fract((fi + 1.0) / 4.0);\n  float x = sin(t * bx + a);\n  float y = cos(t * by + a * 1.5);\n  return 0.5 + amp * vec2(x, y);\n}`,\n    main: `\nvec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);\nvec2 p = (uv - 0.5) * _ar + 0.5;\nfloat t = 0.5 * u_time * {{speed}};\nint n = max({{colors}}_count, 1);\nvec3 color = vec3(0.0);\nfloat totalWeight = 0.0;\nfor (int i = 0; i < 8; i++) {\n  if (i >= n) break;\n  vec2 pos = msgSpotPos(i, t, {{amplitude}}, {{seed}});\n  float dist = pow(length(p - pos), {{falloff}});\n  float w = 1.0 / (dist + 1e-3);\n  color += {{colors}}[i].rgb * w;\n  totalWeight += w;\n}\ncolor /= max(totalWeight, 1e-4);\nreturn vec4(color, 1.0);`,\n  },\n}\n\nexport const GRADIENT_LAYERS: Record<string, LayerDefinition> = {\n  'linear-gradient-v2': linearGradientV2Layer,\n  'radial-gradient-v2': radialGradientV2Layer,\n  'conic-gradient': conicGradientLayer,\n  'diamond-gradient': diamondGradientLayer,\n  'multi-point-gradient': multiPointGradientLayer,\n  'mesh-spots-gradient': meshSpotsGradientLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 13.7s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/distorters.ts",
  "oldString": "export const DISTORTER_LAYERS: Record<string, LayerDefinition> = {",
  "newString": "// Organic Warp — broad liquid UV distortion driven by layered domain warping.\n// Stack over mesh-spots-gradient or any generator for animated mesh-gradient-\n// style motion. distortion controls warp amplitude, swirl adds rotational\n// flow, centerFalloff concentrates distortion at edges.\nexport const organicWarpLayer = distorter({\n  id: 'organic-warp',\n  name: 'Organic Warp',\n  description: 'Broad liquid UV distortion — stack over a gradient or noise source',\n  color: '#34d399',\n  uniforms: [\n    { name: 'distortion', label: 'Distortion', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'swirl', label: 'Swirl', type: 'float', default: 0.2, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'scale', label: 'Scale', type: 'float', default: 1.0, ui: { min: 0.1, max: 4, step: 0.05 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'centerFalloff', label: 'Center Falloff', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'iterations', label: 'Iterations', type: 'int', default: 2, ui: { min: 1, max: 4, step: 1 } },\n  ],\n  glsl: {\n    dependencies: ['rotate2D'],\n    functions: `\nvec2 owNoise(vec2 p, float t) {\n  float sx = sin(t + p.x * 1.4 * p.y + t);\n  float sy = cos(t + p.y * 1.4 * p.x);\n  return vec2(sx, sy);\n}`,\n    main: `\nvec2 q = uv;\nfloat t = u_time * {{speed}};\nfloat radius = length((uv - 0.5) * 2.0);\nfloat centerMask = mix(1.0, max(0.0, radius), {{centerFalloff}});\nvec2 warpUv = (uv - 0.5) * {{scale}};\nfor (int i = 0; i < 4; i++) {\n  if (i >= {{iterations}}) break;\n  float fi = float(i + 1);\n  vec2 offset = owNoise(warpUv, t);\n  q += {{distortion}} * centerMask / fi\n    * vec2(offset.x * sin(t + fi * 0.4 * q.y), offset.y * cos(t + fi * 2.0 * q.x))\n    * 0.15;\n}\n// Swirl: radius-weighted rotation of the warp result.\nvec2 swUv = q - 0.5;\nfloat angle = 3.0 * {{swirl}} * length(swUv * 2.0);\nswUv = rotate2D(swUv, -angle);\nq = swUv + 0.5;\nreturn texture(u_prevPass, q);`,\n  },\n})\n\nexport const DISTORTER_LAYERS: Record<string, LayerDefinition> = {"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.7s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/distorters.ts",
  "oldString": "  'water-ripple': waterRippleLayer,\n}",
  "newString": "  'water-ripple': waterRippleLayer,\n  'organic-warp': organicWarpLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 51.7s)

Now add `polar-bands`, `spiral-stripe`, and `voronoi-cells` to noise.ts:

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/noise.ts",
  "oldString": "export const NOISE_LAYERS: Record<string, LayerDefinition> = {\n  'scalar-field': scalarFieldLayer,\n  plasma: plasmaLayer,\n  'perlin-noise': perlinNoiseLayer,\n  'flow-field': flowFieldLayer,\n  aurora: auroraLayer,\n  'spiral-pattern': spiralLayer,\n  'contour-lines': contourLinesLayer,\n}",
  "newString": "// Polar Bands — twisted radial bands; the core primitive behind Paper's Swirl.\n// Colors come from a downstream color-ramp (outputKind: scalar) or use\n// colorBack/colorFront for a simple two-color result.\nexport const polarBandsLayer: LayerDefinition = {\n  id: 'polar-bands',\n  name: 'Polar Bands',\n  description: 'Twisted radial bands — pair with Color Ramp for Paper-style Swirl',\n  color: '#a78bfa',\n  category: 'generator',\n  defaultBlendMode: 'normal',\n  uniforms: [\n    { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.02, 0.02, 0.05], ui: { color: true } },\n    { name: 'color1', label: 'Color 1', type: 'vec3', default: [1.0, 0.9, 0.4], ui: { color: true } },\n    { name: 'color2', label: 'Color 2', type: 'vec3', default: [0.95, 0.3, 0.5], ui: { color: true } },\n    { name: 'color3', label: 'Color 3', type: 'vec3', default: [0.3, 0.5, 1.0], ui: { color: true } },\n    { name: 'bandCount', label: 'Bands', type: 'float', default: 4, ui: { min: 0, max: 15, step: 1 } },\n    { name: 'twist', label: 'Twist', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'centerSize', label: 'Center', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'proportion', label: 'Proportion', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'softness', label: 'Softness', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'noiseAmount', label: 'Noise', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },\n  ],\n  glsl: {\n    dependencies: ['snoise'],\n    functions: `\n#ifndef TWO_PI\n#define TWO_PI 6.28318530718\n#endif`,\n    main: `\n${screenP}\nfloat l = max(1e-4, length(p));\nfloat t = u_time * {{speed}};\nfloat angle = ceil({{bandCount}}) * atan(p.y, p.x) + t;\nfloat twist = 3.0 * clamp({{twist}}, 0.0, 1.0);\nfloat offset = pow(l, -twist) + angle / TWO_PI;\nfloat shape = fract(offset);\nshape = 1.0 - abs(2.0 * shape - 1.0);\nshape += {{noiseAmount}} * snoise(15.0 * p);\nfloat mid = smoothstep(0.2, 0.2 + 0.8 * {{centerSize}}, pow(l, twist));\nshape = mix(0.0, shape, mid);\nfloat proportion = clamp({{proportion}}, 0.0, 1.0);\nfloat exponent = mix(0.25, 1.0, proportion * 2.0);\nexponent = mix(exponent, 10.0, max(0.0, proportion * 2.0 - 1.0));\nshape = pow(shape, exponent);\nfloat mixer = shape * 3.0;\nvec3 cols[3];\ncols[0] = {{color1}}; cols[1] = {{color2}}; cols[2] = {{color3}};\nvec3 gradient = cols[0];\nfloat outerShape = 0.0;\nfor (int i = 1; i < 4; i++) {\n  if (i > 3) break;\n  float m = clamp(mixer - float(i - 1), 0.0, 1.0);\n  float aa = fwidth(m);\n  m = smoothstep(0.5 - 0.5 * {{softness}} - aa, 0.5 + 0.5 * {{softness}} + aa, m);\n  if (i == 1) outerShape = m;\n  gradient = mix(gradient, cols[min(i, 2)], m);\n}\nfloat outerMid = smoothstep(0.2, 0.2 + 0.1 * fwidth(pow(l, -twist)), pow(l, twist));\nouterShape = mix(0.0, outerShape, outerMid);\nvec3 color = gradient * outerShape + {{colorBack}} * (1.0 - outerShape);\nreturn vec4(color, 1.0);`,\n  },\n}\n\n// Spiral Stripe — logarithmic spiral stripe mask, Paper-Spiral algorithm.\n// colorBack/colorFront for two-color output; or feed into a color-ramp.\nexport const spiralStripeLayer: LayerDefinition = {\n  id: 'spiral-stripe',\n  name: 'Spiral Stripe',\n  description: 'Animated logarithmic spiral stripe mask',\n  color: '#a855f7',\n  category: 'generator',\n  defaultBlendMode: 'normal',\n  uniforms: [\n    { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.05, 0.05, 0.08], ui: { color: true } },\n    { name: 'colorFront', label: 'Stripe', type: 'vec3', default: [0.95, 0.85, 0.4], ui: { color: true } },\n    { name: 'density', label: 'Density', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'strokeWidth', label: 'Width', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'strokeTaper', label: 'Taper', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'strokeCap', label: 'Cap', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'distortion', label: 'Distortion', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'noiseAmount', label: 'Noise', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'noiseFreq', label: 'Noise Freq', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'softness', label: 'Softness', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.5, ui: { min: 0, max: 4, step: 0.05 } },\n  ],\n  glsl: {\n    dependencies: ['snoise'],\n    functions: `\n#ifndef TWO_PI\n#define TWO_PI 6.28318530718\n#endif\n#ifndef PI\n#define PI 3.14159265358979323846\n#endif`,\n    main: `\n${screenP}\nvec2 spUv = 2.0 * p;\nfloat t = u_time * {{speed}};\nfloat l = length(spUv);\nfloat density = clamp({{density}}, 0.0, 1.0);\nl = pow(max(l, 1e-6), density);\nfloat angle = atan(spUv.y, spUv.x) - t;\nfloat angleNorm = angle / TWO_PI;\nangleNorm += 0.125 * {{noiseAmount}} * snoise(16.0 * pow({{noiseFreq}}, 3.0) * spUv);\nfloat offset = l + angleNorm;\noffset -= {{distortion}} * (sin(4.0 * l - 0.5 * t) * cos(PI + l + 0.5 * t));\nfloat stripe = fract(offset);\nfloat shape = 2.0 * abs(stripe - 0.5);\nfloat width = 1.0 - clamp({{strokeWidth}}, 0.005 * {{strokeTaper}}, 1.0);\nfloat wCap = mix(width, (1.0 - stripe) * (1.0 - step(0.5, stripe)), (1.0 - clamp(l, 0.0, 1.0)));\nwidth = mix(width, wCap, {{strokeCap}});\nwidth *= (1.0 - clamp({{strokeTaper}}, 0.0, 1.0) * l);\nfloat fw = fwidth(offset);\nfloat fwMult = 4.0 - 3.0 * (smoothstep(0.05, 0.4, 2.0 * {{strokeWidth}}) * smoothstep(0.05, 0.4, 2.0 * (1.0 - {{strokeWidth}})));\nfloat pixelSize = mix(fwMult * fw, fwidth(shape), clamp(fw, 0.0, 1.0));\npixelSize = mix(pixelSize, 0.002, {{strokeCap}} * (1.0 - clamp(l, 0.0, 1.0)));\nfloat res = smoothstep(width - pixelSize - {{softness}}, width + pixelSize + {{softness}}, shape);\nvec3 color = mix({{colorBack}}, {{colorFront}}, res);\nreturn vec4(color, 1.0);`,\n  },\n}\n\n// Voronoi Cells — IQ two-pass voronoi with per-cell color from a vec4Array\n// palette and adjustable gap/glow. Replaces the simple approx voronoi.\nexport const voronoiCellsLayer: LayerDefinition = {\n  id: 'voronoi-cells',\n  name: 'Voronoi Cells',\n  description: 'Animated cell mosaic with palette colors, gap, and glow',\n  color: '#06b6d4',\n  category: 'generator',\n  defaultBlendMode: 'normal',\n  uniforms: [\n    {\n      name: 'colors',\n      label: 'Colors',\n      type: 'vec4Array',\n      arrayLength: 6,\n      default: {\n        values: [\n          [0.4, 0.7, 1.0, 1],\n          [0.95, 0.5, 0.7, 1],\n          [0.3, 0.95, 0.7, 1],\n        ],\n        length: 3,\n      },\n      ui: { array: { minLength: 1, maxLength: 6 } },\n    },\n    { name: 'colorGap', label: 'Gap Color', type: 'vec3', default: [0.05, 0.05, 0.08], ui: { color: true } },\n    { name: 'colorGlow', label: 'Glow Color', type: 'vec3', default: [0.0, 0.0, 0.0], ui: { color: true } },\n    { name: 'scale', label: 'Scale', type: 'float', default: 5, ui: { min: 0.5, max: 20, step: 0.1 } },\n    { name: 'distortion', label: 'Distortion', type: 'float', default: 0.25, ui: { min: 0, max: 0.5, step: 0.005 } },\n    { name: 'gap', label: 'Gap', type: 'float', default: 0.01, ui: { min: 0, max: 0.1, step: 0.001 } },\n    { name: 'glow', label: 'Glow', type: 'float', default: 0.2, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'stepsPerColor', label: 'Steps/Color', type: 'int', default: 1, ui: { min: 1, max: 6, step: 1 } },\n    { name: 'speed', label: 'Speed', type: 'float', default: 0.4, ui: { min: 0, max: 4, step: 0.05 } },\n  ],\n  glsl: {\n    dependencies: ['hash22'],\n    functions: `\n#ifndef TWO_PI\n#define TWO_PI 6.28318530718\n#endif\nvec4 vcVoronoi(vec2 x, float t, float dist) {\n  vec2 ip = floor(x), fp = fract(x), mg, mr;\n  float md = 8.0, rand = 0.0;\n  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {\n    vec2 g = vec2(float(i), float(j));\n    vec2 oRaw = hash22(ip + g);\n    vec2 o = 0.5 + dist * sin(t + TWO_PI * oRaw);\n    vec2 r = g + o - fp;\n    float d = dot(r, r);\n    if (d < md) { md = d; mr = r; mg = g; rand = oRaw.x; }\n  }\n  md = 8.0;\n  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {\n    vec2 g = mg + vec2(float(i), float(j));\n    vec2 oRaw = hash22(ip + g);\n    vec2 o = 0.5 + dist * sin(t + TWO_PI * oRaw);\n    vec2 r = g + o - fp;\n    if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));\n  }\n  return vec4(md, mr, rand);\n}`,\n    main: `\n${screenP}\nvec2 q = p * {{scale}};\nfloat t = u_time * {{speed}};\nvec4 v = vcVoronoi(q, t, {{distortion}});\nint n = max({{colors}}_count, 1);\nint spc = max({{stepsPerColor}}, 1);\nfloat cellId = clamp(v.w, 0.0, 1.0);\nfloat mixer = cellId * float(n);\nint i0 = int(floor(mixer));\nint i1 = (i0 + 1) % n;\nfloat f = fract(mixer);\nf = floor(f * float(spc)) / max(float(spc) - 1.0, 1.0);\nvec3 cellColor = mix({{colors}}[i0 % 6].rgb, {{colors}}[i1 % 6].rgb, clamp(f, 0.0, 1.0));\nfloat glowAmt = pow(length(v.yz * {{glow}}), 1.5);\nvec3 color = mix(cellColor, {{colorGlow}}, glowAmt);\nfloat edge = v.x;\nfloat smoothEdge = 0.02 * (1.0 + 0.5 * {{gap}});\nedge = smoothstep({{gap}} - smoothEdge, {{gap}} + smoothEdge, edge);\ncolor = mix({{colorGap}}, color, edge);\nreturn vec4(color, 1.0);`,\n  },\n}\n\nexport const NOISE_LAYERS: Record<string, LayerDefinition> = {\n  'scalar-field': scalarFieldLayer,\n  'polar-bands': polarBandsLayer,\n  'spiral-stripe': spiralStripeLayer,\n  'voronoi-cells': voronoiCellsLayer,\n  plasma: plasmaLayer,\n  'perlin-noise': perlinNoiseLayer,\n  'flow-field': flowFieldLayer,\n  aurora: auroraLayer,\n  'spiral-pattern': spiralLayer,\n  'contour-lines': contourLinesLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 33.7s)

Now add `image-edge`, `image-contour`, `chrome-relief`, and `glow-field` to color.ts:

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts",
  "oldString": "export const COLOR_LAYERS: Record<string, LayerDefinition> = {",
  "newString": "// Image Edge — Sobel-based edge detector. Stack over image-source to extract\n// outlines for heatmap, liquid-metal, gem-smoke style effects.\nexport const imageEdgeLayer = sampleFx({\n  id: 'image-edge',\n  name: 'Image Edge',\n  description: 'Sobel edge detection — use after an image or gradient source',\n  color: '#f59e0b',\n  uniforms: [\n    { name: 'thickness', label: 'Thickness', type: 'float', default: 1.0, ui: { min: 0.1, max: 8, step: 0.1 } },\n    { name: 'intensity', label: 'Intensity', type: 'float', default: 1.0, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'smooth', label: 'Smooth', type: 'float', default: 0.1, ui: { min: 0, max: 0.5, step: 0.01 } },\n  ],\n  glsl: {\n    dependencies: ['luma'],\n    main: `\nvec2 texel = 1.0 / u_resolution * {{thickness}};\nfloat tl = luma(texture(u_prevPass, uv + vec2(-texel.x, -texel.y)).rgb);\nfloat tc = luma(texture(u_prevPass, uv + vec2(0.0,     -texel.y)).rgb);\nfloat tr = luma(texture(u_prevPass, uv + vec2( texel.x, -texel.y)).rgb);\nfloat ml = luma(texture(u_prevPass, uv + vec2(-texel.x,  0.0    )).rgb);\nfloat mr = luma(texture(u_prevPass, uv + vec2( texel.x,  0.0    )).rgb);\nfloat bl = luma(texture(u_prevPass, uv + vec2(-texel.x,  texel.y)).rgb);\nfloat bc = luma(texture(u_prevPass, uv + vec2(0.0,      texel.y)).rgb);\nfloat br = luma(texture(u_prevPass, uv + vec2( texel.x,  texel.y)).rgb);\nfloat gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;\nfloat gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;\nfloat edge = clamp(length(vec2(gx, gy)) * {{intensity}}, 0.0, 1.0);\nedge = smoothstep({{smooth}}, {{smooth}} + 0.1, edge);\nreturn vec4(edge, edge, edge, 1.0);`,\n  },\n  outputKind: 'scalar',\n})\n\n// Image Contour — luminance-band isolines. Useful before color-ramp for\n// Paper-style topographic heatmap or liquid-metal looks.\nexport const imageContourLayer = sampleFx({\n  id: 'image-contour',\n  name: 'Image Contour',\n  description: 'Luminance contour bands — pair with Color Ramp for heatmap/liquid looks',\n  color: '#f59e0b',\n  uniforms: [\n    { name: 'bands', label: 'Bands', type: 'float', default: 8.0, ui: { min: 1, max: 32, step: 1 } },\n    { name: 'thickness', label: 'Thickness', type: 'float', default: 0.3, ui: { min: 0.01, max: 1, step: 0.01 } },\n    { name: 'blur', label: 'Blur', type: 'float', default: 0.5, ui: { min: 0, max: 2, step: 0.01 } },\n  ],\n  glsl: {\n    dependencies: ['luma'],\n    main: `\nvec4 src = texture(u_prevPass, uv);\nfloat lum = luma(src.rgb);\nfloat band = fract(lum * {{bands}});\nfloat fw = fwidth(band) * (1.0 + {{blur}} * 8.0);\nfloat line = 1.0 - smoothstep({{thickness}} - fw, {{thickness}} + fw, abs(band - 0.5) * 2.0);\nreturn vec4(line, line, line, 1.0);`,\n  },\n  outputKind: 'scalar',\n})\n\n// Chrome Relief — pseudo-metallic highlight derived from the luminance gradient.\n// Stack after an image or contour source for a liquid-metal / chrome look.\nexport const chromeReliefLayer = sampleFx({\n  id: 'chrome-relief',\n  name: 'Chrome Relief',\n  description: 'Metallic highlight from luma gradient — use before a chrome Color Ramp',\n  color: '#94a3b8',\n  uniforms: [\n    { name: 'lightAngle', label: 'Light Angle', type: 'float', default: 135.0, ui: { min: 0, max: 360, step: 1 } },\n    { name: 'intensity', label: 'Intensity', type: 'float', default: 1.5, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'ambient', label: 'Ambient', type: 'float', default: 0.4, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'specular', label: 'Specular', type: 'float', default: 0.6, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'thickness', label: 'Detail', type: 'float', default: 1.5, ui: { min: 0.1, max: 8, step: 0.1 } },\n  ],\n  glsl: {\n    dependencies: ['luma'],\n    main: `\nvec2 texel = 1.0 / u_resolution * {{thickness}};\nfloat a = {{lightAngle}} * 3.14159 / 180.0;\nvec2 ldir = vec2(cos(a), sin(a));\nfloat lc = luma(texture(u_prevPass, uv).rgb);\nfloat lx = luma(texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb)\n         - luma(texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb);\nfloat ly = luma(texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb)\n         - luma(texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb);\nvec2 grad = vec2(lx, ly);\nfloat diffuse = dot(normalize(grad + vec2(1e-5)), ldir) * 0.5 + 0.5;\nfloat spec = pow(clamp(diffuse, 0.0, 1.0), 8.0) * {{specular}};\nfloat v = clamp({{ambient}} + diffuse * {{intensity}} + spec, 0.0, 1.0);\nreturn vec4(v, v, v, 1.0);`,\n  },\n  outputKind: 'scalar',\n})\n\n// Glow Field — additive bloom/glow effect with inner+outer radius controls.\n// Use after any source for bloom, or stack under a color-ramp for tinted glow.\nexport const glowFieldLayer = sampleFx({\n  id: 'glow-field',\n  name: 'Glow Field',\n  description: 'Additive bloom glow — use after god-rays, neuro-noise, or any bright source',\n  color: '#fbbf24',\n  uniforms: [\n    { name: 'color', label: 'Glow Color', type: 'vec3', default: [1.0, 0.9, 0.6], ui: { color: true } },\n    { name: 'radius', label: 'Radius', type: 'float', default: 8.0, ui: { min: 0.5, max: 40, step: 0.5 } },\n    { name: 'intensity', label: 'Intensity', type: 'float', default: 1.2, ui: { min: 0, max: 4, step: 0.05 } },\n    { name: 'threshold', label: 'Threshold', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'composite', label: 'Composite', type: 'float', default: 1.0, ui: { min: 0, max: 1, step: 0.01 } },\n  ],\n  glsl: {\n    dependencies: ['luma'],\n    main: `\nvec2 texel = 1.0 / u_resolution;\nvec2 r = texel * {{radius}};\nvec3 glow = vec3(0.0);\nconst int N = 4;\nfloat total = 0.0;\nfor (int i = -N; i <= N; i++) {\n  for (int j = -N; j <= N; j++) {\n    vec3 c = texture(u_prevPass, uv + r * vec2(float(i), float(j))).rgb;\n    float w = exp(-0.5 * float(i * i + j * j) / float(N * N));\n    float bright = max(luma(c) - {{threshold}}, 0.0);\n    glow += c * bright * w;\n    total += w;\n  }\n}\nglow = glow / max(total, 1e-4) * {{intensity}};\nvec4 src = texture(u_prevPass, uv);\nvec3 col = src.rgb + {{color}} * glow;\ncol = mix(src.rgb, col, {{composite}});\nreturn vec4(col, src.a);`,\n  },\n})\n\nexport const COLOR_LAYERS: Record<string, LayerDefinition> = {"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.2s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts",
  "oldString": "  'color-ramp': colorRampLayer,\n  'luminance-tap': luminanceTapLayer,\n  'cmyk-separate': cmykSeparateLayer,\n}",
  "newString": "  'color-ramp': colorRampLayer,\n  'luminance-tap': luminanceTapLayer,\n  'cmyk-separate': cmykSeparateLayer,\n  'image-edge': imageEdgeLayer,\n  'image-contour': imageContourLayer,\n  'chrome-relief': chromeReliefLayer,\n  'glow-field': glowFieldLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 29.3s)

Now add `material-noise` and `dot-glyph-grid` to stylize.ts:

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/stylize.ts",
  "oldString": "export const STYLIZE_LAYERS: Record<string, LayerDefinition> = {",
  "newString": "// Material Noise — layered paper/fiber/crumple/grain texture generator.\n// Use as a source with overlay/multiply blend on top of an image or gradient.\n// Faithfully models Paper's paper-texture primitive breakdown.\nexport const materialNoiseLayer = baseFx({\n  id: 'material-noise',\n  name: 'Material Noise',\n  description: 'Layered fiber, crumple, fold, and grain texture — use with Multiply/Overlay blend',\n  color: '#fef3c7',\n  uniforms: [\n    { name: 'colorFront', label: 'Dark Fiber', type: 'vec3', default: [0.62, 0.68, 0.74], ui: { color: true } },\n    { name: 'colorBack', label: 'Base', type: 'vec3', default: [1.0, 1.0, 1.0], ui: { color: true } },\n    { name: 'fiber', label: 'Fiber', type: 'float', default: 0.3, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'fiberScale', label: 'Fiber Scale', type: 'float', default: 60.0, ui: { min: 4, max: 300, step: 1 } },\n    { name: 'fiberAngle', label: 'Fiber Angle', type: 'float', default: 0.0, ui: { min: 0, max: 360, step: 1 } },\n    { name: 'crumples', label: 'Crumples', type: 'float', default: 0.2, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'crumpleScale', label: 'Crumple Scale', type: 'float', default: 40.0, ui: { min: 2, max: 200, step: 1 } },\n    { name: 'grain', label: 'Grain', type: 'float', default: 0.08, ui: { min: 0, max: 0.5, step: 0.005 } },\n    { name: 'contrast', label: 'Contrast', type: 'float', default: 0.5, ui: { min: 0, max: 1, step: 0.01 } },\n  ],\n  glsl: {\n    dependencies: ['simplex2D', 'rotate2D', 'hash'],\n    main: `\n// Fiber layer — directional high-frequency noise\nvec2 fq = rotate2D(uv * {{fiberScale}}, {{fiberAngle}} * 3.14159 / 180.0);\nfloat fiberN = simplex2D(fq) * 0.5 + simplex2D(fq * 3.1) * 0.25 + simplex2D(fq * 7.3) * 0.125;\nfiberN = fiberN * 0.5 + 0.5;\n// Crumple layer — low-frequency large folds\nvec2 cq = uv * {{crumpleScale}};\nfloat crumpleN = abs(simplex2D(cq) * 0.6 + simplex2D(cq * 2.3) * 0.3 + simplex2D(cq * 5.1) * 0.1);\ncrumpleN = 1.0 - crumpleN;\n// Grain layer\nfloat grainN = hash(uv * u_resolution + fract(u_time)) * 2.0 - 1.0;\n// Composite\nfloat v = mix(0.5, fiberN, {{fiber}});\nv = mix(v, v * crumpleN, {{crumples}});\nv = clamp(v + grainN * {{grain}}, 0.0, 1.0);\n// Contrast\nv = (v - 0.5) * (1.0 + {{contrast}}) + 0.5;\nv = clamp(v, 0.0, 1.0);\nvec3 col = mix({{colorFront}}, {{colorBack}}, v);\nreturn vec4(col, 1.0);`,\n  },\n})\n\n// Dot Glyph Grid — faithful Paper dot-grid recreation: regular lattice of\n// geometric dots with per-dot random size/opacity, multiple shapes.\nexport const dotGlyphGridLayer = baseFx({\n  id: 'dot-glyph-grid',\n  name: 'Dot Glyph Grid',\n  description: 'Regular grid of geometric dots — circle, square, diamond, or cross',\n  color: '#475569',\n  uniforms: [\n    { name: 'colorBack', label: 'Background', type: 'vec3', default: [0.05, 0.05, 0.08], ui: { color: true } },\n    { name: 'colorFill', label: 'Fill', type: 'vec3', default: [0.95, 0.9, 0.7], ui: { color: true } },\n    { name: 'colorStroke', label: 'Stroke', type: 'vec3', default: [1.0, 0.7, 0.3], ui: { color: true } },\n    { name: 'gapX', label: 'Gap X', type: 'float', default: 30.0, ui: { min: 4, max: 200, step: 1 } },\n    { name: 'gapY', label: 'Gap Y', type: 'float', default: 30.0, ui: { min: 4, max: 200, step: 1 } },\n    { name: 'dotSize', label: 'Dot Size', type: 'float', default: 0.3, ui: { min: 0.05, max: 0.95, step: 0.01 } },\n    { name: 'strokeWidth', label: 'Stroke', type: 'float', default: 0.0, ui: { min: 0, max: 0.2, step: 0.005 } },\n    { name: 'sizeRange', label: 'Size Rand', type: 'float', default: 0.0, ui: { min: 0, max: 0.5, step: 0.01 } },\n    { name: 'opacityRange', label: 'Opacity Rand', type: 'float', default: 0.0, ui: { min: 0, max: 1, step: 0.01 } },\n    { name: 'shape', label: 'Shape (0=circle 1=sq 2=diamond 3=cross)', type: 'int', default: 0, ui: { min: 0, max: 3, step: 1 } },\n  ],\n  glsl: {\n    dependencies: ['hash21'],\n    main: `\nvec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);\n// Grid coords in pixel space\nvec2 px = uv * u_resolution;\nvec2 cellSize = vec2({{gapX}}, {{gapY}});\nvec2 cellId = floor(px / cellSize);\nvec2 cellUv = (px - cellId * cellSize) / cellSize - 0.5;\n// Per-cell random\nfloat rnd = hash21(cellId);\nfloat sz = {{dotSize}} + (rnd - 0.5) * {{sizeRange}};\nsz = clamp(sz, 0.01, 0.99);\nfloat opRand = 1.0 - rnd * {{opacityRange}};\n// Aspect-correct the cell UV\ncellUv.x *= cellSize.x / cellSize.y;\n// SDF by shape\nfloat d;\nint sh = {{shape}};\nif (sh == 1) {\n  // square\n  vec2 q = abs(cellUv);\n  d = max(q.x, q.y) - sz * 0.5;\n} else if (sh == 2) {\n  // diamond\n  d = (abs(cellUv.x) + abs(cellUv.y)) - sz * 0.5;\n} else if (sh == 3) {\n  // cross\n  float arm = sz * 0.15;\n  float len = sz * 0.5;\n  float h = max(abs(cellUv.x) - len, abs(cellUv.y) - arm);\n  float v2 = max(abs(cellUv.y) - len, abs(cellUv.x) - arm);\n  d = min(h, v2);\n} else {\n  // circle (default)\n  d = length(cellUv) - sz * 0.5;\n}\nfloat aa = fwidth(d);\nfloat fill = 1.0 - smoothstep(-aa, aa, d);\nfloat stroke = smoothstep(-({{strokeWidth}} + aa), -({{strokeWidth}} - aa), d) * fill;\nvec3 col = {{colorBack}};\ncol = mix(col, {{colorFill}}, fill * opRand);\ncol = mix(col, {{colorStroke}}, stroke * opRand);\nreturn vec4(col, 1.0);`,\n  },\n})\n\nexport const STYLIZE_LAYERS: Record<string, LayerDefinition> = {"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.1s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/stylize.ts",
  "oldString": "  'vignette-2': vignette2Layer,\n  paper: paperLayer,\n}",
  "newString": "  'vignette-2': vignette2Layer,\n  paper: paperLayer,\n  'material-noise': materialNoiseLayer,\n  'dot-glyph-grid': dotGlyphGridLayer,\n}"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 8.5s)

Now register everything in the LAYER_LIBRARY:

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/index.ts",
  "oldString": "import type { LayerDefinition } from '../types'\nimport { SHAPE_LAYERS } from './shapes'\nimport { PATTERN_LAYERS } from './patterns'\nimport { GRADIENT_LAYERS } from './gradients'\nimport { NOISE_LAYERS } from './noise'\nimport { ATMOSPHERIC_LAYERS } from './atmospherics'\nimport { SOURCE_LAYERS } from './sources'\nimport { DISTORTER_LAYERS } from './distorters'\nimport { BLUR_LAYERS } from './blurs'\nimport { LIGHTING_LAYERS } from './lighting'\nimport { COLOR_LAYERS } from './color'\nimport { STYLIZE_LAYERS } from './stylize'\nimport { SPECIALIZED_LAYERS } from './specialized'\nimport { PAPER_SHADER_LAYERS } from './paper-shaders'",
  "newString": "import type { LayerDefinition } from '../types'\nimport { SHAPE_LAYERS } from './shapes'\nimport { PATTERN_LAYERS } from './patterns'\nimport { GRADIENT_LAYERS } from './gradients'\nimport { NOISE_LAYERS } from './noise'\nimport { ATMOSPHERIC_LAYERS } from './atmospherics'\nimport { SOURCE_LAYERS } from './sources'\nimport { DISTORTER_LAYERS } from './distorters'\nimport { BLUR_LAYERS } from './blurs'\nimport { LIGHTING_LAYERS } from './lighting'\nimport { COLOR_LAYERS } from './color'\nimport { STYLIZE_LAYERS } from './stylize'\nimport { SPECIALIZED_LAYERS } from './specialized'\nimport { PAPER_SHADER_LAYERS } from './paper-shaders'\n\n// Re-export new primitives for direct use in presets\nexport { scalarFieldLayer, polarBandsLayer, spiralStripeLayer, voronoiCellsLayer } from './noise'\nexport { meshSpotsGradientLayer } from './gradients'\nexport { organicWarpLayer } from './distorters'\nexport { imageEdgeLayer, imageContourLayer, chromeReliefLayer, glowFieldLayer } from './color'\nexport { materialNoiseLayer, dotGlyphGridLayer } from './stylize'"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 109.7s)

Now rewrite `paper-presets.ts` with proper primitive-based recipe stacks:

**Tool: write**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/paper-presets.ts",
  "content": "// Paper preset gallery — compositions of reusable primitives.\n//\n// Philosophy: every preset should read like a recipe a designer can understand\n// from the layer names alone. Avoid monolithic Paper ports where possible;\n// use the primitive-first approach so users can remix each stack.\n//\n// Fidelity labels:\n//   primitive   — built from composable primitives; canonical version\n//   approx      — close visual family; missing one primitive capability\n//   reference   — kept as a monolithic Paper port for comparison only\n\nimport type { BlendMode, UniformValue, Vec4ArrayValue } from './types'\n\nexport type PaperFidelity = 'primitive' | 'approx' | 'reference'\n\nexport interface PaperLayerSpec {\n  layerType: string\n  uniformValues: Record<string, UniformValue>\n  blendMode?: BlendMode\n  opacity?: number\n}\n\nexport interface PaperPreset {\n  name: string\n  fidelity: PaperFidelity\n  layers: PaperLayerSpec[]\n}\n\nexport interface PaperGroup {\n  slug: string\n  name: string\n  description: string\n  presets: PaperPreset[]\n}\n\n// Helpers -----------------------------------------------------------------\n\nconst palette = (...colors: number[][]): Vec4ArrayValue => ({\n  values: colors.map((c) => (c.length === 4 ? c : [c[0], c[1], c[2], 1])),\n  length: colors.length,\n})\n\nconst hex = (s: string): number[] => {\n  const v = s.replace('#', '')\n  const r = parseInt(v.substring(0, 2), 16) / 255\n  const g = parseInt(v.substring(2, 4), 16) / 255\n  const b = parseInt(v.substring(4, 6), 16) / 255\n  const a = v.length === 8 ? parseInt(v.substring(6, 8), 16) / 255 : 1\n  return [r, g, b, a]\n}\n\nconst noImage = { url: null, sourceKind: 'url' as const, fit: 'cover' as const }\n\n// Groups -------------------------------------------------------------------\n\nexport const PAPER_GROUPS: PaperGroup[] = [\n  // ── Mesh Gradient ──────────────────────────────────────────────────────\n  {\n    slug: 'mesh-gradient',\n    name: 'Mesh Gradient',\n    description: 'Animated color blobs through Mesh Spots + Organic Warp',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#e0eaff'), hex('#241d9a'), hex('#f75092'), hex('#9f50d3')),\n              falloff: 3.5,\n              speed: 1,\n              amplitude: 0.4,\n              seed: 0,\n            },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.5, swirl: 0.1, scale: 1.0, speed: 1, centerFalloff: 0.3, iterations: 2 },\n          },\n        ],\n      },\n      {\n        name: 'Purple',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#aaa7d7'), hex('#3c2b8e'), hex('#aaa7d7'), hex('#3c2b8e')),\n              falloff: 3.5,\n              speed: 0.6,\n              amplitude: 0.4,\n              seed: 1,\n            },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.6, swirl: 0.5, scale: 1.0, speed: 0.6, centerFalloff: 0.0, iterations: 2 },\n          },\n        ],\n      },\n      {\n        name: 'Beach',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#ffe6a3'), hex('#ff7e5f'), hex('#feb47b'), hex('#86a8e7')),\n              falloff: 3.5,\n              speed: 0.4,\n              amplitude: 0.35,\n              seed: 2,\n            },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.4, swirl: 0.2, scale: 1.0, speed: 0.4, centerFalloff: 0.2, iterations: 2 },\n          },\n          {\n            layerType: 'grain',\n            uniformValues: { intensity: 0.12, speed: 1, colored: 0 },\n            blendMode: 'overlay',\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Static Mesh ────────────────────────────────────────────────────────\n  {\n    slug: 'static-mesh-gradient',\n    name: 'Static Mesh',\n    description: 'Frozen color blobs via Mesh Spots (speed=0)',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#e0eaff'), hex('#241d9a'), hex('#f75092'), hex('#9f50d3')),\n              falloff: 3.5,\n              speed: 0,\n              amplitude: 0.35,\n              seed: 0,\n            },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.35, swirl: 0.15, scale: 1.0, speed: 0, centerFalloff: 0.0, iterations: 2 },\n          },\n        ],\n      },\n      {\n        name: 'Sea',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#c9f0ff'), hex('#007baa'), hex('#003d5b'), hex('#7ecfe8')),\n              falloff: 4.0,\n              speed: 0,\n              amplitude: 0.4,\n              seed: 5,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Neuro Noise ────────────────────────────────────────────────────────\n  {\n    slug: 'neuro-noise',\n    name: 'Neuro Noise',\n    description: 'Synaptic web via Scalar Field (tendrils mode) + Color Ramp',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 2, scale: 1.0, speed: 0.3, octaves: 1, persistence: 0.5, lacunarity: 2.0, contrast: 3.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette([0, 0, 0], hex('#477aff'), [1, 1, 1]),\n              channel: 0,\n              steps: 0,\n              stepsPerColor: 1,\n              softness: 0.3,\n              wrap: false,\n              domainMin: 0,\n              domainMax: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Cyan',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 2, scale: 1.0, speed: 0.5, octaves: 1, persistence: 0.5, lacunarity: 2.0, contrast: 3.5, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette([0, 0, 0], hex('#0aa9ff'), hex('#aff5ff')),\n              channel: 0,\n              steps: 0,\n              stepsPerColor: 1,\n              softness: 0.2,\n              wrap: false,\n              domainMin: 0,\n              domainMax: 1,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Swirl ──────────────────────────────────────────────────────────────\n  {\n    slug: 'swirl',\n    name: 'Swirl',\n    description: 'Twisting radial bands via Polar Bands primitive',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'polar-bands',\n            uniformValues: {\n              colorBack: [0.02, 0.02, 0.05],\n              color1: [1, 0.9, 0.4],\n              color2: [0.95, 0.3, 0.5],\n              color3: [0.3, 0.5, 1],\n              bandCount: 4,\n              twist: 0.4,\n              centerSize: 0.3,\n              proportion: 0.5,\n              softness: 0,\n              noiseAmount: 0,\n              speed: 0.4,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Candy',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'polar-bands',\n            uniformValues: {\n              colorBack: [0.98, 0.92, 0.95],\n              color1: [0.95, 0.3, 0.55],\n              color2: [0.3, 0.65, 0.95],\n              color3: [0.95, 0.7, 0.2],\n              bandCount: 6,\n              twist: 0.3,\n              centerSize: 0.2,\n              proportion: 0.4,\n              softness: 0.3,\n              noiseAmount: 0.1,\n              speed: 0.6,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Spiral ─────────────────────────────────────────────────────────────\n  {\n    slug: 'spiral',\n    name: 'Spiral',\n    description: 'Logarithmic spiral via Spiral Stripe primitive',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'spiral-stripe',\n            uniformValues: {\n              colorBack: [0.05, 0.05, 0.08],\n              colorFront: [0.95, 0.85, 0.4],\n              density: 0.5,\n              strokeWidth: 0.5,\n              strokeTaper: 0,\n              strokeCap: 0,\n              distortion: 0,\n              noiseAmount: 0,\n              noiseFreq: 0.5,\n              softness: 0,\n              speed: 0.5,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Jungle',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'spiral-stripe',\n            uniformValues: {\n              colorBack: [0.02, 0.1, 0.04],\n              colorFront: [0.4, 0.9, 0.3],\n              density: 0.7,\n              strokeWidth: 0.35,\n              strokeTaper: 0.3,\n              strokeCap: 0.5,\n              distortion: 0.2,\n              noiseAmount: 0.3,\n              noiseFreq: 0.5,\n              softness: 0.1,\n              speed: 0.3,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Simplex Noise ──────────────────────────────────────────────────────\n  {\n    slug: 'simplex-noise',\n    name: 'Simplex Noise',\n    description: 'Scalar Field (FBM) → Color Ramp',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 1, scale: 1.0, speed: 1.0, octaves: 2, persistence: 0.5, lacunarity: 2.0, contrast: 1.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette([0, 0, 0.05], [0.4, 0.6, 1], [1, 0.95, 0.85]),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.5, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Stepped',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 1, scale: 1.0, speed: 0.6, octaves: 2, persistence: 0.5, lacunarity: 2.0, contrast: 1.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#0a0a14'), hex('#5060c0'), hex('#fff5e0')),\n              channel: 0, steps: 0, stepsPerColor: 4, softness: 0.1, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Bubblegum',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 1, scale: 1.2, speed: 0.8, octaves: 3, persistence: 0.6, lacunarity: 2.0, contrast: 1.2, brightness: 0.0, seed: 10 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#ff80bf'), hex('#ffbfe8'), hex('#bf80ff'), hex('#80bfff')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.4, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Perlin Noise ───────────────────────────────────────────────────────\n  {\n    slug: 'perlin-noise',\n    name: 'Perlin Noise',\n    description: 'Scalar Field (FBM, more octaves) → Color Ramp',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 0, scale: 3.0, speed: 0.5, octaves: 5, persistence: 0.55, lacunarity: 2.1, contrast: 1.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#632ad5'), hex('#fccff7')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.5, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Nintendo Water',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 0, scale: 4.0, speed: 0.6, octaves: 6, persistence: 0.5, lacunarity: 2.0, contrast: 1.1, brightness: 0.0, seed: 5 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#001f6e'), hex('#0050d0'), hex('#00c8ff'), hex('#80efff')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.3, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Voronoi ────────────────────────────────────────────────────────────\n  {\n    slug: 'voronoi',\n    name: 'Voronoi',\n    description: 'Colored cell mosaic via Voronoi Cells primitive',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'voronoi-cells',\n            uniformValues: {\n              colors: palette([0.4, 0.7, 1.0], [0.95, 0.5, 0.7], [0.3, 0.95, 0.7]),\n              colorGap: [0.05, 0.05, 0.08],\n              colorGlow: [0, 0, 0],\n              scale: 5,\n              distortion: 0.25,\n              gap: 0.01,\n              glow: 0.2,\n              stepsPerColor: 1,\n              speed: 0.4,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Cells',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'voronoi-cells',\n            uniformValues: {\n              colors: palette(hex('#1a0533'), hex('#2d1066'), hex('#4a1a99')),\n              colorGap: [0.85, 0.75, 1.0],\n              colorGlow: [0.7, 0.4, 1.0],\n              scale: 6,\n              distortion: 0.3,\n              gap: 0.02,\n              glow: 0.4,\n              stepsPerColor: 1,\n              speed: 0.3,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Waves ──────────────────────────────────────────────────────────────\n  {\n    slug: 'waves',\n    name: 'Waves',\n    description: 'Scalar Field (waves mode) → Color Ramp',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 4, scale: 4.0, speed: 1.0, octaves: 1, persistence: 0.5, lacunarity: 2.0, contrast: 1.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette([0, 0.3, 0.5], [0, 0.6, 0.8]),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.4, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Groovy',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 4, scale: 6.0, speed: 1.5, octaves: 1, persistence: 0.5, lacunarity: 2.0, contrast: 1.5, brightness: 0.0, seed: 3 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#ffbb00'), hex('#ff5500'), hex('#cc00aa'), hex('#3300ff')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.3, wrap: true, domainMin: 0, domainMax: 1,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── God Rays ───────────────────────────────────────────────────────────\n  {\n    slug: 'god-rays',\n    name: 'God Rays',\n    description: 'Radial God Rays generator + Glow Field',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'god-rays',\n            uniformValues: {\n              color: [1, 0.9, 0.6],\n              centerX: 0.5, centerY: 0.5,\n              density: 30, intensity: 0.6, falloff: 1.5, speed: 0.2,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Ether',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'god-rays',\n            uniformValues: {\n              color: [0.4, 0.8, 1.0],\n              centerX: 0.5, centerY: 0.7,\n              density: 50, intensity: 0.8, falloff: 2.0, speed: 0.15,\n            },\n          },\n          {\n            layerType: 'glow-field',\n            uniformValues: { color: [0.3, 0.7, 1.0], radius: 12, intensity: 0.8, threshold: 0.2, composite: 1.0 },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Dot Grid ───────────────────────────────────────────────────────────\n  {\n    slug: 'dot-grid',\n    name: 'Dot Grid',\n    description: 'Regular geometric dot lattice via Dot Glyph Grid',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'dot-glyph-grid',\n            uniformValues: {\n              colorBack: [0.05, 0.05, 0.08],\n              colorFill: [0.95, 0.9, 0.7],\n              colorStroke: [0.95, 0.9, 0.7],\n              gapX: 30, gapY: 30,\n              dotSize: 0.3,\n              strokeWidth: 0,\n              sizeRange: 0,\n              opacityRange: 0,\n              shape: 0,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Diamond',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'dot-glyph-grid',\n            uniformValues: {\n              colorBack: [0.02, 0.02, 0.05],\n              colorFill: [0.5, 0.8, 1.0],\n              colorStroke: [0.8, 0.95, 1.0],\n              gapX: 24, gapY: 24,\n              dotSize: 0.4,\n              strokeWidth: 0.04,\n              sizeRange: 0.15,\n              opacityRange: 0.4,\n              shape: 2,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Static Radial Gradient ─────────────────────────────────────────────\n  {\n    slug: 'static-radial-gradient',\n    name: 'Static Radial',\n    description: 'Three-stop radial via Radial Gradient (3-color)',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'approx',\n        layers: [\n          {\n            layerType: 'radial-gradient-v2',\n            uniformValues: {\n              color1: [0.95, 0.85, 0.5],\n              color2: [0.6, 0.3, 0.7],\n              color3: [0.05, 0.05, 0.15],\n              midPoint: 0.5,\n              centerX: 0.5, centerY: 0.5,\n              radius: 0.7, falloff: 1.2,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Color Panels ───────────────────────────────────────────────────────\n  {\n    slug: 'color-panels',\n    name: 'Color Panels',\n    description: 'Pseudo-3D rotating translucent panels',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'color-array-radial-panels',\n            uniformValues: {\n              colors: palette(hex('#ff9d00'), hex('#fd4f30'), hex('#809bff'), hex('#6d2eff'), hex('#333aff'), hex('#f15cff'), hex('#ffd557')),\n              colorBack: hex('#000000'),\n              density: 3, angle1: 0, angle2: 0, length: 1.1,\n              edges: false, blur: 0, fadeIn: 1, fadeOut: 0.3, gradient: 0, speed: 0.5,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Glass',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'color-array-radial-panels',\n            uniformValues: {\n              colors: palette(hex('#00cfff'), hex('#ff2d55'), hex('#34c759'), hex('#af52de')),\n              colorBack: [1, 1, 1, 0],\n              density: 1.6, angle1: 0.3, angle2: 0.3, length: 1,\n              edges: true, blur: 0.25, fadeIn: 0.85, fadeOut: 0.3, gradient: 0, speed: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Gradient',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'color-array-radial-panels',\n            uniformValues: {\n              colors: palette(hex('#f2ff00'), [0, 0, 0, 0], [0, 0, 0, 0], hex('#5a0283'), hex('#005eff')),\n              colorBack: hex('#100020'),\n              density: 2.5, angle1: 0.05, angle2: -0.05, length: 1.4,\n              edges: false, blur: 0.05, fadeIn: 1, fadeOut: 0, gradient: 1, speed: 0.5,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Grain Gradient ─────────────────────────────────────────────────────\n  {\n    slug: 'grain-gradient',\n    name: 'Grain Gradient',\n    description: 'Mesh Spots + Organic Warp + Grain overlay',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'mesh-spots-gradient',\n            uniformValues: {\n              colors: palette(hex('#e0eaff'), hex('#241d9a'), hex('#f75092'), hex('#9f50d3')),\n              falloff: 3.5, speed: 0.3, amplitude: 0.35, seed: 0,\n            },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.4, swirl: 0.15, scale: 1.0, speed: 0.3, centerFalloff: 0.2, iterations: 2 },\n          },\n          {\n            layerType: 'grain',\n            uniformValues: { intensity: 0.18, speed: 1, colored: 0 },\n            blendMode: 'overlay',\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Dithering ──────────────────────────────────────────────────────────\n  {\n    slug: 'dithering',\n    name: 'Dithering',\n    description: 'Scalar Field → Dither (Bayer 4×4)',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'scalar-field',\n            uniformValues: { mode: 1, scale: 1.0, speed: 0.5, octaves: 2, persistence: 0.5, lacunarity: 2.0, contrast: 1.0, brightness: 0.0, seed: 0 },\n          },\n          {\n            layerType: 'dither',\n            uniformValues: {\n              levels: 4, pixelSize: 2,\n              colorDark: [0.05, 0.05, 0.1],\n              colorLight: [1, 1, 0.95],\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Pulsing Border ─────────────────────────────────────────────────────\n  {\n    slug: 'pulsing-border',\n    name: 'Pulsing Border',\n    description: 'Coloured spots travelling around a rounded-rect perimeter',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'pulsing-border',\n            uniformValues: {\n              colors: palette(hex('#0dc1fd'), hex('#d915ef'), hex('#ff3f2ecc')),\n              colorBack: hex('#000000'),\n              roundness: 0.25, thickness: 0.1, softness: 0.75,\n              intensity: 0.2, bloom: 0.25, spots: 4, spotSize: 0.5,\n              pulse: 0.25, smoke: 0.3, smokeSize: 0.6,\n              marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0,\n              speed: 1,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Northern Lights',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'pulsing-border',\n            uniformValues: {\n              colors: palette(hex('#4c4794'), hex('#774a7d'), hex('#12694a'), hex('#0aff78'), hex('#4733cc')),\n              colorBack: hex('#0c182c'),\n              roundness: 0, thickness: 1, softness: 1,\n              intensity: 0.1, bloom: 0.2, spots: 4, spotSize: 0.25,\n              pulse: 0, smoke: 0.32, smokeSize: 0.5,\n              marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0,\n              speed: 0.18,\n            },\n          },\n        ],\n      },\n      {\n        name: 'Solid Line',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'pulsing-border',\n            uniformValues: {\n              colors: palette(hex('#81ADEC')),\n              colorBack: [0, 0, 0, 0],\n              roundness: 0, thickness: 0.05, softness: 0.4,\n              intensity: 0.4, bloom: 0.35, spots: 1, spotSize: 1,\n              pulse: 0, smoke: 0, smokeSize: 0,\n              marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0,\n              speed: 1,\n            },\n          },\n        ],\n      },\n    ],\n  },\n\n  // ── Image-driven presets ────────────────────────────────────────────────\n  {\n    slug: 'heatmap',\n    name: 'Heatmap',\n    description: 'Image → Image Contour → Color Ramp → Glow Field',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'image-contour',\n            uniformValues: { bands: 12, thickness: 0.4, blur: 0.5 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#0a0033'), hex('#0066ff'), hex('#00ff99'), hex('#ffff00'), hex('#ff5500'), hex('#ff0044')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.4, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n          {\n            layerType: 'glow-field',\n            uniformValues: { color: [1.0, 0.8, 0.4], radius: 6, intensity: 0.6, threshold: 0.4, composite: 0.7 },\n          },\n        ],\n      },\n    ],\n  },\n  {\n    slug: 'image-dithering',\n    name: 'Image Dithering',\n    description: 'Image → Luminance Tap → Dither',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'luminance-tap',\n            uniformValues: {},\n          },\n          {\n            layerType: 'dither',\n            uniformValues: {\n              levels: 4, pixelSize: 2,\n              colorDark: [0, 0.05, 0.22],\n              colorLight: [0.58, 1.0, 0.69],\n            },\n          },\n        ],\n      },\n      {\n        name: 'Retro',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'luminance-tap',\n            uniformValues: {},\n          },\n          {\n            layerType: 'dither',\n            uniformValues: {\n              levels: 2, pixelSize: 3,\n              colorDark: [0.05, 0.05, 0.0],\n              colorLight: [0.9, 0.85, 0.5],\n            },\n          },\n        ],\n      },\n    ],\n  },\n  {\n    slug: 'halftone-dots',\n    name: 'Halftone Dots',\n    description: 'Image → Halftone screen',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'halftone',\n            uniformValues: {\n              cells: 80, angle: 0.7853, softness: 0.05,\n              colorBack: [1, 1, 1],\n              colorDot: [0, 0, 0],\n            },\n          },\n        ],\n      },\n    ],\n  },\n  {\n    slug: 'liquid-metal',\n    name: 'Liquid Metal',\n    description: 'Image → Chrome Relief → Color Ramp (chrome palette) → Grain',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'organic-warp',\n            uniformValues: { distortion: 0.07, swirl: 0.1, scale: 1.0, speed: 1.0, centerFalloff: 0.0, iterations: 2 },\n          },\n          {\n            layerType: 'chrome-relief',\n            uniformValues: { lightAngle: 135, intensity: 1.8, ambient: 0.35, specular: 0.7, thickness: 1.5 },\n          },\n          {\n            layerType: 'color-ramp',\n            uniformValues: {\n              colors: palette(hex('#0a0a10'), hex('#3a3a4a'), hex('#9a9aaa'), hex('#f5f5ff'), hex('#a0a0b0'), hex('#1a1a20')),\n              channel: 0, steps: 0, stepsPerColor: 1, softness: 0.3, wrap: false, domainMin: 0, domainMax: 1,\n            },\n          },\n          {\n            layerType: 'grain',\n            uniformValues: { intensity: 0.04, speed: 0.5, colored: 0 },\n            blendMode: 'overlay',\n          },\n        ],\n      },\n    ],\n  },\n  {\n    slug: 'paper-texture',\n    name: 'Paper Texture',\n    description: 'Image → Material Noise (multiply)',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'material-noise',\n            uniformValues: {\n              colorFront: [0.62, 0.68, 0.74],\n              colorBack: [1.0, 1.0, 1.0],\n              fiber: 0.35,\n              fiberScale: 80,\n              fiberAngle: 0,\n              crumples: 0.25,\n              crumpleScale: 40,\n              grain: 0.05,\n              contrast: 0.4,\n            },\n            blendMode: 'multiply',\n          },\n        ],\n      },\n      {\n        name: 'Cardboard',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'material-noise',\n            uniformValues: {\n              colorFront: [0.5, 0.38, 0.2],\n              colorBack: [0.85, 0.72, 0.5],\n              fiber: 0.55,\n              fiberScale: 120,\n              fiberAngle: 5,\n              crumples: 0.45,\n              crumpleScale: 25,\n              grain: 0.06,\n              contrast: 0.6,\n            },\n            blendMode: 'multiply',\n          },\n        ],\n      },\n    ],\n  },\n  {\n    slug: 'water',\n    name: 'Water',\n    description: 'Image → Water Ripple → Glow Field (caustics)',\n    presets: [\n      {\n        name: 'Default',\n        fidelity: 'primitive',\n        layers: [\n          {\n            layerType: 'image-source',\n            uniformValues: { image: noImage, tint: [1, 1, 1, 1] },\n          },\n          {\n            layerType: 'water-ripple',\n            uniformValues: {\n              amplitude: 0.02, frequency: 14, speed: 0.8,\n              focalX: 0.5, focalY: 0.5,\n              noiseAmount: 0.4, noiseScale: 5,\n            },\n          },\n          {\n            layerType: 'glow-field',\n            uniformValues: { color: [0.8, 0.95, 1.0], radius: 4, intensity: 0.3, threshold: 0.6, composite: 0.4 },\n          },\n        ],\n      },\n    ],\n  },\n]\n\n// Flat list for the existing preset picker UI --------------------------------\n\nexport interface FlatPaperPreset {\n  name: string\n  description: string\n  groupSlug: string\n  fidelity: PaperFidelity\n  layers: PaperLayerSpec[]\n}\n\nexport const PAPER_FLAT_PRESETS: FlatPaperPreset[] = PAPER_GROUPS.flatMap(\n  (group) =>\n    group.presets.map((p) => ({\n      name: `${group.name}${p.name === 'Default' ? '' : ' · ' + p.name}`,\n      description: group.description,\n      groupSlug: group.slug,\n      fidelity: p.fidelity,\n      layers: p.layers,\n    }))\n)\n"
}
```

**Output:**

```
Wrote file successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.9s)

Now update `presets.ts` to match the new fidelity type:

**Tool: read**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts"
}
```

**Output:**

```
<path>/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts</path>
<type>file</type>
<content>
1: import type { BlendMode, UniformValue } from './types'
2: import { PAPER_FLAT_PRESETS } from './paper-presets'
3:
4: // Built-in preset gallery. Each preset is a layer-stack recipe; the runtime
5: // generates fresh layer IDs on load so multiple instances don't collide.
6: //
7: // Most entries are **compositions of atomic primitives** that approximate
8: // Paper's looks — that's the editor's reason for being. A small number lean
9: // on monolithic Paper ports (paper-mesh-gradient, paper-neuro-noise, etc.)
10: // where the algorithm isn't reducible to simpler atoms today.
11: //
12: // `paper-presets.ts` is the source of truth for Paper-equivalent recipes
13: // and their fidelity tags (`exact` / `approx` / `placeholder`). The legacy
14: // PAPER_PRESETS export below is preserved for any UI still using the old
15: // shape; new code should consume PAPER_GROUPS / PAPER_FLAT_PRESETS instead.
16:
17: export interface PresetLayer {
18:   layerType: string
19:   uniformValues: Record<string, UniformValue>
20:   blendMode?: BlendMode
21:   opacity?: number
22: }
23:
24: export interface Preset {
25:   name: string
26:   description: string
27:   layers: PresetLayer[]
28: }
29:
30: export { PAPER_GROUPS, PAPER_FLAT_PRESETS } from './paper-presets'
31: export type { PaperGroup, PaperPreset, PaperFidelity } from './paper-presets'
32:
33: // New canonical preset list, derived from paper-presets.ts. Mapped to the
34: // legacy `Preset` shape so the existing layer-stack picker UI works unchanged.
35: export const PAPER_PRESETS: Preset[] = PAPER_FLAT_PRESETS.map((p) => ({
36:   name: p.name,
37:   description: `[${p.fidelity}] ${p.description}`,
38:   layers: p.layers,
39: }))
40:
41: // Older hand-curated entries — kept as `LEGACY_PAPER_PRESETS` in case any
42: // downstream still references them. Will be removed once the new gallery
43: // lands in the UI.
44: export const LEGACY_PAPER_PRESETS: Preset[] = [
45:   {
46:     name: 'Mesh Gradient',
47:     description: 'Animated 4-spot mesh gradient (Paper port)',
48:     layers: [
49:       {
50:         layerType: 'paper-mesh-gradient',
51:         uniformValues: {
52:           color1: [0.95, 0.4, 0.6],
53:           color2: [0.4, 0.7, 0.95],
54:           color3: [0.95, 0.85, 0.4],
55:           color4: [0.6, 0.4, 0.9],
56:           distortion: 0.8,
57:           swirl: 0.1,
58:           grainMixer: 0,
59:           grainOverlay: 0,
60:           speed: 0.5,
61:         },
62:       },
63:     ],
64:   },
65:   {
66:     name: 'Static Mesh Gradient',
67:     description: 'Still mesh gradient (Paper port)',
68:     layers: [
69:       {
70:         layerType: 'paper-mesh-gradient',
71:         uniformValues: {
72:           color1: [0.95, 0.4, 0.6],
73:           color2: [0.4, 0.7, 0.95],
74:           color3: [0.95, 0.85, 0.4],
75:           color4: [0.6, 0.4, 0.9],
76:           distortion: 0.6,
77:           swirl: 0.3,
78:           grainMixer: 0,
79:           grainOverlay: 0,
80:           speed: 0,
81:         },
82:       },
83:     ],
84:   },
85:   {
86:     name: 'Neuro Noise',
87:     description: 'Synaptic glow web (Paper port)',
88:     layers: [
89:       {
90:         layerType: 'paper-neuro-noise',
91:         uniformValues: {
92:           colorBack: [0.0, 0.0, 0.0],
93:           colorMid: [0.28, 0.65, 1.0],
94:           colorFront: [1.0, 1.0, 1.0],
95:           brightness: 0.05,
96:           contrast: 0.3,
97:           speed: 1.0,
98:         },
99:       },
100:     ],
101:   },
102:   {
103:     name: 'Swirl',
104:     description: 'Twisting color bands (Paper port)',
105:     layers: [
106:       {
107:         layerType: 'paper-swirl',
108:         uniformValues: {
109:           colorBack: [0.02, 0.02, 0.05],
110:           color1: [1.0, 0.9, 0.4],
111:           color2: [0.95, 0.3, 0.5],
112:           color3: [0.3, 0.5, 1.0],
113:           bandCount: 4,
114:           twist: 0.4,
115:           centerSize: 0.3,
116:           proportion: 0.5,
117:           softness: 0,
118:           noiseAmount: 0,
119:           noiseFrequency: 0.5,
120:           speed: 0.4,
121:         },
122:       },
123:     ],
124:   },
125:   {
126:     name: 'Spiral',
127:     description: 'Animated logarithmic spiral (Paper port)',
128:     layers: [
129:       {
130:         layerType: 'paper-spiral',
131:         uniformValues: {
132:           colorBack: [0.05, 0.05, 0.08],
133:           colorFront: [0.95, 0.85, 0.4],
134:           density: 0.5,
135:           distortion: 0,
136:           strokeWidth: 0.5,
137:           strokeTaper: 0,
138:           strokeCap: 0,
139:           noiseAmount: 0,
140:           noiseFrequency: 0.5,
141:           softness: 0,
142:           speed: 0.5,
143:         },
144:       },
145:     ],
146:   },
147:   {
148:     name: 'Voronoi',
149:     description: 'Cell-edge voronoi pattern (our procedural port)',
150:     layers: [
151:       {
152:         layerType: 'voronoi',
153:         uniformValues: {
154:           scale: 6,
155:           speed: 0.4,
156:           randomness: 1,
157:           edgeWidth: 0.05,
158:           cellColor: [0.06, 0.07, 0.12],
159:           edgeColor: [0.4, 0.7, 1.0],
160:         },
161:       },
162:     ],
163:   },
164:   {
165:     name: 'Simplex Noise',
166:     description: 'Two-sample simplex through 3-color ramp (Paper port)',
167:     layers: [
168:       {
169:         layerType: 'paper-simplex-noise',
170:         uniformValues: {
171:           color1: [0.0, 0.0, 0.05],
172:           color2: [0.4, 0.6, 1.0],
173:           color3: [1.0, 0.95, 0.85],
174:           softness: 1,
175:           stepsPerColor: 1,
176:           speed: 1,
177:         },
178:       },
179:     ],
180:   },
181:   {
182:     name: 'Perlin Noise',
183:     description: 'FBM Perlin between two colors',
184:     layers: [
185:       {
186:         layerType: 'perlin-noise',
187:         uniformValues: {
188:           color1: [0.04, 0.05, 0.12],
189:           color2: [0.7, 0.85, 1.0],
190:           scale: 3,
191:           octaves: 6,
192:           persistence: 0.55,
193:           lacunarity: 2.1,
194:           speed: 0.5,
195:         },
196:       },
197:     ],
198:   },
199:   {
200:     name: 'God Rays',
201:     description: 'Radial light rays from a focal point',
202:     layers: [
203:       {
204:         layerType: 'god-rays',
205:         uniformValues: {
206:           color: [1.0, 0.9, 0.6],
207:           centerX: 0.5,
208:           centerY: 0.5,
209:           density: 30,
210:           intensity: 0.6,
211:           falloff: 1.5,
212:           speed: 0.2,
213:         },
214:       },
215:     ],
216:   },
217:   {
218:     name: 'Dot Grid',
219:     description: 'Regular dot lattice',
220:     layers: [
221:       {
222:         layerType: 'dot-grid',
223:         uniformValues: {
224:           color1: [0.05, 0.05, 0.08],
225:           color2: [0.95, 0.9, 0.7],
226:           scale: 30,
227:           dotSize: 0.18,
228:         },
229:       },
230:     ],
231:   },
232:   {
233:     name: 'Static Radial Gradient',
234:     description: 'Three-stop radial gradient',
235:     layers: [
236:       {
237:         layerType: 'radial-gradient-v2',
238:         uniformValues: {
239:           color1: [0.95, 0.85, 0.5],
240:           color2: [0.6, 0.3, 0.7],
241:           color3: [0.05, 0.05, 0.15],
242:           midPoint: 0.5,
243:           centerX: 0.5,
244:           centerY: 0.5,
245:           radius: 0.7,
246:           falloff: 1.2,
247:         },
248:       },
249:     ],
250:   },
251:   {
252:     name: 'Dithering',
253:     description: 'Simplex noise through a 4×4 Bayer dither',
254:     layers: [
255:       {
256:         layerType: 'paper-simplex-noise',
257:         uniformValues: {
258:           color1: [0.05, 0.05, 0.1],
259:           color2: [0.5, 0.5, 0.6],
260:           color3: [1.0, 1.0, 0.95],
261:           softness: 1,
262:           stepsPerColor: 1,
263:           speed: 0.5,
264:         },
265:       },
266:       {
267:         layerType: 'dither',
268:         uniformValues: {
269:           levels: 4,
270:           pixelSize: 2,
271:           colorDark: [0.05, 0.05, 0.1],
272:           colorLight: [1.0, 1.0, 0.95],
273:         },
274:       },
275:     ],
276:   },
277:   {
278:     name: 'Pulsing Border',
279:     description: 'Rounded rect with glow halo',
280:     layers: [
281:       {
282:         layerType: 'rounded-rect',
283:         uniformValues: {
284:           centerX: 0.5,
285:           centerY: 0.5,
286:           width: 0.5,
287:           height: 0.5,
288:           cornerRadius: 0.08,
289:           fillColor: [0, 0, 0],
290:           strokeColor: [0.4, 0.95, 1.0],
291:           strokeWidth: 0.01,
292:         },
293:       },
294:       {
295:         layerType: 'advanced-glow',
296:         uniformValues: { threshold: 0.2, radius: 12, intensity: 1.5, tint: [0.4, 0.95, 1.0] },
297:       },
298:     ],
299:   },
300:   {
301:     name: 'Grain Gradient',
302:     description: 'Mesh gradient with film grain overlay',
303:     layers: [
304:       {
305:         layerType: 'paper-mesh-gradient',
306:         uniformValues: {
307:           color1: [0.95, 0.4, 0.6],
308:           color2: [0.4, 0.7, 0.95],
309:           color3: [0.95, 0.85, 0.4],
310:           color4: [0.6, 0.4, 0.9],
311:           distortion: 0.6,
312:           swirl: 0.2,
313:           grainMixer: 0.5,
314:           grainOverlay: 0.4,
315:           speed: 0.3,
316:         },
317:       },
318:     ],
319:   },
320: ]

(End of file - total 320 lines)
</content>
```

---

## Assistant (Build · Claude Sonnet 4.6 · 14.9s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts",
  "oldString": "import type { BlendMode, UniformValue } from './types'\nimport { PAPER_FLAT_PRESETS } from './paper-presets'\n\n// Built-in preset gallery. Each preset is a layer-stack recipe; the runtime\n// generates fresh layer IDs on load so multiple instances don't collide.\n//\n// Most entries are **compositions of atomic primitives** that approximate\n// Paper's looks — that's the editor's reason for being. A small number lean\n// on monolithic Paper ports (paper-mesh-gradient, paper-neuro-noise, etc.)\n// where the algorithm isn't reducible to simpler atoms today.\n//\n// `paper-presets.ts` is the source of truth for Paper-equivalent recipes\n// and their fidelity tags (`exact` / `approx` / `placeholder`). The legacy\n// PAPER_PRESETS export below is preserved for any UI still using the old\n// shape; new code should consume PAPER_GROUPS / PAPER_FLAT_PRESETS instead.\n\nexport interface PresetLayer {\n  layerType: string\n  uniformValues: Record<string, UniformValue>\n  blendMode?: BlendMode\n  opacity?: number\n}\n\nexport interface Preset {\n  name: string\n  description: string\n  layers: PresetLayer[]\n}\n\nexport { PAPER_GROUPS, PAPER_FLAT_PRESETS } from './paper-presets'\nexport type { PaperGroup, PaperPreset, PaperFidelity } from './paper-presets'\n\n// New canonical preset list, derived from paper-presets.ts. Mapped to the\n// legacy `Preset` shape so the existing layer-stack picker UI works unchanged.\nexport const PAPER_PRESETS: Preset[] = PAPER_FLAT_PRESETS.map((p) => ({\n  name: p.name,\n  description: `[${p.fidelity}] ${p.description}`,\n  layers: p.layers,\n}))",
  "newString": "import type { BlendMode, UniformValue } from './types'\nimport { PAPER_FLAT_PRESETS } from './paper-presets'\n\n// Built-in preset gallery. Each preset is a layer-stack recipe.\n// `paper-presets.ts` is the source of truth; new code should consume\n// PAPER_GROUPS / PAPER_FLAT_PRESETS instead of PAPER_PRESETS or LEGACY_PAPER_PRESETS.\n\nexport interface PresetLayer {\n  layerType: string\n  uniformValues: Record<string, UniformValue>\n  blendMode?: BlendMode\n  opacity?: number\n}\n\nexport interface Preset {\n  name: string\n  description: string\n  layers: PresetLayer[]\n}\n\nexport { PAPER_GROUPS, PAPER_FLAT_PRESETS } from './paper-presets'\nexport type { PaperGroup, PaperPreset, PaperFidelity } from './paper-presets'\n\n// Canonical preset list for the existing picker UI.\nexport const PAPER_PRESETS: Preset[] = PAPER_FLAT_PRESETS.map((p) => ({\n  name: p.name,\n  description: `[${p.fidelity}] ${p.description}`,\n  layers: p.layers,\n}))"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.2s)

**Tool: edit**

**Input:**

```json
{
  "filePath": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/presets.ts",
  "oldString": "// Older hand-curated entries — kept as `LEGACY_PAPER_PRESETS` in case any\n// downstream still references them. Will be removed once the new gallery\n// lands in the UI.\nexport const LEGACY_PAPER_PRESETS: Preset[] = [",
  "newString": "// Legacy hand-curated entries preserved so any UI reference doesn't break.\n// @deprecated — use PAPER_PRESETS (from PAPER_GROUPS) instead.\nexport const LEGACY_PAPER_PRESETS: Preset[] = ["
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.0s)

Now build and check for errors:

**Tool: bash**

**Input:**

```json
{
  "command": "cd /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor && npm run build 2>&1",
  "description": "Run TypeScript build to check for errors",
  "timeout": 60000
}
```

**Output:**

```

> shader-composer@0.1.0 build
> vite build

vite v8.0.10 building client environment for production...
[2K
transforming...✓ 1926 modules transformed.
rendering chunks...
computing gzip size...
.output/public/assets/globals-DaVbPJLj.css  115.10 kB │ gzip:  17.78 kB
.output/public/assets/index-DdZnZ81g.js     318.71 kB │ gzip: 101.09 kB
.output/public/assets/app-BzQ5C-hx.js       477.09 kB │ gzip: 135.00 kB

✓ built in 458ms
vite v8.0.10 building ssr environment for production...
[2K
transforming...✓ 83 modules transformed.
rendering chunks...
computing gzip size...
node_modules/.nitro/vite/services/ssr/assets/globals-DaVbPJLj.css                            115.10 kB │ gzip: 17.78 kB
node_modules/.nitro/vite/services/ssr/assets/start-DkBWIoco.js                                 0.14 kB │ gzip:  0.13 kB
node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-plugin-adapters-y_fshQDY.js    0.18 kB │ gzip:  0.13 kB
node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-BsBDRrWZ.js            0.55 kB │ gzip:  0.30 kB
node_modules/.nitro/vite/services/ssr/assets/router-BbzcXax0.js                                2.55 kB │ gzip:  1.04 kB
node_modules/.nitro/vite/services/ssr/index.js                                                42.15 kB │ gzip: 11.38 kB
node_modules/.nitro/vite/services/ssr/assets/app-D0tXICzi.js                                 298.63 kB │ gzip: 58.80 kB

✓ built in 156ms

[nitro] ◐ Building [Nitro] (preset: node-server, compatibility: 2026-04-27)
[nitro] ✔ Generated public .output/public
vite v8.0.10 building nitro environment for production...
[2K
transforming...✓ 1942 modules transformed.
ℹ Tracing dependencies:
- tslib (2.8.1)
✔ Traced 1 dependencies (4 files) in 32ms.
ℹ Ensure your production environment matches the builder OS and architecture (darwin-arm64) to avoid native module issues.
rendering chunks...
computing gzip size...
.output/server/_ssr/start-DkBWIoco.mjs                              0.14 kB │ gzip:   0.13 kB
.output/server/_libs/radix-ui__number.mjs                           0.17 kB │ gzip:   0.15 kB
.output/server/__23tanstack-start-plugin-adapters-y_fshQDY.mjs      0.24 kB │ gzip:   0.17 kB
.output/server/_libs/radix-ui__primitive.mjs                        0.42 kB │ gzip:   0.23 kB
.output/server/_libs/radix-ui__react-direction.mjs                  0.59 kB │ gzip:   0.32 kB
.output/server/_chunks/ssr-renderer.mjs                             0.60 kB │ gzip:   0.36 kB
.output/server/_tanstack-start-manifest_v-BsBDRrWZ.mjs              0.61 kB │ gzip:   0.33 kB
.output/server/_libs/@radix-ui/react-id+[...].mjs                   0.84 kB │ gzip:   0.44 kB
.output/server/_libs/radix-ui__react-focus-guards.mjs               1.10 kB │ gzip:   0.53 kB
.output/server/_libs/hookable.mjs                                   1.16 kB │ gzip:   0.51 kB
.output/server/_libs/radix-ui__react-portal.mjs                     1.18 kB │ gzip:   0.54 kB
.output/server/_runtime.mjs                                         1.26 kB │ gzip:   0.63 kB
.output/server/_libs/ufo.mjs                                        2.21 kB │ gzip:   0.72 kB
.output/server/_libs/unctx.mjs                                      2.63 kB │ gzip:   0.86 kB
.output/server/_ssr/router-BbzcXax0.mjs                             2.75 kB │ gzip:   1.10 kB
.output/server/_libs/class-variance-authority+clsx.mjs              3.17 kB │ gzip:   1.24 kB
.output/server/_libs/vercel__analytics.mjs                          3.44 kB │ gzip:   1.34 kB
.output/server/_libs/radix-ui__react-presence.mjs                   4.40 kB │ gzip:   1.39 kB
.output/server/_libs/@radix-ui/react-label+[...].mjs                5.75 kB │ gzip:   1.79 kB
.output/server/_libs/radix-ui__react-tabs.mjs                       5.83 kB │ gzip:   1.67 kB
.output/server/_libs/lucide-react.mjs                               7.27 kB │ gzip:   2.16 kB
.output/server/_libs/radix-ui__react-focus-scope.mjs                7.50 kB │ gzip:   2.28 kB
.output/server/_libs/@radix-ui/react-arrow+[...].mjs                7.52 kB │ gzip:   2.39 kB
.output/server/_libs/@radix-ui/react-dismissable-layer+[...].mjs    9.06 kB │ gzip:   2.22 kB
.output/server/_libs/@radix-ui/react-collection+[...].mjs           9.07 kB │ gzip:   2.47 kB
.output/server/_libs/floating-ui__react-dom.mjs                     9.34 kB │ gzip:   2.69 kB
.output/server/_libs/h3-v2.mjs                                      9.62 kB │ gzip:   2.98 kB
.output/server/_libs/@radix-ui/react-roving-focus+[...].mjs        10.52 kB │ gzip:   3.01 kB
.output/server/_libs/@radix-ui/react-popper+[...].mjs              10.64 kB │ gzip:   3.23 kB
.output/server/_libs/tanstack__history.mjs                         12.09 kB │ gzip:   3.48 kB
.output/server/index.mjs                                           12.62 kB │ gzip:   4.21 kB
.output/server/_libs/dnd-kit__sortable.mjs                         15.48 kB │ gzip:   4.22 kB
.output/server/_libs/dnd-kit__accessibility+react.mjs              16.69 kB │ gzip:   4.69 kB
.output/server/_libs/radix-ui__react-slider.mjs                    17.58 kB │ gzip:   4.38 kB
.output/server/_libs/@floating-ui/dom+[...].mjs                    25.85 kB │ gzip:   6.56 kB
.output/server/_libs/@floating-ui/core+[...].mjs                   25.90 kB │ gzip:   6.36 kB
.output/server/_libs/radix-ui__react-scroll-area.mjs               27.68 kB │ gzip:   5.61 kB
.output/server/_ssr/ssr.mjs                                        40.63 kB │ gzip:  11.26 kB
.output/server/_libs/h3+rou3+srvx.mjs                              40.78 kB │ gzip:  11.23 kB
.output/server/_libs/@radix-ui/react-select+[...].mjs              76.24 kB │ gzip:  17.71 kB
.output/server/_libs/@tanstack/router-core+[...].mjs               85.22 kB │ gzip:  20.67 kB
.output/server/_libs/tailwind-merge.mjs                            85.65 kB │ gzip:  15.21 kB
.output/server/_libs/@dnd-kit/core+[...].mjs                       91.84 kB │ gzip:  20.56 kB
.output/server/_libs/prism-react-renderer.mjs                     125.31 kB │ gzip:  33.89 kB
.output/server/_ssr/app-D0tXICzi.mjs                              303.16 kB │ gzip:  58.92 kB
.output/server/_libs/@tanstack/react-router+[...].mjs             650.35 kB │ gzip: 135.92 kB

✓ built in 272ms
ℹ Generated .output/nitro.json

[nitro] ✔ You can preview this build using npx vite preview

```

---

## Assistant (Build · Claude Sonnet 4.6 · 19.1s)

Clean build. Let me verify no existing code still calls the old 4-argument `colorRampLookup` signature:

**Tool: grep**

**Input:**

```json
{
  "pattern": "colorRampLookup",
  "path": "/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src"
}
```

**Output:**

```
Found 5 matches
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/layers/color.ts:
  Line 307:     dependencies: ['luma', 'colorRampLookup'],

  Line 319: return colorRampLookup(t, {{colors}}, {{colors}}_count, {{steps}}, {{softness}}, {{stepsPerColor}}, {{wrap}});`,


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/glsl-utils.ts:
  Line 380:   colorRampLookup: `

  Line 381: vec4 colorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {


/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts:
  Line 16: // override `arrayLength`. Mirrors RAMP_MAX in glsl-utils.colorRampLookup.

```

---

## Assistant (Build · Claude Sonnet 4.6 · 21.5s)

Good — only one call site, and it already uses the new signature. Let me also run the check script and start the dev server for a browser check:

**Tool: bash**

**Input:**

```json
{
  "command": "cd /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor && npx tsx scripts/check-generator.ts 2>&1",
  "description": "Run generator smoke tests",
  "timeout": 30000
}
```

**Output:**

```
npm warn exec The following package was not found and will be installed: tsx@4.21.0
/Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor/src/lib/shader-composer/generator.ts:11
import runtimeShellSource from './runtime-shell.ts?raw'
       ^
SyntaxError: The requested module './runtime-shell.ts?raw' does not provide an export named 'default'
    at #_instantiate (node:internal/modules/esm/module_job:254:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:369:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:671:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.11.1

```

**Tool: bash**

**Input:**

```json
{
  "command": "cd /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor && npm run dev -- --port 5173 &\nsleep 4\necho \"Dev server started\"",
  "description": "Start dev server in background",
  "timeout": 15000
}
```

**Output:**

```

> shader-composer@0.1.0 dev
> vite dev --port 5173

11:42:08 PM [vite] (client) Re-optimizing dependencies because vite config has changed
Port 5173 is in use, trying another one...

  VITE v8.0.10  ready in 827 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
Dev server started


<bash_metadata>
bash tool terminated command after exceeding timeout 15000 ms. If this command is expected to take longer and is not waiting for interactive input, retry with a larger timeout value in milliseconds.
</bash_metadata>
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.3s)

The check script uses a Vite-specific `?raw` import — that's expected. The full `npm run build` is the proper test, and it passed clean. Let me check the browser now:

**Tool: skill**

**Input:**

```json
{
  "name": "agent-browser"
}
```

**Output:**

````
<skill_content name="agent-browser">
# Skill: agent-browser

# Browser Automation with agent-browser

## Core Workflow

Every browser automation follows this pattern:

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
````

## Command Chaining

Commands can be chained with `&&` in a single shell invocation. The browser persists between commands via a background daemon, so chaining is safe and more efficient than separate calls.

```bash
# Chain open + wait + snapshot in one call
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i

# Chain multiple interactions
agent-browser fill @e1 "user@example.com" && agent-browser fill @e2 "password123" && agent-browser click @e3

# Navigate and capture
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser screenshot page.png
```

**When to chain:** Use `&&` when you don't need to read the output of an intermediate command before proceeding (e.g., open + wait + screenshot). Run commands separately when you need to parse the output first (e.g., snapshot to discover refs, then interact using those refs).

## Essential Commands

```bash
# Navigation
agent-browser open <url>              # Navigate (aliases: goto, navigate)
agent-browser close                   # Close browser

# Snapshot
agent-browser snapshot -i             # Interactive elements with refs (recommended)
agent-browser snapshot -i -C          # Include cursor-interactive elements (divs with onclick, cursor:pointer)
agent-browser snapshot -s "#selector" # Scope to CSS selector

# Interaction (use @refs from snapshot)
agent-browser click @e1               # Click element
agent-browser click @e1 --new-tab     # Click and open in new tab
agent-browser fill @e2 "text"         # Clear and type text
agent-browser type @e2 "text"         # Type without clearing
agent-browser select @e1 "option"     # Select dropdown option
agent-browser check @e1               # Check checkbox
agent-browser press Enter             # Press key
agent-browser keyboard type "text"    # Type at current focus (no selector)
agent-browser keyboard inserttext "text"  # Insert without key events
agent-browser scroll down 500         # Scroll page
agent-browser scroll down 500 --selector "div.content"  # Scroll within a specific container

# Get information
agent-browser get text @e1            # Get element text
agent-browser get url                 # Get current URL
agent-browser get title               # Get page title

# Wait
agent-browser wait @e1                # Wait for element
agent-browser wait --load networkidle # Wait for network idle
agent-browser wait --url "**/page"    # Wait for URL pattern
agent-browser wait 2000               # Wait milliseconds

# Downloads
agent-browser download @e1 ./file.pdf          # Click element to trigger download
agent-browser wait --download ./output.zip     # Wait for any download to complete
agent-browser --download-path ./downloads open <url>  # Set default download directory

# Capture
agent-browser screenshot              # Screenshot to temp dir
agent-browser screenshot --full       # Full page screenshot
agent-browser screenshot --annotate   # Annotated screenshot with numbered element labels
agent-browser pdf output.pdf          # Save as PDF

# Diff (compare page states)
agent-browser diff snapshot                          # Compare current vs last snapshot
agent-browser diff snapshot --baseline before.txt    # Compare current vs saved file
agent-browser diff screenshot --baseline before.png  # Visual pixel diff
agent-browser diff url <url1> <url2>                 # Compare two pages
agent-browser diff url <url1> <url2> --wait-until networkidle  # Custom wait strategy
agent-browser diff url <url1> <url2> --selector "#main"  # Scope to element
```

## Common Patterns

### Form Submission

```bash
agent-browser open https://example.com/signup
agent-browser snapshot -i
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser select @e3 "California"
agent-browser check @e4
agent-browser click @e5
agent-browser wait --load networkidle
```

### Authentication with Auth Vault (Recommended)

```bash
# Save credentials once (encrypted with AGENT_BROWSER_ENCRYPTION_KEY)
# Recommended: pipe password via stdin to avoid shell history exposure
echo "pass" | agent-browser auth save github --url https://github.com/login --username user --password-stdin

# Login using saved profile (LLM never sees password)
agent-browser auth login github

# List/show/delete profiles
agent-browser auth list
agent-browser auth show github
agent-browser auth delete github
```

### Authentication with State Persistence

```bash
# Login once and save state
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$USERNAME"
agent-browser fill @e2 "$PASSWORD"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
agent-browser state save auth.json

# Reuse in future sessions
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

### Session Persistence

```bash
# Auto-save/restore cookies and localStorage across browser restarts
agent-browser --session-name myapp open https://app.example.com/login
# ... login flow ...
agent-browser close  # State auto-saved to ~/.agent-browser/sessions/

# Next time, state is auto-loaded
agent-browser --session-name myapp open https://app.example.com/dashboard

# Encrypt state at rest
export AGENT_BROWSER_ENCRYPTION_KEY=$(openssl rand -hex 32)
agent-browser --session-name secure open https://app.example.com

# Manage saved states
agent-browser state list
agent-browser state show myapp-default.json
agent-browser state clear myapp
agent-browser state clean --older-than 7
```

### Data Extraction

```bash
agent-browser open https://example.com/products
agent-browser snapshot -i
agent-browser get text @e5           # Get specific element text
agent-browser get text body > page.txt  # Get all page text

# JSON output for parsing
agent-browser snapshot -i --json
agent-browser get text @e1 --json
```

### Parallel Sessions

```bash
agent-browser --session site1 open https://site-a.com
agent-browser --session site2 open https://site-b.com

agent-browser --session site1 snapshot -i
agent-browser --session site2 snapshot -i

agent-browser session list
```

### Connect to Existing Chrome

```bash
# Auto-discover running Chrome with remote debugging enabled
agent-browser --auto-connect open https://example.com
agent-browser --auto-connect snapshot

# Or with explicit CDP port
agent-browser --cdp 9222 snapshot
```

### Color Scheme (Dark Mode)

```bash
# Persistent dark mode via flag (applies to all pages and new tabs)
agent-browser --color-scheme dark open https://example.com

# Or via environment variable
AGENT_BROWSER_COLOR_SCHEME=dark agent-browser open https://example.com

# Or set during session (persists for subsequent commands)
agent-browser set media dark
```

### Visual Browser (Debugging)

```bash
agent-browser --headed open https://example.com
agent-browser highlight @e1          # Highlight element
agent-browser record start demo.webm # Record session
agent-browser profiler start         # Start Chrome DevTools profiling
agent-browser profiler stop trace.json # Stop and save profile (path optional)
```

### Local Files (PDFs, HTML)

```bash
# Open local files with file:// URLs
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser --allow-file-access open file:///path/to/page.html
agent-browser screenshot output.png
```

### iOS Simulator (Mobile Safari)

```bash
# List available iOS simulators
agent-browser device list

# Launch Safari on a specific device
agent-browser -p ios --device "iPhone 16 Pro" open https://example.com

# Same workflow as desktop - snapshot, interact, re-snapshot
agent-browser -p ios snapshot -i
agent-browser -p ios tap @e1          # Tap (alias for click)
agent-browser -p ios fill @e2 "text"
agent-browser -p ios swipe up         # Mobile-specific gesture

# Take screenshot
agent-browser -p ios screenshot mobile.png

# Close session (shuts down simulator)
agent-browser -p ios close
```

**Requirements:** macOS with Xcode, Appium (`npm install -g appium && appium driver install xcuitest`)

**Real devices:** Works with physical iOS devices if pre-configured. Use `--device "<UDID>"` where UDID is from `xcrun xctrace list devices`.

## Security

All security features are opt-in. By default, agent-browser imposes no restrictions on navigation, actions, or output.

### Content Boundaries (Recommended for AI Agents)

Enable `--content-boundaries` to wrap page-sourced output in markers that help LLMs distinguish tool output from untrusted page content:

```bash
export AGENT_BROWSER_CONTENT_BOUNDARIES=1
agent-browser snapshot
# Output:
# --- AGENT_BROWSER_PAGE_CONTENT nonce=<hex> origin=https://example.com ---
# [accessibility tree]
# --- END_AGENT_BROWSER_PAGE_CONTENT nonce=<hex> ---
```

### Domain Allowlist

Restrict navigation to trusted domains. Wildcards like `*.example.com` also match the bare domain `example.com`. Sub-resource requests, WebSocket, and EventSource connections to non-allowed domains are also blocked. Include CDN domains your target pages depend on:

```bash
export AGENT_BROWSER_ALLOWED_DOMAINS="example.com,*.example.com"
agent-browser open https://example.com        # OK
agent-browser open https://malicious.com       # Blocked
```

### Action Policy

Use a policy file to gate destructive actions:

```bash
export AGENT_BROWSER_ACTION_POLICY=./policy.json
```

Example `policy.json`:

```json
{ "default": "deny", "allow": ["navigate", "snapshot", "click", "scroll", "wait", "get"] }
```

Auth vault operations (`auth login`, etc.) bypass action policy but domain allowlist still applies.

### Output Limits

Prevent context flooding from large pages:

```bash
export AGENT_BROWSER_MAX_OUTPUT=50000
```

## Diffing (Verifying Changes)

Use `diff snapshot` after performing an action to verify it had the intended effect. This compares the current accessibility tree against the last snapshot taken in the session.

```bash
# Typical workflow: snapshot -> action -> diff
agent-browser snapshot -i          # Take baseline snapshot
agent-browser click @e2            # Perform action
agent-browser diff snapshot        # See what changed (auto-compares to last snapshot)
```

For visual regression testing or monitoring:

```bash
# Save a baseline screenshot, then compare later
agent-browser screenshot baseline.png
# ... time passes or changes are made ...
agent-browser diff screenshot --baseline baseline.png

# Compare staging vs production
agent-browser diff url https://staging.example.com https://prod.example.com --screenshot
```

`diff snapshot` output uses `+` for additions and `-` for removals, similar to git diff. `diff screenshot` produces a diff image with changed pixels highlighted in red, plus a mismatch percentage.

## Timeouts and Slow Pages

The default Playwright timeout is 25 seconds for local browsers. This can be overridden with the `AGENT_BROWSER_DEFAULT_TIMEOUT` environment variable (value in milliseconds). For slow websites or large pages, use explicit waits instead of relying on the default timeout:

```bash
# Wait for network activity to settle (best for slow pages)
agent-browser wait --load networkidle

# Wait for a specific element to appear
agent-browser wait "#content"
agent-browser wait @e1

# Wait for a specific URL pattern (useful after redirects)
agent-browser wait --url "**/dashboard"

# Wait for a JavaScript condition
agent-browser wait --fn "document.readyState === 'complete'"

# Wait a fixed duration (milliseconds) as a last resort
agent-browser wait 5000
```

When dealing with consistently slow websites, use `wait --load networkidle` after `open` to ensure the page is fully loaded before taking a snapshot. If a specific element is slow to render, wait for it directly with `wait <selector>` or `wait @ref`.

## Session Management and Cleanup

When running multiple agents or automations concurrently, always use named sessions to avoid conflicts:

```bash
# Each agent gets its own isolated session
agent-browser --session agent1 open site-a.com
agent-browser --session agent2 open site-b.com

# Check active sessions
agent-browser session list
```

Always close your browser session when done to avoid leaked processes:

```bash
agent-browser close                    # Close default session
agent-browser --session agent1 close   # Close specific session
```

If a previous session was not closed properly, the daemon may still be running. Use `agent-browser close` to clean it up before starting new work.

## Ref Lifecycle (Important)

Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes. Always re-snapshot after:

- Clicking links or buttons that navigate
- Form submissions
- Dynamic content loading (dropdowns, modals)

```bash
agent-browser click @e5              # Navigates to new page
agent-browser snapshot -i            # MUST re-snapshot
agent-browser click @e1              # Use new refs
```

## Annotated Screenshots (Vision Mode)

Use `--annotate` to take a screenshot with numbered labels overlaid on interactive elements. Each label `[N]` maps to ref `@eN`. This also caches refs, so you can interact with elements immediately without a separate snapshot.

```bash
agent-browser screenshot --annotate
# Output includes the image path and a legend:
#   [1] @e1 button "Submit"
#   [2] @e2 link "Home"
#   [3] @e3 textbox "Email"
agent-browser click @e2              # Click using ref from annotated screenshot
```

Use annotated screenshots when:

- The page has unlabeled icon buttons or visual-only elements
- You need to verify visual layout or styling
- Canvas or chart elements are present (invisible to text snapshots)
- You need spatial reasoning about element positions

## Semantic Locators (Alternative to Refs)

When refs are unavailable or unreliable, use semantic locators:

```bash
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find placeholder "Search" type "query"
agent-browser find testid "submit-btn" click
```

## JavaScript Evaluation (eval)

Use `eval` to run JavaScript in the browser context. **Shell quoting can corrupt complex expressions** -- use `--stdin` or `-b` to avoid issues.

```bash
# Simple expressions work with regular quoting
agent-browser eval 'document.title'
agent-browser eval 'document.querySelectorAll("img").length'

# Complex JS: use --stdin with heredoc (RECOMMENDED)
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll("img"))
    .filter(i => !i.alt)
    .map(i => ({ src: i.src.split("/").pop(), width: i.width }))
)
EVALEOF

# Alternative: base64 encoding (avoids all shell escaping issues)
agent-browser eval -b "$(echo -n 'Array.from(document.querySelectorAll("a")).map(a => a.href)' | base64)"
```

**Why this matters:** When the shell processes your command, inner double quotes, `!` characters (history expansion), backticks, and `$()` can all corrupt the JavaScript before it reaches agent-browser. The `--stdin` and `-b` flags bypass shell interpretation entirely.

**Rules of thumb:**

- Single-line, no nested quotes -> regular `eval 'expression'` with single quotes is fine
- Nested quotes, arrow functions, template literals, or multiline -> use `eval --stdin <<'EVALEOF'`
- Programmatic/generated scripts -> use `eval -b` with base64

## Configuration File

Create `agent-browser.json` in the project root for persistent settings:

```json
{
  "headed": true,
  "proxy": "http://localhost:8080",
  "profile": "./browser-data"
}
```

Priority (lowest to highest): `~/.agent-browser/config.json` < `./agent-browser.json` < env vars < CLI flags. Use `--config <path>` or `AGENT_BROWSER_CONFIG` env var for a custom config file (exits with error if missing/invalid). All CLI options map to camelCase keys (e.g., `--executable-path` -> `"executablePath"`). Boolean flags accept `true`/`false` values (e.g., `--headed false` overrides config). Extensions from user and project configs are merged, not replaced.

## Deep-Dive Documentation

| Reference                                                            | When to Use                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| [references/commands.md](references/commands.md)                     | Full command reference with all options                   |
| [references/snapshot-refs.md](references/snapshot-refs.md)           | Ref lifecycle, invalidation rules, troubleshooting        |
| [references/session-management.md](references/session-management.md) | Parallel sessions, state persistence, concurrent scraping |
| [references/authentication.md](references/authentication.md)         | Login flows, OAuth, 2FA handling, state reuse             |
| [references/video-recording.md](references/video-recording.md)       | Recording workflows for debugging and documentation       |
| [references/profiling.md](references/profiling.md)                   | Chrome DevTools profiling for performance analysis        |
| [references/proxy-support.md](references/proxy-support.md)           | Proxy configuration, geo-testing, rotating proxies        |

## Ready-to-Use Templates

| Template                                                                 | Description                         |
| ------------------------------------------------------------------------ | ----------------------------------- |
| [templates/form-automation.sh](templates/form-automation.sh)             | Form filling with validation        |
| [templates/authenticated-session.sh](templates/authenticated-session.sh) | Login once, reuse state             |
| [templates/capture-workflow.sh](templates/capture-workflow.sh)           | Content extraction with screenshots |

```bash
./templates/form-automation.sh https://example.com/form
./templates/authenticated-session.sh https://app.example.com/login
./templates/capture-workflow.sh https://example.com ./output
```

Base directory for this skill: file:///Users/tjnickerson/.agents/skills/agent-browser
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/tjnickerson/.agents/skills/agent-browser/templates/authenticated-session.sh</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/templates/form-automation.sh</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/templates/capture-workflow.sh</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/session-management.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/snapshot-refs.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/video-recording.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/profiling.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/commands.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/proxy-support.md</file>
<file>/Users/tjnickerson/.agents/skills/agent-browser/references/authentication.md</file>
</skill_files>
</skill_content>

````

---

## Assistant (Build · Claude Sonnet 4.6 · 4.8s)

**Tool: bash**

**Input:**
```json
{
  "command": "agent-browser open http://localhost:5174 && agent-browser wait --load networkidle && agent-browser screenshot --annotate 2>&1 | tail -5",
  "description": "Open editor and take annotated screenshot",
  "timeout": 30000
}
````

**Output:**

```
✗ Navigation failed: net::ERR_CONNECTION_REFUSED

```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.6s)

**Tool: bash**

**Input:**

```json
{
  "command": "lsof -ti:5174 | head -3; curl -s -o /dev/null -w \"%{http_code}\" http://localhost:5174/ 2>&1",
  "description": "Check if dev server is running on 5174",
  "timeout": 10000
}
```

**Output:**

```
000
```

---

## Assistant (Build · Claude Sonnet 4.6 · 9.7s)

**Tool: bash**

**Input:**

```json
{
  "command": "cd /Users/tjnickerson/Documents/GitHub/Nickersoft/shader-editor && npm run dev -- --port 5174 > /tmp/vite-dev.log 2>&1 &\nsleep 5\ncurl -s -o /dev/null -w \"%{http_code}\" http://localhost:5174/",
  "description": "Start dev server and verify it's up",
  "timeout": 20000
}
```

**Output:**

```
200
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.0s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser open http://localhost:5174 && agent-browser wait --load networkidle && agent-browser screenshot /tmp/editor-home.png 2>&1",
  "description": "Open editor and screenshot home state",
  "timeout": 30000
}
```

**Output:**

```
✓ Shader Composer
  http://localhost:5174/
✓ Done
✓ Screenshot saved to /tmp/editor-home.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 2.9s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/editor-home.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.7s)

Good — 53 generators showing. Let me open the preset picker and test some of the new primitive-based presets:

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser snapshot -i 2>&1 | grep -i preset",
  "description": "Find the Presets button ref",
  "timeout": 10000
}
```

**Output:**

```
- button "Presets ▸" [ref=e3]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.1s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e3 && agent-browser wait 800 && agent-browser screenshot /tmp/presets-open.png 2>&1",
  "description": "Open presets panel and screenshot",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/presets-open.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.0s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/presets-open.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.9s)

41 presets showing with proper names. Let me load the Mesh Gradient preset and verify it renders:

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser snapshot -i 2>&1 | grep -i \"mesh gradient\\|neuro\\|spiral\\|swirl\\|voronoi\" | head -20",
  "description": "Find preset button refs",
  "timeout": 10000
}
```

**Output:**

```
- button "Mesh Gradient" [ref=e5]
- button "Mesh Gradient · Purple" [ref=e6]
- button "Mesh Gradient · Beach" [ref=e7]
- button "Neuro Noise" [ref=e10]
- button "Neuro Noise · Cyan" [ref=e11]
- button "Swirl" [ref=e12]
- button "Swirl · Candy" [ref=e13]
- button "Spiral" [ref=e14]
- button "Spiral · Jungle" [ref=e15]
- button "Voronoi" [ref=e21]
- button "Voronoi · Cells" [ref=e22]
- button "Mesh Gradient" [ref=e69]
- button "Neuro Noise" [ref=e72]
- button "Spiral" [ref=e87]
- button "Spiral" [ref=e88]
- button "Spiral Stripe" [ref=e89]
- button "Swirl" [ref=e93]
- button "Voronoi" [ref=e96]
- button "Voronoi Cells" [ref=e97]
- button "Swirl" [ref=e118]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.0s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e5 && agent-browser wait 1200 && agent-browser screenshot /tmp/mesh-gradient.png 2>&1",
  "description": "Load Mesh Gradient preset and screenshot",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/mesh-gradient.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.3s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/mesh-gradient.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 8.6s)

Mesh Gradient renders beautifully — the pink/purple/blue blobs with organic warp distortion look great. The GLSL is generating a correct 2-pass shader. Let me check a few more presets:

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e10 && agent-browser wait 1200 && agent-browser screenshot /tmp/neuro-noise.png 2>&1",
  "description": "Load Neuro Noise preset",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/neuro-noise.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.6s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e12 && agent-browser wait 1200 && agent-browser screenshot /tmp/swirl.png 2>&1",
  "description": "Load Swirl preset",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/swirl.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.4s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e14 && agent-browser wait 1200 && agent-browser screenshot /tmp/spiral.png 2>&1",
  "description": "Load Spiral preset",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/spiral.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.6s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e21 && agent-browser wait 1200 && agent-browser screenshot /tmp/voronoi.png 2>&1",
  "description": "Load Voronoi preset",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/voronoi.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.1s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/neuro-noise.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 16.9s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/swirl.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 18.1s)

The refs are stale after preset loads. Let me re-snapshot and test the remaining presets properly:

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser snapshot -i 2>&1 | grep -E \"button.*Presets|button.*Neuro|button.*Swirl|button.*Spiral|button.*Simplex|button.*Voronoi\" | head -15",
  "description": "Get fresh refs for preset buttons",
  "timeout": 10000
}
```

**Output:**

```
- button "Presets ▾" [ref=e3]
- button "Neuro Noise" [ref=e12]
- button "Neuro Noise · Cyan" [ref=e13]
- button "Swirl" [ref=e14]
- button "Swirl · Candy" [ref=e15]
- button "Spiral" [ref=e16]
- button "Spiral · Jungle" [ref=e17]
- button "Simplex Noise" [ref=e18]
- button "Simplex Noise · Stepped" [ref=e19]
- button "Simplex Noise · Bubblegum" [ref=e20]
- button "Voronoi" [ref=e23]
- button "Voronoi · Cells" [ref=e24]
- button "Neuro Noise" [ref=e74]
- button "Simplex Noise" [ref=e85]
- button "Simplex Noise" [ref=e86]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 7.0s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e12 && agent-browser wait 1000 && agent-browser screenshot /tmp/neuro-noise2.png 2>&1 && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*Swirl|button.*Spiral|button.*Simplex|button.*Voronoi\" | head -10",
  "description": "Load Neuro Noise and get fresh refs",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/neuro-noise2.png
- button "Swirl" [ref=e14]
- button "Swirl · Candy" [ref=e15]
- button "Spiral" [ref=e16]
- button "Spiral · Jungle" [ref=e17]
- button "Simplex Noise" [ref=e18]
- button "Simplex Noise · Stepped" [ref=e19]
- button "Simplex Noise · Bubblegum" [ref=e20]
- button "Voronoi" [ref=e23]
- button "Voronoi · Cells" [ref=e24]
- button "Simplex Noise" [ref=e85]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 9.9s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e14 && agent-browser wait 1000 && agent-browser screenshot /tmp/swirl2.png 2>&1 && \\\nagent-browser click @e16 && agent-browser wait 1000 && agent-browser screenshot /tmp/spiral2.png 2>&1 && \\\nagent-browser click @e18 && agent-browser wait 1000 && agent-browser screenshot /tmp/simplex2.png 2>&1",
  "description": "Load Swirl, Spiral, Simplex Noise presets",
  "timeout": 20000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/swirl2.png
✓ Done
✓ Done
✓ Screenshot saved to /tmp/spiral2.png
✓ Done
✓ Done
✓ Screenshot saved to /tmp/simplex2.png

```

---

## Assistant (Build · Claude Sonnet 4.6 · 3.3s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/neuro-noise2.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 25.0s)

**Tool: read**

**Input:**

```json
{
  "filePath": "/tmp/swirl2.png"
}
```

**Output:**

```
Image read successfully
```

---

## Assistant (Build · Claude Sonnet 4.6 · 37.8s)

The refs are getting invalidated by layer stack changes. Let me do a clean test by reloading and clicking each preset directly:

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser open http://localhost:5174 && agent-browser wait --load networkidle && \\\nagent-browser click @e3 && agent-browser wait 500 && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*Swirl|button.*Spiral|button.*Simplex|button.*Voronoi|button.*Neuro\" | head -12",
  "description": "Fresh load + open presets, find preset refs",
  "timeout": 20000
}
```

**Output:**

```
✓ Shader Composer
  http://localhost:5174/
✓ Done
✗ Unknown ref: e3

```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.8s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser snapshot -i 2>&1 | grep -i preset",
  "description": "Find Presets button after fresh load",
  "timeout": 10000
}
```

**Output:**

```
- button "Presets ▸" [ref=e3]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 5.4s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e3 && agent-browser wait 400 && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*(Neuro|Swirl|Spiral|Voronoi|Simplex)\" | head -15",
  "description": "Open presets and find specific preset refs",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
- button "Neuro Noise" [ref=e10]
- button "Neuro Noise · Cyan" [ref=e11]
- button "Swirl" [ref=e12]
- button "Swirl · Candy" [ref=e13]
- button "Spiral" [ref=e14]
- button "Spiral · Jungle" [ref=e15]
- button "Simplex Noise" [ref=e16]
- button "Simplex Noise · Stepped" [ref=e17]
- button "Simplex Noise · Bubblegum" [ref=e18]
- button "Voronoi" [ref=e21]
- button "Voronoi · Cells" [ref=e22]
- button "Neuro Noise" [ref=e72]
- button "Simplex Noise" [ref=e83]
- button "Simplex Noise" [ref=e84]
- button "Spiral" [ref=e87]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.6s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e10 && agent-browser wait 1200 && agent-browser screenshot /tmp/neuro-clean.png && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*(Swirl|Spiral|Simplex|Voronoi)\" | head -10",
  "description": "Load Neuro Noise, get fresh refs",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/neuro-clean.png
- button "Swirl" [ref=e12]
- button "Swirl · Candy" [ref=e13]
- button "Spiral" [ref=e14]
- button "Spiral · Jungle" [ref=e15]
- button "Simplex Noise" [ref=e16]
- button "Simplex Noise · Stepped" [ref=e17]
- button "Simplex Noise · Bubblegum" [ref=e18]
- button "Voronoi" [ref=e21]
- button "Voronoi · Cells" [ref=e22]
- button "Simplex Noise" [ref=e83]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.3s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e12 && agent-browser wait 1200 && agent-browser screenshot /tmp/swirl-clean.png && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*(Spiral|Simplex|Voronoi)\" | head -8",
  "description": "Load Swirl, get fresh refs",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/swirl-clean.png
- button "Spiral" [ref=e14]
- button "Spiral · Jungle" [ref=e15]
- button "Simplex Noise" [ref=e16]
- button "Simplex Noise · Stepped" [ref=e17]
- button "Simplex Noise · Bubblegum" [ref=e18]
- button "Voronoi" [ref=e21]
- button "Voronoi · Cells" [ref=e22]
- button "Simplex Noise" [ref=e83]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 6.3s)

**Tool: bash**

**Input:**

```json
{
  "command": "agent-browser click @e14 && agent-browser wait 1200 && agent-browser screenshot /tmp/spiral-clean.png && \\\nagent-browser snapshot -i 2>&1 | grep -E \"button.*(Simplex|Voronoi)\" | head -8",
  "description": "Load Spiral, get fresh refs",
  "timeout": 15000
}
```

**Output:**

```
✓ Done
✓ Done
✓ Screenshot saved to /tmp/spiral-clean.png
- button "Simplex Noise" [ref=e18]
- button "Simplex Noise · Stepped" [ref=e19]
- button "Simplex Noise · Bubblegum" [ref=e20]
- button "Voronoi" [ref=e23]
- button "Voronoi · Cells" [ref=e24]
- button "Simplex Noise" [ref=e85]
- button "Simplex Noise" [ref=e86]
- button "Voronoi" [ref=e98]

```

---

## Assistant (Build · Claude Sonnet 4.6 · 2.8s)

---
