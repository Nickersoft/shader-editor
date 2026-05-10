import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 0.3, 0.005).default(0.04).describe('Intensity'),
  speed: zFloat(0, 30, 0.1).default(6.0).describe('Speed'),
  blockDensity: zFloat(0, 1).default(0.5).describe('Block Density'),
  colorBars: zFloat(0, 1).default(0).describe('Color Bars'),
  mirrorChance: zFloat(0, 1).default(0).describe('Mirror Chance'),
  scanlineDistortion: zFloat(0, 1).default(0).describe('Scanline Distortion'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glitch',
  description: 'Banded jitter with optional color bars, mirroring, and scanline distortion',
  color: '#22d3ee',
  category: 'stylize',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Glitch extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glitch'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const speed = this.uniformName('speed')
    const blockDensity = this.uniformName('blockDensity')
    const colorBars = this.uniformName('colorBars')
    const mirrorChance = this.uniformName('mirrorChance')
    const scanlineDistortion = this.uniformName('scanlineDistortion')
    return {
      dependencies: ['hash'],
      main: `
float lines = mix(8.0, 400.0, clamp(${blockDensity}, 0.0, 1.0));
float band = floor(uv.y * lines);
float t = floor(u_time * ${speed});
float h = hash(vec2(band, t));
float jitter = (h - 0.5) * 2.0 * ${intensity};
vec2 q = vec2(uv.x + jitter, uv.y);

float scanWave = sin(uv.y * 800.0 + u_time * ${speed} * 4.0);
q.x += scanWave * ${scanlineDistortion} * 0.01;

float mirrorH = hash(vec2(band, t + 17.0));
if (mirrorH < ${mirrorChance}) {
  q.x = 1.0 - q.x;
}

vec4 src = texture(u_prevPass, q);

float barH = hash(vec2(band, t + 31.0));
if (barH < ${colorBars}) {
  vec3 bar = vec3(
    step(0.33, fract(band * 0.137 + t * 0.07)),
    step(0.33, fract(band * 0.491 + t * 0.13)),
    step(0.33, fract(band * 0.733 + t * 0.19))
  );
  src.rgb = mix(src.rgb, bar, 0.7);
}

return src;`,
    }
  }
}

register(Glitch)
export default Glitch
