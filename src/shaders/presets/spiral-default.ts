import { chain } from '@/shaders/core/chain'
import SpiralStripe from '@/shaders/textures/spiral-stripe'

export default chain()
  .pipe(new SpiralStripe({
    config: {
      colorBack: [0.05, 0.05, 0.08],
      colorFront: [0.95, 0.85, 0.4],
      density: 0.5,
      strokeWidth: 0.5,
      strokeTaper: 0,
      strokeCap: 0,
      distortion: 0,
      noiseAmount: 0,
      noiseFreq: 0.5,
      softness: 0,
      speed: 0.5,
    },
  }))
