import { chain } from '@/shaders/core/chain'
import RadialGradient from '@/shaders/textures/radial-gradient'

export default chain()
  .pipe(new RadialGradient({
    config: {
      colors: {
        values: [
          [0.95, 0.85, 0.5, 1],
          [0.6, 0.3, 0.7, 1],
          [0.05, 0.05, 0.15, 1],
        ],
        length: 3,
      },
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.7,
      falloff: 1.2,
    },
  }))
