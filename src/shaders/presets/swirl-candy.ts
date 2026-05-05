import { chain } from '@/shaders/core/chain'
import PolarBands from '@/shaders/textures/polar-bands'

export default chain()
  .pipe(new PolarBands({
    config: {
      colorBack: [0.98, 0.92, 0.95],
      color1: [0.95, 0.3, 0.55],
      color2: [0.3, 0.65, 0.95],
      color3: [0.95, 0.7, 0.2],
      bandCount: 6,
      twist: 0.3,
      centerSize: 0.2,
      proportion: 0.4,
      softness: 0.3,
      noiseAmount: 0.1,
      speed: 0.6,
    },
  }))
