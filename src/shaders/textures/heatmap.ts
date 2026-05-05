import { z } from 'zod'
import { ProcessingNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import {
  noImageContain,
  zAngle,
  zColorRgba,
  zFloat,
  zImageInput,
  zPalette,
  type Palette,
} from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColorRgba().default([0.02, 0.02, 0.05, 1.0]).describe('Background'),
  colors: zPalette(10)
    .default({
      values: [
        [0.08, 0.12, 0.45, 1],
        [0.0, 0.65, 0.85, 1],
        [0.95, 0.45, 0.12, 1],
        [1.0, 0.95, 0.65, 1],
      ],
      length: 4,
    } satisfies Palette)
    .describe('Colors'),
  angle: zAngle().default(0).describe('Angle'),
  noise: zFloat(0, 1).default(0.2).describe('Noise'),
  innerGlow: zFloat(0, 1).default(0.5).describe('Inner Glow'),
  outerGlow: zFloat(0, 1).default(0.5).describe('Outer Glow'),
  contour: zFloat(0, 1).default(0.5).describe('Contour'),
  speed: zFloat(0, 4, 0.05).default(1.0).describe('Speed'),
})

const inputs = z.object({
  image: zImageInput().default(noImageContain).describe('Image'),
})

const meta: NodeMeta = {
  name: 'Heatmap',
  description:
    'Animated heatmap glow over an image silhouette. Multi-stop color mapping with inner/outer glow + contour + film noise.',
  color: '#f97316',
  category: 'textures',
  defaultBlendMode: 'normal',
  outputKind: 'rgba',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Heatmap extends ProcessingNode<Config, Inputs> {
  static readonly typeId = 'heatmap'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  async preprocess(): Promise<{ dataUrl: string } | null> {
    const url = this.inputs.image.url
    if (!url) return null
    const blob = await processHeatmap(url)
    const dataUrl = await blobToDataUrl(blob)
    return { dataUrl }
  }

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colors = this.uniformName('colors')
    const angle = this.uniformName('angle')
    const noise = this.uniformName('noise')
    const innerGlow = this.uniformName('innerGlow')
    const outerGlow = this.uniformName('outerGlow')
    const contour = this.uniformName('contour')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['pi'],
      functions: `
float hwGetImgFrame(vec2 uv, float th) {
  float frame = 1.0;
  frame *= smoothstep(0.0, th, uv.y);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.y);
  frame *= smoothstep(0.0, th, uv.x);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.x);
  return frame;
}
float hwCircle(vec2 uv, vec2 c, vec2 r) {
  return 1.0 - smoothstep(r.x, r.y, length(uv - c));
}
float hwLst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}
float hwSst(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
float hwShadowShape(vec2 uv, float t, float contour) {
  vec2 scaledUV = uv;
  float posY = mix(-1.0, 2.0, t);
  scaledUV.y -= 0.5;
  float mainCircleScale = hwSst(0.0, 0.8, posY) * hwLst(1.4, 0.9, posY);
  scaledUV *= vec2(1.0, 1.0 + 1.5 * mainCircleScale);
  scaledUV.y += 0.5;
  float s = hwCircle(scaledUV, vec2(0.5, posY - 0.2), vec2(0.4, 1.0 - 0.3 * (hwSst(0.1, 0.2, t) * (1.0 - hwSst(0.2, 0.5, t)))));
  s = pow(s, 1.4) * 1.2;
  float pos = posY - uv.y;
  float topFlattener = hwLst(-0.4, 0.0, pos) * (1.0 - hwSst(0.0, 1.2, pos));
  topFlattener = pow(topFlattener, 3.0);
  s = mix(topFlattener, s, 1.0 - hwSst(0.0, 0.3, pos));
  float rightCircle = hwCircle(uv, vec2(0.95 - 0.2 * cos(-2.0 - t * TWO_PI), 0.4 - 0.1 * sin(-2.0 - t * TWO_PI)), vec2(0.15, 0.3));
  s = mix(s, 0.0, rightCircle * hwSst(0.6, 0.7, t) * (1.0 - hwSst(0.8, 0.9, t)));
  float topCircle = hwCircle(uv, vec2(0.5, 0.19), vec2(0.05, 0.25));
  topCircle += 2.0 * contour * hwCircle(uv, vec2(0.5, 0.19), vec2(0.2, 0.5));
  s = mix(s, 0.0, topCircle * 0.55 * hwSst(0.2, 0.3, t) * (1.0 - hwSst(0.3, 0.45, t)));
  float leafMask = hwCircle(uv, vec2(0.53, 0.13), vec2(0.08, 0.19));
  leafMask = mix(leafMask, 0.0, 1.0 - hwSst(0.4, 0.54, uv.x));
  leafMask = mix(0.0, leafMask, hwSst(0.0, 0.2, uv.y));
  leafMask *= hwSst(0.5, 1.1, posY) * hwSst(1.5, 1.3, posY);
  s += leafMask;
  s = mix(s, 0.0, hwSst(0.0, 0.4, t) * (1.0 - hwSst(0.6, 0.8, t)) * hwCircle(uv, vec2(0.52, 0.92), vec2(0.09, 0.25)));
  float movingPos = hwSst(0.0, 0.6, t) * (1.0 - hwSst(0.6, 1.0, t));
  s = mix(s, 0.5, hwCircle(uv, vec2(0.0, 1.2 - 0.5 * movingPos), vec2(0.1, 0.3)));
  s = mix(s, 0.0, hwCircle(uv, vec2(1.0, 0.5 + 0.5 * movingPos), vec2(0.1, 0.3)));
  s = mix(s, 1.0, hwCircle(uv, vec2(0.95, 0.2 + 0.2 * hwSst(0.3, 0.4, t) * hwSst(0.7, 0.5, t)), vec2(0.07, 0.22)));
  s = mix(s, 1.0, hwCircle(uv, vec2(0.95, 0.2 + 0.2 * hwSst(0.3, 0.4, t) * (1.0 - hwSst(0.5, 0.7, t))), vec2(0.07, 0.22)));
  s /= max(1e-4, hwSst(1.0, 0.85, uv.y));
  return clamp(s, 0.0, 1.0);
}
float hwBlurEdge3x3(sampler2D tex, vec2 uv, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;
  float sum = 4.0 * centerSample;
  sum += 2.0 * texture(tex, uv + vec2(0.0, -r.y)).g;
  sum += 2.0 * texture(tex, uv + vec2(0.0, r.y)).g;
  sum += 2.0 * texture(tex, uv + vec2(-r.x, 0.0)).g;
  sum += 2.0 * texture(tex, uv + vec2(r.x, 0.0)).g;
  sum += texture(tex, uv + vec2(-r.x, -r.y)).g;
  sum += texture(tex, uv + vec2(r.x, -r.y)).g;
  sum += texture(tex, uv + vec2(-r.x, r.y)).g;
  sum += texture(tex, uv + vec2(r.x, r.y)).g;
  return sum / 16.0;
}`,
      main: `
vec2 imgUV = uv;
float imgSoftFrame = hwGetImgFrame(imgUV, 0.03);
vec4 img = texture(u_prevPass, imgUV);
if (img.a == 0.0) return ${colorBack};

float t = 0.1 * u_time * ${speed} - 0.3;
float t0 = mod(t, 1.0);
float t1 = mod(t + 1.0 / 3.0, 1.0);
float t2 = mod(t + 2.0 / 3.0, 1.0);
vec2 animationUV = imgUV - 0.5;
float angle = -${angle} * PI / 180.0;
animationUV = vec2(
  animationUV.x * cos(angle) - animationUV.y * sin(angle),
  animationUV.x * sin(angle) + animationUV.y * cos(angle)
) + 0.5;

float shape = img.r;
img.g = hwBlurEdge3x3(u_prevPass, imgUV, 8.0, img.g);
float outerBlur = 1.0 - mix(1.0, img.g, shape);
float innerBlur = mix(img.g, 0.0, shape);
float contourSample = mix(img.b, 0.0, shape);
outerBlur *= imgSoftFrame;

float shadow0 = hwShadowShape(animationUV, t0, innerBlur);
float shadow1 = hwShadowShape(animationUV, t1, innerBlur);
float shadow2 = hwShadowShape(animationUV, t2, innerBlur);
float inner = 0.8 + 0.8 * innerBlur;
inner = mix(inner, 0.0, shadow0);
inner = mix(inner, 0.0, shadow1);
inner = mix(inner, 0.0, shadow2);
inner *= mix(0.0, 2.0, ${innerGlow});
inner += (${contour} * 2.0) * contourSample;
inner = min(1.0, inner);
inner *= 1.0 - shape;
inner = pow(inner, 1.2);

float outerT = mod(t0 * 3.0 - 0.1, 1.0);
float yA = mod(animationUV.y - outerT, 1.0);
float animatedMask = smoothstep(0.3, 0.65, yA) * (1.0 - smoothstep(0.65, 1.0, yA));
float outer = 0.9 * pow(outerBlur, 0.8) * (0.5 + animatedMask);
outer *= mix(0.0, 5.0, pow(${outerGlow}, 2.0));
outer *= imgSoftFrame;

float heat = clamp(inner + outer, 0.0, 1.0);
heat += (0.005 + 0.35 * ${noise}) * (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5);
float mixer = heat * float(max(${colors}_count, 1));
vec4 gradient = ${colors}[0];
gradient.rgb *= gradient.a;
float outerShape = 0.0;
for (int i = 1; i < 11; i++) {
  if (i > max(${colors}_count, 1)) break;
  float m = clamp(mixer - float(i - 1), 0.0, 1.0);
  if (i == 1) outerShape = m;
  vec4 c = ${colors}[i - 1];
  c.rgb *= c.a;
  gradient = mix(gradient, c, m);
}
vec3 color = gradient.rgb * outerShape;
float opacity = gradient.a * outerShape;
vec3 bgColor = ${colorBack}.rgb * ${colorBack}.a;
color = color + bgColor * (1.0 - opacity);
opacity = opacity + ${colorBack}.a * (1.0 - opacity);
color += 0.02 * (fract(sin(dot(uv + 1.0, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5);
return vec4(color, opacity);`,
    }
  }
}

