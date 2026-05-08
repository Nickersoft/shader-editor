import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColor, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0.65, 0.20, 0.97]).describe('Color A'),
  colorB: zColor().default([0.13, 0.93, 0.53]).describe('Color B'),
  colorC: zColor().default([0.09, 0.58, 0.91]).describe('Color C'),
  balance: zFloat(0, 100, 1).default(50).describe('Balance'),
  intensity: zFloat(0, 200, 1).default(80).describe('Intensity'),
  curtainCount: zInt(1, 8).default(4).describe('Curtain Count'),
  speed: zFloat(0, 20, 0.1).default(5).describe('Speed'),
  waviness: zFloat(0, 100, 1).default(50).describe('Waviness'),
  rayDensity: zFloat(0, 100, 1).default(20).describe('Ray Density'),
  height: zFloat(0, 200, 1).default(120).describe('Height'),
  center: zCenter().default([0.5, 0]).describe('Center'),
  seed: zFloat(0, 10, 0.01).default(0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Aurora',
  description: 'Layered aurora curtains with vertical rays and flowing light',
  color: '#22ee88',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Aurora extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'aurora'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const colorC = this.uniformName('colorC')
    const balance = this.uniformName('balance')
    const intensity = this.uniformName('intensity')
    const curtainCount = this.uniformName('curtainCount')
    const speed = this.uniformName('speed')
    const waviness = this.uniformName('waviness')
    const rayDensity = this.uniformName('rayDensity')
    const height = this.uniformName('height')
    const center = this.uniformName('center')
    const seed = this.uniformName('seed')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
// Docs convention: center.y=0 anchors the aurora to the visual top, with depth
// extending downward. WebGL uv.y=0 is the visual bottom, so flip y on intake.
vec2 uvTd = vec2(uv.x, 1.0 - uv.y);
vec2 p = (uvTd - ${center}) * _ar;
float t = u_time * (${speed} * 0.04) + ${seed};

float wav = ${waviness} / 100.0;
float bal = ${balance} / 100.0;
float h01 = max(${height} / 100.0, 0.001);

// Each curtain is a vertical sheet whose X-position varies smoothly with Y.
// Pure sin-only motion — no fbm — so contours stay clean, not lumpy.
float aur = 0.0;
float layers = float(${curtainCount});
for (int i = 0; i < 8; i++) {
  if (float(i) >= layers) break;
  float fi = float(i);
  float layerKey = (fi + 0.5) / max(layers, 1.0) - 0.5;
  float phase = fi * 1.7 + ${seed};

  float xCurtain = layerKey * 0.7;
  xCurtain += sin(p.y * 2.5 + phase + t * 1.2) * 0.22 * wav;
  xCurtain += sin(p.y * 5.0 - phase * 1.7 + t * 0.7) * 0.10 * wav;

  float dx = abs(p.x - xCurtain);
  float w = 0.20 + 0.04 * sin(p.y * 3.0 + phase);
  float coreH = exp(-pow(dx / max(w, 0.02), 2.0));

  // Animated falloff: the effective bottom of the aurora ripples across X
  // and time. Two harmonics + a per-layer phase keep the wave from feeling
  // like one rigid sine.
  float hWave = sin(p.x * 1.6 + t * 0.9 + phase) * 0.18
              + sin(p.x * 3.4 - t * 0.6 + phase * 1.3) * 0.08;
  float hLocal = h01 * (1.0 + hWave);
  float vFade = smoothstep(-0.02, 0.12, p.y)
              * pow(clamp(1.0 - p.y / max(hLocal, 0.05), 0.0, 1.0), 1.4);

  // Screen-blend curtains so overlaps don't accumulate past 1.0 into a
  // saturated "burn hole" where the depth color shows through at full power.
  float layer = coreH * vFade;
  aur = 1.0 - (1.0 - aur) * (1.0 - layer);
}

// Subtle vertical-ray modulation — pure sin, no fbm, low contrast.
float rayN = clamp(${rayDensity} / 100.0, 0.0, 1.0);
float rays = 0.5 + 0.5 * sin(uv.x * (3.0 + ${rayDensity} * 0.10) * 6.28318);
aur *= mix(1.0, 0.92 + 0.16 * rays, rayN);

aur *= ${intensity} / 100.0;

// Animated depth: the color ramp's vertical position rides a slow horizontal
// wave so the A→B transition band undulates instead of sitting on a fixed Y.
float depthShift = sin(p.x * 1.4 + t * 0.65) * 0.10
                 + sin(p.x * 2.7 - t * 0.45) * 0.05;
float depth = clamp(p.y / h01 + depthShift, 0.0, 1.0);
float k1 = smoothstep(0.0, mix(0.20, 0.60, bal), depth);
float k2 = smoothstep(mix(0.40, 0.85, bal), 1.0, depth);
vec3 col = mix(${colorA}, ${colorB}, k1);
col = mix(col, ${colorC}, k2);

// Subtle dim at the A↔B midpoint — keeps the natural cyan transition from
// reading as a hot bright blob.
float midDim = exp(-pow((k1 - 0.5) / 0.22, 2.0)) * (1.0 - smoothstep(0.7, 1.0, k2));
col *= 1.0 - 0.18 * midDim;

float a = clamp(aur, 0.0, 1.0);
return vec4(col * a, a);`,
    }
  }
}

register(Aurora)
export default Aurora
