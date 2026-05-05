import { chain } from '@/shaders/core/chain'
import SpiralStripe from '@/shaders/textures/spiral-stripe'

export default chain()
  .pipe(new SpiralStripe({
    config: {
      colorBack: [0.02, 0.1, 0.04],
      colorFront: [0.4, 0.9, 0.3],
      density: 0.7,
      strokeWidth: 0.35,
      strokeTaper: 0.3,
      strokeCap: 0.5,
      distortion: 0.2,
      noiseAmount: 0.3,
      noiseFreq: 0.5,
      softness: 0.1,
      speed: 0.3,
    },
  }))