register(Heatmap)
export default Heatmap

// ---------------------------------------------------------------------------
// CPU preprocessor (was `toProcessedHeatmap` in lib/shader-composer/preprocessors.ts).
// Localized to this file so adding a new ProcessingNode never requires touching
// a central preprocessor table.
//
// Packs three blur radii into the output's RGB channels (R=contour edge,
// G=large outer blur, B=tight inner blur) so the fragment shader can sample
// one texture and recover all three.
// ---------------------------------------------------------------------------

function processHeatmap(file: File | string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const canvasSize = 1000

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.addEventListener('load', () => {
      const isSvg =
        typeof file === 'string'
          ? file.endsWith('.svg') || file.startsWith('data:image/svg+xml')
          : file.type === 'image/svg+xml'
      if (isSvg) {
        image.width = canvasSize
        image.height = canvasSize
      }

      const ratio = image.naturalWidth / image.naturalHeight
      const maxBlur = Math.floor(canvasSize * 0.15)
      const padding = Math.ceil(maxBlur * 2.5)
      let imgWidth = canvasSize
      let imgHeight = canvasSize
      if (ratio > 1) imgHeight = Math.floor(canvasSize / ratio)
      else imgWidth = Math.floor(canvasSize * ratio)

      canvas.width = imgWidth + 2 * padding
      canvas.height = imgHeight + 2 * padding

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'))
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, padding, padding, imgWidth, imgHeight)

      const { width, height } = canvas
      const src = ctx.getImageData(0, 0, width, height).data

      const totalPixels = width * height
      const gray = new Uint8ClampedArray(totalPixels)
      for (let i = 0; i < totalPixels; i++) {
        const px = i * 4
        const r = src[px] ?? 0
        const g = src[px + 1] ?? 0
        const b = src[px + 2] ?? 0
        gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) | 0
      }

      const bigBlurRadius = maxBlur
      const innerBlurRadius = Math.max(1, Math.round(0.12 * maxBlur))
      const contourRadius = 5

      const bigBlurGray = multiPassBlurGray(gray, width, height, bigBlurRadius, 3)
      const innerBlurGray = multiPassBlurGray(gray, width, height, innerBlurRadius, 3)
      const contourGray = multiPassBlurGray(gray, width, height, contourRadius, 1)

      const out = ctx.createImageData(width, height)
      const dst = out.data
      for (let i = 0; i < totalPixels; i++) {
        const px = i * 4
        dst[px] = contourGray[i] ?? 0
        dst[px + 1] = bigBlurGray[i] ?? 0
        dst[px + 2] = innerBlurGray[i] ?? 0
        dst[px + 3] = 255
      }
      ctx.putImageData(out, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'))
          return
        }
        resolve(blob)
      }, 'image/png')
    })

    image.addEventListener('error', () => {
      reject(new Error('Failed to load image'))
    })

    image.src = typeof file === 'string' ? file : URL.createObjectURL(file)
  })
}

