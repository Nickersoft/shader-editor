import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zBool, zColor, zFloat, zInt, zVec2 } from '@/shaders/core/schemas'

const config = z.object({
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  amplitude: zFloat(0, 4, 0.01).default(1).describe('Amplitude'),
  frequency: zFloat(0.1, 12, 0.05).default(1).describe('Frequency'),
  lineCount: zInt(1, 80).default(12).describe('Line Count'),
  lineWidth: zFloat(0, 1).default(0.1).describe('Line Width'),
  waveColor: zColor().default([0.95, 0.79, 0.03]).describe('Wave Color'),
  pinEdges: zBool().default(true).describe('Pin Edges'),
  start: zVec2().default([0, 0.5]).describe('Start'),
  end: zVec2().default([1, 0.5]).describe('End'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Strands',
  description: 'Procedural wavy strands with layered animation',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Strands extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'strands'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const speed = this.uniformName('speed')
    const amplitude = this.uniformName('amplitude')
    const frequency = this.uniformName('frequency')
    const lineCount = this.uniformName('lineCount')
    const lineWidth = this.uniformName('lineWidth')
    const waveColor = this.uniformName('waveColor')
    const pinEdges = this.uniformName('pinEdges')
    const start = this.uniformName('start')
    const end = this.uniformName('end')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 s = ${start} * _ar;
vec2 e = ${end} * _ar;
vec2 p = uv * _ar;
vec2 axis = e - s;
float L = max(length(axis), 1e-4);
vec2 nDir = axis / L;
vec2 nPerp = vec2(-nDir.y, nDir.x);
float along = dot(p - s, nDir) / L;
float across = dot(p - s, nPerp);
float t = u_time * ${speed};
float n = float(${lineCount});
float pin = 1.0;
if (${pinEdges}) pin = sin(clamp(along, 0.0, 1.0) * 3.14159);
float acc = 0.0;
for (int i = 0; i < 64; i++) {
  if (float(i) >= n) break;
  float fi = float(i);
  float layerKey = (fi + 0.5) / max(n, 1.0) - 0.5;
  float wave = sin(along * 6.2831 * ${frequency} + t + fi * 0.7) * 0.06 * ${amplitude} * pin;
  float laneY = layerKey * 0.6 + wave;
  float d = abs(across - laneY);
  acc = max(acc, 1.0 - aastep(${lineWidth} * 0.05, d));
}
return vec4(${waveColor} * acc, acc);`,
    }
  }
}

register(Strands)
export default Strands
