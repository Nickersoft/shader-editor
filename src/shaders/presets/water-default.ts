import { chain } from '@/shaders/core/chain'
import GlowField from '@/shaders/effects/glow-field'
import ImageSource from '@/shaders/textures/image-source'
import WaterRipple from '@/shaders/distortion/water-ripple'

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
  .pipe(new WaterRipple({
    config: {
      amplitude: 0.02,
      frequency: 14,
      speed: 0.8,
      focalX: 0.5,
      focalY: 0.5,
      noiseAmount: 0.4,
      noiseScale: 5,
    },
  }))
  .pipe(new GlowField({
    config: {
      color: [0.8, 0.95, 1],
      radius: 4,
      intensity: 0.3,
      threshold: 0.6,
      composite: 0.4,
    },
  }))
