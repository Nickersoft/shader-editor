import { chain } from '@/shaders/core/chain'
import GodRays from '@/shaders/overlays/god-rays'

export default chain()
  .pipe(new GodRays({
    config: {
      color: [1, 0.9, 0.6],
      centerX: 0.5,
      centerY: 0.5,
      density: 30,
      intensity: 0.6,
      falloff: 1.5,
      speed: 0.2,
    },
  }))
