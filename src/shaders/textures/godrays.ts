import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColorRgba, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  rayColor: zColorRgba().default([0.26, 0.51, 0.98, 1]).describe('Ray Color'),
  backgroundColor: zColorRgba().default([0, 0, 0, 0]).describe('Background Color'),
  center: zCenter(2).default([0, 0]).describe('Center'),
  density: zFloat(0, 1, 0.01).default(0.3).describe('Density'),
  intensity: zFloat(0, 1, 0.01).default(0.8).describe('Intensity'),
  spotty: zFloat(0, 1, 0.01).default(1).describe('Spotty'),
  speed: zFloat(0, 2, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'God Rays',
  description: 'Volumetric light rays emanating from a point',
  color: '#facc15',
  category: 'textures',
  defaultBlendMode: 'add',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class GodRays extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'godrays'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const rayColor = this.uniformName('rayColor')
    const backgroundColor = this.uniformName('backgroundColor')
    const center = this.uniformName('center')
    const density = this.uniformName('density')
    const intensity = this.uniformName('intensity')
    const spotty = this.uniformName('spotty')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['valueNoise'],
      main: `
float aspect = u_resolution.x / u_resolution.y;
vec2 centerUV = ${center} * 0.5 + 0.5;
vec2 delta = uv - centerUV;
vec2 shapeUV = vec2(delta.x * aspect, delta.y);
float radius = length(shapeUV);
float angle = atan(shapeUV.y, shapeUV.x);
float angleWrapped = mod(angle, 6.2831853);
float blend = smoothstep(-0.15, 0.15, shapeUV.x);
float spots = 6.5 * abs(${spotty});
float intensityExp = 4.0 - 3.0 * clamp(${intensity}, 0.0, 1.0);
float dens = 6.0 * ${density};
float animTime = u_time * ${speed} * 0.2;

float r1 = radius - animTime * 3.0;
float r2 = radius * 0.5 * (1.0 + spots) - animTime * 2.0;
float f1 = dens * 5.0;
float nL1 = pow(valueNoise(vec2(angle * f1, r1)), intensityExp);
float nR1 = pow(valueNoise(vec2(angleWrapped * f1, r1)), intensityExp);
float rayA = mix(nR1, nL1, blend);
float nL1b = pow(valueNoise(vec2(angle * f1 * 4.0, r2)), intensityExp);
float nR1b = pow(valueNoise(vec2(angleWrapped * f1 * 4.0, r2)), intensityExp);
rayA *= mix(nR1b, nL1b, blend);

float r3 = radius * 1.4 - animTime * 2.5;
float r4 = radius * 0.7 * (1.0 + spots) - animTime * 1.8;
float f2 = dens * 4.5;
float nL2 = pow(valueNoise(vec2(angle * f2, r3)), intensityExp);
float nR2 = pow(valueNoise(vec2(angleWrapped * f2, r3)), intensityExp);
float rayB = mix(nR2, nL2, blend);
float nL2b = pow(valueNoise(vec2(angle * f2 * 3.5, r4)), intensityExp);
float nR2b = pow(valueNoise(vec2(angleWrapped * f2 * 3.5, r4)), intensityExp);
rayB *= mix(nR2b, nL2b, blend);

float rayEffect = clamp(rayA + rayB * 0.7, 0.0, 1.0);

vec4 rc = ${rayColor};
vec4 bg = ${backgroundColor};
float rayAlpha = rayEffect * rc.a;
float finalAlpha = rayAlpha + bg.a * (1.0 - rayAlpha);
vec3 rayContribution = rc.rgb * rayAlpha;
vec3 bgContribution = bg.rgb * bg.a * (1.0 - rayAlpha);
return vec4(rayContribution + bgContribution, finalAlpha);`,
    }
  }
}

register(GodRays)
export default GodRays
