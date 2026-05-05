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
} from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColorRgba().default([0.95, 0.95, 0.97, 1.0]).describe('Background'),
  colorTint: zColorRgba().default([0.55, 0.65, 1.0, 0.0]).describe('Tint'),
  angle: zAngle().default(0.0).describe('Angle'),
  repetition: zFloat(1, 10, 0.1).default(4.0).describe('Repetition'),
  softness: zFloat(0, 1).default(0.5).describe('Softness'),
  shiftRed: zFloat(-1, 1).default(0.3).describe('Shift Red'),
  shiftBlue: zFloat(-1, 1).default(-0.3).describe('Shift Blue'),
  distortion: zFloat(0, 1).default(0.5).describe('Distortion'),
  contour: zFloat(0, 1).default(0.4).describe('Contour'),
  speed: zFloat(0, 4, 0.05).default(0.3).describe('Speed'),
})

const inputs = z.object({
  image: zImageInput().default(noImageContain).describe('Image'),
})

const meta: NodeMeta = {
  name: 'Liquid Metal',
  description:
    'liquid-metal chrome stripe effect over an image silhouette. CPU preprocess solves a Poisson interior gradient; the GLSL render samples it for animated chrome stripes with chromatic dispersion.',
  color: '#cbd5e1',
  category: 'textures',
  defaultBlendMode: 'normal',
  outputKind: 'rgba',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LiquidMetal extends ProcessingNode<Config, Inputs> {
  static readonly typeId = 'liquid-metal'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  async preprocess(): Promise<{ dataUrl: string } | null> {
    const url = this.inputs.image.url
    if (!url) return null
    const { pngBlob } = await processLiquidMetal(url)
    const dataUrl = await blobToDataUrl(pngBlob)
    return { dataUrl }
  }

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorTint = this.uniformName('colorTint')
    const angle = this.uniformName('angle')
    const repetition = this.uniformName('repetition')
    const softness = this.uniformName('softness')
    const shiftRed = this.uniformName('shiftRed')
    const shiftBlue = this.uniformName('shiftBlue')
    const distortion = this.uniformName('distortion')
    const contour = this.uniformName('contour')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['pi', 'rotate', 'snoise', 'colorBandingFix'],
      functions: `
float lmGetColorChanges(float c1, float c2, float stripeP, vec3 w, float blur, float bump, float tint, float tintAlpha) {
  float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripeP));
  float border = w.x;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripeP));
  float bumpAdj = smoothstep(0.2, 0.8, bump);
  border = w.x + 0.4 * (1.0 - bumpAdj) * w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripeP));
  border = w.x + 0.5 * (1.0 - bumpAdj) * w.y;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripeP));
  border = w.x + w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripeP));
  float gradientT = (stripeP - w.x - w.y) / max(w.z, 1e-4);
  float gradient = mix(c1, c2, smoothstep(0.0, 1.0, gradientT));
  ch = mix(ch, gradient, smoothstep(border, border + 0.5 * blur, stripeP));
  return mix(ch, 1.0 - min(1.0, (1.0 - ch) / max(tint, 0.0001)), tintAlpha);
}
float lmGetImgFrame(vec2 uv, float th) {
  float frame = 1.0;
  frame *= smoothstep(0.0, th, uv.y);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.y);
  frame *= smoothstep(0.0, th, uv.x);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.x);
  return frame;
}
float lmBlurEdge3x3(sampler2D tex, vec2 uv, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;
  float sum = 4.0 * centerSample;
  sum += 2.0 * texture(tex, uv + vec2(0.0, -r.y)).r;
  sum += 2.0 * texture(tex, uv + vec2(0.0, r.y)).r;
  sum += 2.0 * texture(tex, uv + vec2(-r.x, 0.0)).r;
  sum += 2.0 * texture(tex, uv + vec2(r.x, 0.0)).r;
  sum += texture(tex, uv + vec2(-r.x, -r.y)).r;
  sum += texture(tex, uv + vec2(r.x, -r.y)).r;
  sum += texture(tex, uv + vec2(-r.x, r.y)).r;
  sum += texture(tex, uv + vec2(r.x, r.y)).r;
  return sum / 16.0;
}`,
      main: `
float t = 0.3 * (u_time * ${speed} + 2.8);
vec4 img = texture(u_prevPass, uv);

float cycleWidth = ${repetition};
float edgeRaw = img.r;
float edge = lmBlurEdge3x3(u_prevPass, uv, 6.0, edgeRaw);
edge = pow(edge, 1.6);
edge *= mix(0.0, 1.0, smoothstep(0.0, 0.4, ${contour}));

float opacity = img.g * lmGetImgFrame(uv, 0.0);

vec2 rotatedUV = uv - 0.5;
float angle = (-${angle} + 70.0) * PI / 180.0;
rotatedUV = vec2(
  rotatedUV.x * cos(angle) - rotatedUV.y * sin(angle),
  rotatedUV.x * sin(angle) + rotatedUV.y * cos(angle)
) + 0.5;

float diagBLtoTR = rotatedUV.x - rotatedUV.y;
float diagTLtoBR = rotatedUV.x + rotatedUV.y;

vec3 color1 = vec3(0.98, 0.98, 1.0);
vec3 color2 = vec3(0.1, 0.1, 0.1 + 0.1 * smoothstep(0.7, 1.3, diagTLtoBR));

vec2 gradUv = uv - 0.5;
float dist = length(gradUv + vec2(0.0, 0.2 * diagBLtoTR));
gradUv = rotate(gradUv, (0.25 - 0.2 * diagBLtoTR) * PI);
float direction = gradUv.x;

float bump = 1.0 - pow(1.8 * dist, 1.2);
bump *= pow(uv.y, 0.3);

float thin1Ratio = 0.12 / cycleWidth * (1.0 - 0.4 * bump);
float thin2Ratio = 0.07 / cycleWidth * (1.0 + 0.4 * bump);
float wideRatio = 1.0 - thin1Ratio - thin2Ratio;
float noise = snoise(uv - t);
edge += (1.0 - edge) * ${distortion} * noise;

direction += diagBLtoTR;
direction -= 2.0 * noise * diagBLtoTR * (smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge)));
direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, ${contour}));
direction -= 1.7 * edge * smoothstep(0.5, 1.0, ${contour});
direction += 0.2 * pow(${contour}, 4.0) * (1.0 - smoothstep(0.0, 1.0, edge));

bump *= clamp(pow(uv.y, 0.1), 0.3, 1.0);
direction *= 0.1 + (1.1 - edge) * bump;
direction *= 0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge));
direction += 0.18 * (smoothstep(0.1, 0.2, uv.y) * (1.0 - smoothstep(0.2, 0.4, uv.y)));
direction += 0.03 * (smoothstep(0.1, 0.2, 1.0 - uv.y) * (1.0 - smoothstep(0.2, 0.4, 1.0 - uv.y)));
direction *= 0.5 + 0.5 * pow(uv.y, 2.0);
direction *= cycleWidth;
direction -= t;

float colorDispersion = clamp(1.0 - bump, 0.0, 1.0);
float dispersionRed = colorDispersion + 0.03 * bump * noise;
dispersionRed += 5.0 * (smoothstep(-0.1, 0.2, uv.y) * (1.0 - smoothstep(0.1, 0.5, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 1.0, bump)));
dispersionRed -= diagBLtoTR;
float dispersionBlue = colorDispersion * 1.3;
dispersionBlue += (smoothstep(0.0, 0.4, uv.y) * (1.0 - smoothstep(0.1, 0.8, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 0.8, bump)));
dispersionBlue -= 0.2 * edge;
dispersionRed *= ${shiftRed} / 20.0;
dispersionBlue *= ${shiftBlue} / 20.0;

float softness = 0.05 * ${softness};
float blur = softness + 0.5 * smoothstep(1.0, 10.0, ${repetition}) * smoothstep(0.0, 1.0, edge);
float smallCanvasT = 1.0 - smoothstep(100.0, 500.0, min(u_resolution.x, u_resolution.y));
blur += smallCanvasT * smoothstep(0.0, 1.0, edge);
float rExtraBlur = softness * (0.05 + 0.1 * (${shiftRed} / 20.0) * bump);
float gExtraBlur = softness * 0.05 / max(0.001, abs(1.0 - diagBLtoTR));

vec3 w = vec3(cycleWidth * thin1Ratio, cycleWidth * thin2Ratio, wideRatio);
w.y -= 0.02 * smoothstep(0.0, 1.0, edge + bump);
float tintA = ${colorTint}.a;
float stripeR = fract(direction + dispersionRed);
float r = lmGetColorChanges(color1.r, color2.r, stripeR, w, blur + fwidth(stripeR) + rExtraBlur, bump, ${colorTint}.r, tintA);
float stripeG = fract(direction);
float g = lmGetColorChanges(color1.g, color2.g, stripeG, w, blur + fwidth(stripeG) + gExtraBlur, bump, ${colorTint}.g, tintA);
float stripeB = fract(direction - dispersionBlue);
float b = lmGetColorChanges(color1.b, color2.b, stripeB, w, blur + fwidth(stripeB), bump, ${colorTint}.b, tintA);

vec3 color = vec3(r, g, b) * opacity;
vec3 bgColor = ${colorBack}.rgb * ${colorBack}.a;
color = color + bgColor * (1.0 - opacity);
float outA = opacity + ${colorBack}.a * (1.0 - opacity);
return vec4(colorBandingFix(color), outA);`,
    }
  }
}