// O(1)-per-pixel box blur via integral image.
function blurGray(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  if (radius <= 0) return gray.slice()

  const out = new Uint8ClampedArray(width * height)
  const integral = new Uint32Array(width * height)

  for (let y = 0; y < height; y++) {
    let rowSum = 0
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      rowSum += gray[idx] ?? 0
      integral[idx] = rowSum + (y > 0 ? (integral[idx - width] ?? 0) : 0)
    }
  }

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - radius)
    const y2 = Math.min(height - 1, y + radius)
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - radius)
      const x2 = Math.min(width - 1, x + radius)

      const A = integral[y2 * width + x2] ?? 0
      const B = x1 > 0 ? (integral[y2 * width + (x1 - 1)] ?? 0) : 0
      const C = y1 > 0 ? (integral[(y1 - 1) * width + x2] ?? 0) : 0
      const D = x1 > 0 && y1 > 0 ? (integral[(y1 - 1) * width + (x1 - 1)] ?? 0) : 0

      const sum = A - B - C + D
      const area = (x2 - x1 + 1) * (y2 - y1 + 1)
      out[y * width + x] = Math.round(sum / area)
    }
  }

  return out
}

function multiPassBlurGray(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  passes: number,
): Uint8ClampedArray {
  if (radius <= 0 || passes <= 1) return blurGray(gray, width, height, radius)
  let input = gray
  let tmp: Uint8ClampedArray = gray
  for (let p = 0; p < passes; p++) {
    tmp = blurGray(input, width, height, radius)
    input = tmp
  }
  return tmp
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('FileReader returned non-string result'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}
