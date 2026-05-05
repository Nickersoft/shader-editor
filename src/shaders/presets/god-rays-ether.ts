import { chain } from '@/shaders/core/chain'
import GlowField from '@/shaders/effects/glow-field'
import GodRays from '@/shaders/overlays/god-rays'

export default chain()
  .pipe(new GodRays({
    config: {
      color: [0.4, 0.8, 1],
      centerX: 0.5,
      centerY: 0.7,
      density: 50,
      intensity: 0.8,
      falloff: 2,
      speed: 0.15,
    },
  }))
  .pipe(new GlowField({
    config: {
      color: [0.3, 0.7, 1],
      radius: 12,
      intensity: 0.8,
      threshold: 0.2,
      composite: 1,
    },
  }))