register(LiquidMetal)
export default LiquidMetal

// ---------------------------------------------------------------------------
// CPU preprocessor (was `toProcessedLiquidMetal` in
// lib/shader-composer/preprocessors.ts). Localized so adding a new
// ProcessingNode never requires touching a central preprocessor table.
//
// Solves a Poisson equation across the alpha mask to produce a smooth interior
// gradient (R=gradient, G=alpha) used by the fragment shader.
// ---------------------------------------------------------------------------

const POISSON_CONFIG = {
  workingSize: 512,
  iterations: 40,
} as const

interface SparsePixelData {
  interiorPixels: Uint32Array
  boundaryPixels: Uint32Array
  pixelCount: number
  // [east, west, north, south] per interior pixel; -1 = out of mask.
  neighborIndices: Int32Array
}

function processLiquidMetal(
  file: File | string,
): Promise<{ imageData: ImageData; pngBlob: Blob }> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const isBlob = typeof file === 'string' && file.startsWith('blob:')

  return new Promise((resolve, reject) => {
    if (!file || !ctx) {
      reject(new Error('Invalid file or canvas context'))
      return
    }

    const blobContentTypePromise = isBlob
      ? fetch(file).then((res) => res.headers.get('Content-Type'))
      : Promise.resolve(null)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = async () => {
      let isSVG: boolean
      const blobContentType = await blobContentTypePromise
      if (blobContentType) {
        isSVG = blobContentType === 'image/svg+xml'
      } else if (typeof file === 'string') {
        isSVG = file.endsWith('.svg') || file.startsWith('data:image/svg+xml')
      } else {
        isSVG = file.type === 'image/svg+xml'
      }

      let originalWidth = img.width || img.naturalWidth
      let originalHeight = img.height || img.naturalHeight

      if (isSVG) {
        const svgMaxSize = 4096
        const aspectRatio = originalWidth / originalHeight
        if (originalWidth > originalHeight) {
          originalWidth = svgMaxSize
          originalHeight = svgMaxSize / aspectRatio
        } else {
          originalHeight = svgMaxSize
          originalWidth = svgMaxSize * aspectRatio
        }
        img.width = originalWidth
        img.height = originalHeight
      }

      const minDimension = Math.min(originalWidth, originalHeight)
      const scaleFactor = POISSON_CONFIG.workingSize / minDimension
      const width = Math.round(originalWidth * scaleFactor)
      const height = Math.round(originalHeight * scaleFactor)

      canvas.width = originalWidth
      canvas.height = originalHeight

      const shapeCanvas = document.createElement('canvas')
      shapeCanvas.width = width
      shapeCanvas.height = height
      const shapeCtx = shapeCanvas.getContext('2d')
      if (!shapeCtx) {
        reject(new Error('Failed to get shape canvas context'))
        return
      }
      shapeCtx.drawImage(img, 0, 0, width, height)

      const data = shapeCtx.getImageData(0, 0, width, height).data
      const shapeMask = new Uint8Array(width * height)
      const boundaryMask = new Uint8Array(width * height)

      for (let i = 0, idx = 0; i < data.length; i += 4, idx++) {
        const a = data[i + 3] ?? 0
        shapeMask[idx] = a === 0 ? 0 : 1
      }

      const boundaryIndices: number[] = []
      const interiorIndices: number[] = []
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          if (!shapeMask[idx]) continue

          let isBoundary = false
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            isBoundary = true
          } else {
            isBoundary =
              !shapeMask[idx - 1] ||
              !shapeMask[idx + 1] ||
              !shapeMask[idx - width] ||
              !shapeMask[idx + width] ||
              !shapeMask[idx - width - 1] ||
              !shapeMask[idx - width + 1] ||
              !shapeMask[idx + width - 1] ||
              !shapeMask[idx + width + 1]
          }

          if (isBoundary) {
            boundaryMask[idx] = 1
            boundaryIndices.push(idx)
          } else {
            interiorIndices.push(idx)
          }
        }
      }

      const sparseData = buildSparseData(
        shapeMask,
        new Uint32Array(interiorIndices),
        new Uint32Array(boundaryIndices),
        width,
        height,
      )
      const u = solvePoissonSparse(sparseData, width)

      let maxVal = 0
      for (let i = 0; i < interiorIndices.length; i++) {
        const idx = interiorIndices[i]!
        if (u[idx]! > maxVal) maxVal = u[idx]!
      }

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        reject(new Error('Failed to get temp canvas context'))
        return
      }
      const tempImg = tempCtx.createImageData(width, height)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          const px = idx * 4
          if (!shapeMask[idx]) {
            tempImg.data[px] = 255
            tempImg.data[px + 1] = 255
            tempImg.data[px + 2] = 255
            tempImg.data[px + 3] = 0
          } else {
            const poissonRatio = u[idx]! / Math.max(1e-6, maxVal)
            const gray = 255 * (1 - poissonRatio)
            tempImg.data[px] = gray
            tempImg.data[px + 1] = gray
            tempImg.data[px + 2] = gray
            tempImg.data[px + 3] = 255
          }
        }
      }
      tempCtx.putImageData(tempImg, 0, 0)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, originalWidth, originalHeight)
      const outImg = ctx.getImageData(0, 0, originalWidth, originalHeight)

      const originalCanvas = document.createElement('canvas')
      originalCanvas.width = originalWidth
      originalCanvas.height = originalHeight
      const originalCtx = originalCanvas.getContext('2d')
      if (!originalCtx) {
        reject(new Error('Failed to get original canvas context'))
        return
      }
      originalCtx.drawImage(img, 0, 0, originalWidth, originalHeight)
      const originalData = originalCtx.getImageData(0, 0, originalWidth, originalHeight)

      for (let i = 0; i < outImg.data.length; i += 4) {
        const a = originalData.data[i + 3]!
        const upscaledAlpha = outImg.data[i + 3]!
        if (a === 0) {
          outImg.data[i] = 255
          outImg.data[i + 1] = 0
        } else {
          outImg.data[i] = upscaledAlpha === 0 ? 0 : outImg.data[i]!
          outImg.data[i + 1] = a
        }
        outImg.data[i + 2] = 255
        outImg.data[i + 3] = 255
      }

      ctx.putImageData(outImg, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'))
          return
        }
        resolve({ imageData: outImg, pngBlob: blob })
      }, 'image/png')
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = typeof file === 'string' ? file : URL.createObjectURL(file)
  })
}

