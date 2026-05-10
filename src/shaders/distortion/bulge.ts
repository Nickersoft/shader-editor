import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'
import type { SpatialControl } from '@/shaders/core/spatial'

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  radius: zFloat(0, 5, 0.05).default(1.0).describe('Radius'),
  strength: zFloat(-1, 1, 0.05).default(1.0).describe('Strength'),
  falloff: zFloat(0, 1, 0.05).default(0.5).describe('Falloff'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Bulge',
  description: 'Magnify or pinch content around a center point',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Bulge extends EffectNode<Config, Inputs> {
  static readonly typeId = 'bulge'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly spatialControls: readonly SpatialControl[] = [
    { kind: 'point', x: 'centerX', y: 'centerY', label: 'Center' },
  ]

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const strength = this.uniformName('strength')
    const falloff = this.uniformName('falloff')
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, 1.0 - ${cy});
vec2 delta = aspectUV - centerPos;
float dist = length(delta);
float effRadius = ${radius} * 0.5;
float smoothFalloff = 1.0 - smoothstep(effRadius * max(1.0 - ${falloff} - 0.001, 0.0), effRadius, dist);
float normDist = dist / max(effRadius, 1e-6);
float quadFall = max(0.0, 1.0 - normDist * normDist);
float falloffTotal = smoothFalloff * quadFall;
float disp = -${strength} * falloffTotal;
float scaleFactor = 1.0 + disp;
vec2 bulgedDelta = delta * scaleFactor;
vec2 bulgedUV = centerPos + bulgedDelta;
vec2 finalUV = vec2(bulgedUV.x / aspect, bulgedUV.y);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(Bulge)
export default Bulge
