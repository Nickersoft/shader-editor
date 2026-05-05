import { chain } from '@/shaders/core/chain'
import PolarBands from '@/shaders/textures/polar-bands'

export default chain()
  .pipe(new PolarBands({
    config: {
      colorBack: [0.02, 0.02, 0.05],
      color1: [1, 0.9, 0.4],
      color2: [0.95, 0.3, 0.5],
      color3: [0.3, 0.5, 1],
      bandCount: 4,
      twist: 0.4,
      centerSize: 0.3,
      proportion: 0.5,
      softness: 0,
      noiseAmount: 0,
      speed: 0.4,
    },
  }))
