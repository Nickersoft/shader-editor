import { chain } from '@/shaders/core/chain'
import ChromeRelief from '@/shaders/effects/chrome-relief'
import GlowField from '@/shaders/effects/glow-field'
import ImageSource from '@/shaders/textures/image-source'
import OrganicWarp from '@/shaders/distortion/organic-warp'
import Smoke from '@/shaders/overlays/smoke'

export default chain()
  .pipe(new ImageSource({
    config: {
      tint: [1, 1, 1, 1],
    },
    inputs: {
      image: {
        url: null,
        sourceKind: "url",
        fit: "cover",
      },
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.15,
      swirl: 0.3,
      scale: 1,
      speed: 0.6,
      centerFalloff: 0,
      iterations: 2,
    },
  }))
  .pipe(new ChromeRelief({
    config: {
      lightAngle: 120,
      intensity: 1.4,
      ambient: 0.4,
      specular: 0.5,
      thickness: 1,
    },
  }))
  .pipe(new Smoke({
    config: {
      color: [0.7, 0.85, 1],
      scale: 4,
      speed: 0.6,
      density: 0.55,
      softness: 0.7,
    },
    blendMode: "screen",
  }))
  .pipe(new GlowField({
    config: {
      color: [0.9, 0.7, 1],
      radius: 8,
      intensity: 0.5,
      threshold: 0.5,
      composite: 0.5,
    },
  }))