function buildSparseData(
  shapeMask: Uint8Array,
  interiorPixels: Uint32Array,
  boundaryPixels: Uint32Array,
  width: number,
  height: number,
): SparsePixelData {
  const pixelCount = interiorPixels.length
  const neighborIndices = new Int32Array(pixelCount * 4)

  for (let i = 0; i < pixelCount; i++) {
    const idx = interiorPixels[i]!
    const x = idx % width
    const y = Math.floor(idx / width)
    neighborIndices[i * 4 + 0] = x < width - 1 && shapeMask[idx + 1] ? idx + 1 : -1
    neighborIndices[i * 4 + 1] = x > 0 && shapeMask[idx - 1] ? idx - 1 : -1
    neighborIndices[i * 4 + 2] = y > 0 && shapeMask[idx - width] ? idx - width : -1
    neighborIndices[i * 4 + 3] = y < height - 1 && shapeMask[idx + width] ? idx + width : -1
  }

  return { interiorPixels, boundaryPixels, pixelCount, neighborIndices }
}

// Red-Black SOR Poisson solver — converges in ~40 iterations vs. hundreds for
// plain Gauss-Seidel; ω≈1.9 is near-optimal for grid Laplacians.
function solvePoissonSparse(
  sparseData: SparsePixelData,
  width: number,
): Float32Array {
  const ITERATIONS = POISSON_CONFIG.iterations
  const C = 0.01
  const omega = 1.9
  const { interiorPixels, neighborIndices, pixelCount } = sparseData
  let maxIdx = 0
  for (let i = 0; i < pixelCount; i++) {
    const idx = interiorPixels[i]!
    if (idx > maxIdx) maxIdx = idx
  }
  const buf = new Float32Array(maxIdx + 1)

  const redPixels: number[] = []
  const blackPixels: number[] = []
  for (let i = 0; i < pixelCount; i++) {
    const idx = interiorPixels[i]!
    const x = idx % width
    const y = Math.floor(idx / width)
    if ((x + y) % 2 === 0) redPixels.push(i)
    else blackPixels.push(i)
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (const i of redPixels) {
      const idx = interiorPixels[i]!
      const e = neighborIndices[i * 4 + 0]!
      const w = neighborIndices[i * 4 + 1]!
      const n = neighborIndices[i * 4 + 2]!
      const s = neighborIndices[i * 4 + 3]!
      let sumN = 0
      if (e >= 0) sumN += buf[e]!
      if (w >= 0) sumN += buf[w]!
      if (n >= 0) sumN += buf[n]!
      if (s >= 0) sumN += buf[s]!
      const newValue = (C + sumN) / 4
      buf[idx] = omega * newValue + (1 - omega) * buf[idx]!
    }
    for (const i of blackPixels) {
      const idx = interiorPixels[i]!
      const e = neighborIndices[i * 4 + 0]!
      const w = neighborIndices[i * 4 + 1]!
      const n = neighborIndices[i * 4 + 2]!
      const s = neighborIndices[i * 4 + 3]!
      let sumN = 0
      if (e >= 0) sumN += buf[e]!
      if (w >= 0) sumN += buf[w]!
      if (n >= 0) sumN += buf[n]!
      if (s >= 0) sumN += buf[s]!
      const newValue = (C + sumN) / 4
      buf[idx] = omega * newValue + (1 - omega) * buf[idx]!
    }
  }
  return buf
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
